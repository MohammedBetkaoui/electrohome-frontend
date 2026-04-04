import { getToken } from "./auth";

const API_URL = "http://localhost:8000/api/admin";

export type ClientStatus = "active" | "inactive" | "blocked";

export interface AdminClientOrder {
  id: string;
  date: string | null;
  total: number;
  status: string;
  statusColor: string;
  items: number;
}

export interface AdminClientReturn {
  id: string;
  date: string | null;
  status: string;
  statusColor: string;
  items: number;
  products: string[];
}

export interface AdminClient {
  userId: number;
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  address: string | null;
  wilaya: string | null;
  status: ClientStatus;
  createdAt: string | null;
  lastOrderAt: string | null;
  totalOrders: number;
  totalReturns: number;
  returnedProducts: string[];
  totalSpent: number;
  averageOrder: number;
}

export interface AdminClientDetail extends AdminClient {
  favoriteCategory: string;
  notes?: string | null;
  orders: AdminClientOrder[];
  returns: AdminClientReturn[];
}

export interface AdminClientStats {
  total: number;
  active: number;
  inactive: number;
  blocked: number;
  totalRevenue: number;
}

export interface ClientsListMeta {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

export interface ClientsListResponse {
  data: AdminClient[];
  meta: ClientsListMeta;
}

export interface GetClientsParams {
  search?: string;
  status?: ClientStatus | "all";
  sort_by?: "createdAt" | "name" | "totalOrders" | "totalSpent" | "lastOrderAt";
  sort_dir?: "asc" | "desc";
  per_page?: number;
  page?: number;
}

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = getToken();
  const headers = new Headers(options.headers || {});

  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("Accept", "application/json");

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 204) return null;

  const data = await response.json();

  if (!response.ok) {
    const error: any = new Error(data.message || "Une erreur est survenue");
    error.errors = data.errors;
    error.status = response.status;
    throw error;
  }

  return data;
}

export async function getClients(params: GetClientsParams = {}): Promise<ClientsListResponse> {
  const qs = new URLSearchParams();

  if (params.search) qs.set("search", params.search);
  if (params.status && params.status !== "all") qs.set("status", params.status);
  if (params.sort_by) qs.set("sort_by", params.sort_by);
  if (params.sort_dir) qs.set("sort_dir", params.sort_dir);
  if (params.per_page) qs.set("per_page", String(params.per_page));
  if (params.page) qs.set("page", String(params.page));

  const res = await fetchWithAuth(`/clients?${qs.toString()}`);
  return { data: res.data, meta: res.meta };
}

export async function getClient(id: number): Promise<AdminClientDetail> {
  const res = await fetchWithAuth(`/clients/${id}`);
  return res.data;
}

export async function getClientStats(): Promise<AdminClientStats> {
  const res = await fetchWithAuth("/clients/stats");
  return res.data;
}

export async function updateClientStatus(
  id: number,
  status: ClientStatus,
  note?: string,
): Promise<AdminClientDetail> {
  const res = await fetchWithAuth(`/clients/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, note: note || null }),
  });

  return res.data;
}

export function getClientsExportUrl(params: {
  search?: string;
  status?: ClientStatus | "all";
  sort_by?: string;
  sort_dir?: "asc" | "desc";
}): string {
  const qs = new URLSearchParams();

  if (params.search) qs.set("search", params.search);
  if (params.status && params.status !== "all") qs.set("status", params.status);
  if (params.sort_by) qs.set("sort_by", params.sort_by);
  if (params.sort_dir) qs.set("sort_dir", params.sort_dir);

  return `${API_URL}/clients/export?${qs.toString()}`;
}
