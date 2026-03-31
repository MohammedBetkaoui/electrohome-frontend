import type { CartItem, Product } from "../data/store";

export interface ResolvedCartItem {
  id: string;
  product: Product;
  effectiveProduct: Product;
  quantity: number;
  liveProduct: Product | null;
  stock: number | null;
  lineTotal: number;
  lineSavings: number;
  isMissing: boolean;
  isOutOfStock: boolean;
  exceedsStock: boolean;
  isValid: boolean;
}

export function getProductStock(product?: Product | null): number | null {
  if (!product || typeof product.stock !== "number" || Number.isNaN(product.stock)) {
    return null;
  }

  return Math.max(0, Math.floor(product.stock));
}

export function resolveCartItems(cart: CartItem[], liveProducts: Product[]): ResolvedCartItem[] {
  const productMap = new Map(liveProducts.map((product) => [product.id, product]));

  return cart.map((item) => {
    const liveProduct = productMap.get(item.product.id) || null;
    const effectiveProduct = liveProduct || item.product;
    const stock = getProductStock(liveProduct ?? item.product);
    const isMissing = liveProduct === null;
    const isOutOfStock = !isMissing && stock !== null && stock <= 0;
    const exceedsStock = !isMissing && stock !== null && stock > 0 && item.quantity > stock;
    const lineTotal = effectiveProduct.price * item.quantity;
    const lineSavings =
      effectiveProduct.oldPrice && effectiveProduct.oldPrice > effectiveProduct.price
        ? (effectiveProduct.oldPrice - effectiveProduct.price) * item.quantity
        : 0;

    return {
      id: item.product.id,
      product: item.product,
      effectiveProduct,
      quantity: item.quantity,
      liveProduct,
      stock,
      lineTotal,
      lineSavings,
      isMissing,
      isOutOfStock,
      exceedsStock,
      isValid: !isMissing && !isOutOfStock && !exceedsStock,
    };
  });
}

export function buildOrderItemsPayload(items: Array<{ id: string; quantity: number }>) {
  return items.map((item) => ({
    product_id: Number(item.id),
    quantity: item.quantity,
  }));
}
