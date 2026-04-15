import {
  getProducts,
  getReferences,
  updateProduct,
  type AdminProduct,
  type ReferencesData,
} from "./adminProducts";

export interface AdminPromotionsPayload {
  products: AdminProduct[];
  references: ReferencesData;
}

export async function getAdminPromotionsPayload(): Promise<AdminPromotionsPayload> {
  const [products, references] = await Promise.all([getProducts(), getReferences()]);

  return {
    products,
    references,
  };
}

type PromotionPatch = {
  price?: number;
  oldPrice?: number | null;
  status?: AdminProduct["status"];
};

function buildProductFormData(product: AdminProduct, patch: PromotionPatch = {}): FormData {
  const nextPrice = patch.price ?? product.price;
  const nextOldPrice = patch.oldPrice === undefined ? product.oldPrice ?? null : patch.oldPrice;
  const nextStatus = patch.status ?? product.status;
  const data = new FormData();

  data.append("name", product.name);
  data.append("sku", product.sku || "");
  data.append("brand_id", String(product.brand_id));
  data.append("category_id", String(product.category_id));
  data.append("price", String(nextPrice));
  data.append("stock", String(product.stock));
  data.append("status", nextStatus);
  data.append("energy", product.energy || "");
  data.append("specs", product.specs || "");
  data.append("description", product.description || "");

  if (typeof nextOldPrice === "number" && Number.isFinite(nextOldPrice) && nextOldPrice > 0) {
    data.append("oldPrice", String(nextOldPrice));
  }

  return data;
}

function parsePositiveAmount(value: number, fieldLabel: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${fieldLabel} doit etre superieur a 0.`);
  }

  return Number(value);
}

export async function saveAdminPromotion(
  product: AdminProduct,
  values: {
    price: number;
    oldPrice: number;
    status?: AdminProduct["status"];
  },
): Promise<void> {
  const price = parsePositiveAmount(values.price, "Le prix promotionnel");
  const oldPrice = parsePositiveAmount(values.oldPrice, "L'ancien prix");

  if (oldPrice <= price) {
    throw new Error("L'ancien prix doit etre strictement superieur au prix promotionnel.");
  }

  await updateProduct(
    product.id,
    buildProductFormData(product, {
      price,
      oldPrice,
      status: values.status ?? product.status,
    }),
  );
}

export async function removeAdminPromotion(product: AdminProduct): Promise<void> {
  await updateProduct(
    product.id,
    buildProductFormData(product, {
      oldPrice: null,
    }),
  );
}
