import { getToken } from "./auth";

const API_URL = "http://localhost:8000/api/admin";

export interface CategoryRef {
  id: number;
  name: string;
  slug: string;
}

export interface BrandRef {
  id: number;
  name: string;
}

export interface ReferencesData {
  categories: CategoryRef[];
  brands: BrandRef[];
}

export interface AdminProduct {
  id: number;
  slug: string;
  name: string;
  sku: string;
  brand_id: number;
  category_id: number;
  brand?: string;
  category?: string;
  price: number;
  oldPrice?: number | null;
  stock: number;
  status: "active" | "draft" | "outofstock";
  image?: string | null;
  energy?: string | null;
  specs?: string | null;
  description?: string | null;
  createdAt?: string;
}

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  
  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  
  headers.set("Accept", "application/json");

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Une erreur est survenue");
  }

  return data;
}

export async function getReferences(): Promise<ReferencesData> {
  const res = await fetchWithAuth("/references");
  return res.data;
}

export async function getProducts(): Promise<AdminProduct[]> {
  const res = await fetchWithAuth("/products");
  return res.data; // map happens in Laravel
}

// FormData expected for file upload
export async function createProduct(data: FormData): Promise<void> {
  await fetchWithAuth("/products", {
    method: "POST",
    body: data,
  });
}

export async function updateProduct(id: number, data: FormData): Promise<void> {
  // Laravel requires _method=PUT to handle multipart/form-data update requests correctly
  data.append("_method", "PUT");
  await fetchWithAuth(`/products/${id}`, {
    method: "POST",
    body: data,
  });
}

export async function deleteProduct(id: number): Promise<void> {
  await fetchWithAuth(`/products/${id}`, {
    method: "DELETE",
  });
}
