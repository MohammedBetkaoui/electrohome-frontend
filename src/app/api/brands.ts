const API_BASE = "http://localhost:8000/api";

interface CatalogBrandResponse {
  id: number;
  name: string;
  slug: string;
  logoUrl?: string | null;
  productsCount?: number | null;
}

export interface CatalogBrand {
  id: number;
  name: string;
  slug: string;
  logoUrl?: string;
  productsCount: number;
}

async function fetchBrands<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      Accept: "application/json",
    },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.message || "Impossible de charger les marques.");
  }

  return payload?.data as T;
}

function mapBrand(brand: CatalogBrandResponse): CatalogBrand {
  return {
    id: brand.id,
    name: brand.name,
    slug: brand.slug,
    logoUrl: brand.logoUrl || undefined,
    productsCount: Number(brand.productsCount ?? 0),
  };
}

export async function getCatalogBrands(limit?: number): Promise<CatalogBrand[]> {
  const searchParams = new URLSearchParams();

  if (limit) {
    searchParams.set("limit", String(limit));
  }

  const query = searchParams.toString();
  const endpoint = query ? `/brands?${query}` : "/brands";
  const brands = await fetchBrands<CatalogBrandResponse[]>(endpoint);
  return brands.map(mapBrand);
}
