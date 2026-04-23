import { getToken } from "./auth";

const API_URL = "http://localhost:8000/api/admin";

export interface Wilaya {
  id: number;
  name: string;
  delivery_price: number;
  delivery_price_agency: number;
  is_active: boolean;
}

export interface WeightPricing {
  id: number;
  max_weight_kg: number;
  price: number;
}

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = getToken();
  const headers = new Headers(options.headers || {});

  if (token) headers.set("Authorization", `Bearer ${token}`);
  headers.set("Accept", "application/json");
  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = payload?.message || "Erreur serveur";
    const err: Error & { errors?: Record<string, string[]> } = new Error(message);
    err.errors = payload?.errors;
    throw err;
  }

  return payload;
}

// ── Wilayas ────────────────────────────────────────────────────────────────

export async function getWilayas(): Promise<Wilaya[]> {
  const res = await fetchWithAuth("/wilayas");
  return res.data;
}

export async function createWilaya(data: Omit<Wilaya, "id">): Promise<Wilaya> {
  const res = await fetchWithAuth("/wilayas", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function updateWilaya(id: number, data: Omit<Wilaya, "id">): Promise<Wilaya> {
  const res = await fetchWithAuth(`/wilayas/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function deleteWilaya(id: number): Promise<void> {
  await fetchWithAuth(`/wilayas/${id}`, { method: "DELETE" });
}

// ── Tarifs par poids ───────────────────────────────────────────────────────

export async function getWeightPricings(): Promise<WeightPricing[]> {
  const res = await fetchWithAuth("/weight-pricings");
  return res.data;
}

export async function createWeightPricing(data: Omit<WeightPricing, "id">): Promise<WeightPricing> {
  const res = await fetchWithAuth("/weight-pricings", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function updateWeightPricing(id: number, data: Omit<WeightPricing, "id">): Promise<WeightPricing> {
  const res = await fetchWithAuth(`/weight-pricings/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function deleteWeightPricing(id: number): Promise<void> {
  await fetchWithAuth(`/weight-pricings/${id}`, { method: "DELETE" });
}
