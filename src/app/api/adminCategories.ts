import { getToken } from "./auth";

const API_URL = "http://localhost:8000/api/admin";

export interface AdminCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  parent_id: number | null;
  is_active: boolean;
  is_enabled: boolean;
  sort_order: number;
  icon: string | null;
  products_count?: number; // Added by withCount('products') in controller
}

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  
  // Toujours JSON car pas d'upload de fichier dans les catégories pour l'instant
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

export async function getCategories(): Promise<AdminCategory[]> {
  const res = await fetchWithAuth("/categories");
  return res.data;
}

export async function createCategory(data: Partial<AdminCategory>): Promise<AdminCategory> {
  const res = await fetchWithAuth("/categories", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function updateCategory(id: number, data: Partial<AdminCategory>): Promise<AdminCategory> {
  const res = await fetchWithAuth(`/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function deleteCategory(id: number): Promise<void> {
  await fetchWithAuth(`/categories/${id}`, {
    method: "DELETE",
  });
}

export async function toggleCategoryStatus(id: number): Promise<AdminCategory> {
  const res = await fetchWithAuth(`/categories/${id}/toggle`, {
    method: "PATCH",
  });
  return res.data;
}
