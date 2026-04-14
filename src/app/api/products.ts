import { IMAGES } from "../data/store";
import type { Product } from "../data/store";

const API_BASE = "http://localhost:8000/api";

interface CatalogProductResponse {
  id: number;
  slug: string;
  name: string;
  brand?: string | null;
  category?: string | null;
  categorySlug?: string | null;
  price: number;
  oldPrice?: number | null;
  stock: number;
  image?: string | null;
  images?: string[] | null;
  energy?: string | null;
  specs?: string | null;
  description?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  createdAt?: string | null;
}

export type CatalogProductsSort =
  | "relevance"
  | "newest"
  | "price_asc"
  | "price_desc"
  | "name_asc"
  | "discount_desc";

export interface CatalogProductsQuery {
  limit?: number;
  categorySlug?: string;
  q?: string;
  brand?: string | string[];
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  hasDiscount?: boolean;
  sort?: CatalogProductsSort;
}

async function fetchCatalog<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      Accept: "application/json",
    },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.message || "Impossible de charger les produits.");
  }

  return payload?.data as T;
}

function getFallbackImage(categorySlug?: string | null) {
  switch (categorySlug) {
    case "refrigerateurs":
      return IMAGES.fridge;
    case "machines-a-laver":
      return IMAGES.washer;
    case "fours":
      return IMAGES.oven;
    case "climatiseurs":
      return IMAGES.ac;
    case "lave-vaisselle":
      return IMAGES.dishwasher;
    case "aspirateurs":
      return IMAGES.vacuum;
    case "petit-electromenager":
      return IMAGES.coffee;
    case "tv-son":
      return IMAGES.tv;
    default:
      return IMAGES.store;
  }
}

function getBadge(product: CatalogProductResponse): Product["badge"] {
  if (product.oldPrice && product.oldPrice > product.price) {
    return "Promo";
  }

  if (!product.createdAt) {
    return undefined;
  }

  const createdAt = new Date(product.createdAt);
  const ageInDays = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
  return ageInDays <= 30 ? "Nouveau" : undefined;
}

function mapCatalogProduct(product: CatalogProductResponse): Product {
  const fallbackImage = getFallbackImage(product.categorySlug);
  const image = product.image || fallbackImage;
  const images = product.images?.length ? product.images : [image];

  return {
    id: String(product.id),
    slug: product.slug,
    name: product.name,
    brand: product.brand || "ElectroHome",
    price: Number(product.price) || 0,
    oldPrice: product.oldPrice ?? undefined,
    stock: Number(product.stock) || 0,
    image,
    images,
    rating: Number(product.rating ?? 0),
    reviewCount: Number(product.reviewCount ?? 0),
    badge: getBadge(product),
    category: product.categorySlug || "catalogue",
    specs: product.specs || product.energy || "Produit disponible",
    energy: product.energy || "-",
    description: product.description || undefined,
  };
}

export async function getCatalogProducts(
  limitOrOptions?: number | CatalogProductsQuery,
  categorySlugArg?: string,
): Promise<Product[]> {
  const options: CatalogProductsQuery = typeof limitOrOptions === "object" && limitOrOptions !== null
    ? limitOrOptions
    : { limit: limitOrOptions, categorySlug: categorySlugArg };

  const searchParams = new URLSearchParams();

  if (options.limit) {
    searchParams.set("limit", String(options.limit));
  }

  if (options.categorySlug) {
    searchParams.set("category", options.categorySlug);
  }

  if (options.q?.trim()) {
    searchParams.set("q", options.q.trim());
  }

  if (options.brand) {
    const brands = Array.isArray(options.brand) ? options.brand : [options.brand];
    const normalizedBrands = brands.map((brand) => brand.trim()).filter(Boolean);

    if (normalizedBrands.length > 0) {
      searchParams.set("brand", normalizedBrands.join(","));
    }
  }

  if (typeof options.minPrice === "number" && Number.isFinite(options.minPrice)) {
    searchParams.set("min_price", String(options.minPrice));
  }

  if (typeof options.maxPrice === "number" && Number.isFinite(options.maxPrice)) {
    searchParams.set("max_price", String(options.maxPrice));
  }

  if (options.inStock) {
    searchParams.set("in_stock", "1");
  }

  if (options.hasDiscount) {
    searchParams.set("has_discount", "1");
  }

  if (options.sort) {
    searchParams.set("sort", options.sort);
  }

  const query = searchParams.toString();
  const endpoint = query ? `/products?${query}` : "/products";
  const products = await fetchCatalog<CatalogProductResponse[]>(endpoint);
  return products.map(mapCatalogProduct);
}

export async function getCatalogProductsByIds(ids: string[]): Promise<Product[]> {
  const normalizedIds = Array.from(
    new Set(
      ids
        .map((id) => Number(id))
        .filter((id) => Number.isInteger(id) && id > 0),
    ),
  );

  if (normalizedIds.length === 0) {
    return [];
  }

  const searchParams = new URLSearchParams({
    ids: normalizedIds.join(","),
  });

  const products = await fetchCatalog<CatalogProductResponse[]>(`/products?${searchParams.toString()}`);
  return products.map(mapCatalogProduct);
}

export async function getCatalogProduct(slugOrId: string): Promise<Product> {
  const product = await fetchCatalog<CatalogProductResponse>(`/products/${slugOrId}`);
  return mapCatalogProduct(product);
}
