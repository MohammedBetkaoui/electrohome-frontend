import { IMAGES } from "../data/store";

const API_BASE = "http://localhost:8000/api";

interface CatalogCategoryResponse {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  productsCount?: number;
}

export interface CatalogCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string | null;
  count: number;
  image: string;
}

async function fetchCatalogCategories<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      Accept: "application/json",
    },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.message || "Impossible de charger les categories.");
  }

  return payload?.data as T;
}

function getCategoryFallbackImage(slug: string): string {
  switch (slug) {
    case "refrigerateurs":
    case "refrigerateurs-americains":
    case "congelateurs-coffre":
      return IMAGES.fridge;
    case "machines-a-laver":
    case "lave-linge":
      return IMAGES.washer;
    case "fours":
    case "micro-ondes":
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
    case "televiseurs":
      return IMAGES.tv;
    default:
      return IMAGES.store;
  }
}

function mapCatalogCategory(category: CatalogCategoryResponse): CatalogCategory {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description || undefined,
    icon: category.icon || undefined,
    count: Number(category.productsCount) || 0,
    image: getCategoryFallbackImage(category.slug),
  };
}

export async function getCatalogCategories(limit?: number): Promise<CatalogCategory[]> {
  const searchParams = new URLSearchParams();

  if (limit) {
    searchParams.set("limit", String(limit));
  }

  const query = searchParams.toString();
  const endpoint = query ? `/categories?${query}` : "/categories";
  const categories = await fetchCatalogCategories<CatalogCategoryResponse[]>(endpoint);
  return categories.map(mapCatalogCategory);
}
