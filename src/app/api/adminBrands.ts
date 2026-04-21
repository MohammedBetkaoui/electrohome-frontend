import { getToken } from "./auth";

const API_URL = "http://localhost:8000/api/admin";

export interface AdminBrand {
  id: number;
  name: string;
  slug: string;
  logo_url: string | null;
  products_count?: number;
}

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = getToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  headers.set("Content-Type", "application/json");
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

export async function getBrands(): Promise<AdminBrand[]> {
  const res = await fetchWithAuth("/brands");
  return res.data;
}

export async function createBrand(data: Partial<AdminBrand>): Promise<AdminBrand> {
  const res = await fetchWithAuth("/brands", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function updateBrand(id: number, data: Partial<AdminBrand>): Promise<AdminBrand> {
  const res = await fetchWithAuth(`/brands/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function deleteBrand(id: number): Promise<void> {
  await fetchWithAuth(`/brands/${id}`, {
    method: "DELETE",
  });
}
