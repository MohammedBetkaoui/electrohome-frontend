import { getToken } from "./auth";

const API_BASE = "http://localhost:8000/api";

export type ReturnStatus =
  | "pending"
  | "approved"
  | "pickup"
  | "received"
  | "inspecting"
  | "refunded"
  | "rejected";

export interface ReturnReason {
  id: number;
  code: string;
  label: string;
}

export interface CustomerReturnItem {
  name: string;
  sku: string;
  unitPrice: number;
  quantity: number;
}

export interface CustomerReturnSummary {
  id: number;
  returnNumber: string;
  orderId: number;
  orderNumber: string | null;
  status: ReturnStatus;
  reason: string | null;
  reasonLabel: string | null;
  refundAmount: number;
  refundMethod: string | null;
  photos?: number;
  createdAt: string;
  updatedAt: string;
  items: CustomerReturnItem[];
}

export interface CustomerReturnDetail extends CustomerReturnSummary {
  reasonDetail?: string | null;
  adminNotes?: string | null;
  statusHistory?: {
    status: ReturnStatus;
    note: string | null;
    createdAt: string | null;
    createdBy: { id: number; name: string } | null;
  }[];
  photosList?: { id: number; url: string; uploadedAt: string | null }[];
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers || {});

  headers.set("Accept", "application/json");

  if (options.body !== undefined && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const error: any = new Error(payload?.message || "Une erreur est survenue.");
    error.errors = payload?.errors;
    error.status = response.status;
    throw error;
  }

  return payload?.data as T;
}

export function getReturnReasons() {
  return request<ReturnReason[]>("/returns/reasons", { method: "GET" });
}

export function getMyReturns() {
  return request<CustomerReturnSummary[]>("/returns", { method: "GET" });
}

export function getMyReturn(id: number) {
  return request<CustomerReturnDetail>(`/returns/${id}`, { method: "GET" });
}

export function createReturn(formData: FormData) {
  return request<CustomerReturnDetail>("/returns", {
    method: "POST",
    body: formData,
  });
}
