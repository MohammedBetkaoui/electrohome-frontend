import { getToken } from "./auth";

const API_URL = "http://localhost:8000/api/admin";

export type ReturnStatus =
  | "pending"
  | "approved"
  | "pickup"
  | "received"
  | "inspecting"
  | "refunded"
  | "rejected";

export interface AdminReturnItem {
  name: string;
  sku: string;
  image: string | null;
  price: number;
  quantity: number;
}

export interface AdminReturnStatusHistory {
  status: ReturnStatus;
  note: string | null;
  createdAt: string | null;
  createdBy: { id: number; name: string } | null;
}

export interface AdminReturnPhoto {
  id: number;
  url: string;
  uploadedAt: string | null;
}

export interface AdminReturn {
  returnId: number;
  id: string;
  orderId: string | null;
  orderDbId: number;
  client: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  wilaya: string | null;
  items: AdminReturnItem[];
  reason: string | null;
  reasonLabel?: string | null;
  reasonDetail?: string | null;
  status: ReturnStatus;
  refundAmount: number;
  refundMethod: string | null;
  createdAt: string;
  updatedAt: string;
  photos?: number;
  adminNotes?: string | null;
}

export interface AdminReturnDetail extends AdminReturn {
  statusHistory?: AdminReturnStatusHistory[];
  photosList?: AdminReturnPhoto[];
}

export interface ReturnsListMeta {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

export interface ReturnsListResponse {
  data: AdminReturn[];
  meta: ReturnsListMeta;
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

export interface GetReturnsParams {
  search?: string;
  status?: ReturnStatus | "all";
  reason?: number | "all";
  sort_by?: "created_at" | "refund_amount" | "status";
  sort_dir?: "asc" | "desc";
  per_page?: number;
  page?: number;
}

export async function getReturns(params: GetReturnsParams = {}): Promise<ReturnsListResponse> {
  const qs = new URLSearchParams();

  if (params.search) qs.set("search", params.search);
  if (params.status && params.status !== "all") qs.set("status", params.status);
  if (params.reason && params.reason !== "all") qs.set("reason", String(params.reason));
  if (params.sort_by) qs.set("sort_by", params.sort_by);
  if (params.sort_dir) qs.set("sort_dir", params.sort_dir);
  if (params.per_page) qs.set("per_page", String(params.per_page));
  if (params.page) qs.set("page", String(params.page));

  const res = await fetchWithAuth(`/returns?${qs.toString()}`);
  return { data: res.data, meta: res.meta };
}

export async function getReturn(id: number): Promise<AdminReturnDetail> {
  const res = await fetchWithAuth(`/returns/${id}`);
  return res.data;
}

export async function updateReturnStatus(
  id: number,
  status: ReturnStatus,
  note?: string,
  refundAmount?: number,
  refundMethod?: string
): Promise<AdminReturnDetail> {
  const res = await fetchWithAuth(`/returns/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({
      status,
      note: note || null,
      refund_amount: refundAmount ?? null,
      refund_method: refundMethod ?? null,
    }),
  });

  return res.data;
}

export async function updateReturnNotes(id: number, adminNotes: string): Promise<void> {
  await fetchWithAuth(`/returns/${id}/notes`, {
    method: "PATCH",
    body: JSON.stringify({ admin_notes: adminNotes }),
  });
}
