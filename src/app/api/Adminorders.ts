import { getToken } from "./auth";

const API_URL = "http://localhost:8000/api/admin";

// ─── Types ────────────────────────────────────────────────────────────────

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "returned";

export interface AdminOrderItem {
  id: number;
  product_id: number | null;
  product_slug: string | null;
  product_name: string;
  product_brand: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
}

export interface AdminOrderAddress {
  full_name: string;
  address: string;
  postal_code: string | null;
  city: string;
  phone: string;
}

export interface AdminOrderStatusHistory {
  id?: number;
  status: OrderStatus;
  note: string | null;
  created_by: { id: number; name: string } | null;
  created_at: string | null;
}

export interface AdminOrder {
  id: number;
  order_number: string;
  client: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  items_count: number;
  items_preview: { name: string; quantity: number }[];
  subtotal: number;
  delivery_cost: number;
  total_ttc: number;
  status: OrderStatus;
  payment_method: string;
  payment_status: string;
  created_at: string;
  updated_at: string;
}

export interface AdminOrderDetail extends AdminOrder {
  address: AdminOrderAddress | null;
  delivery_method: { id: number; name: string; label: string } | null;
  items: AdminOrderItem[];
  status_history: AdminOrderStatusHistory[];
  promo_code: string | null;
  discount_amount: number;
  notes: string | null;
  estimated_delivery: string | null;
  paid_at: string | null;
  next_statuses: OrderStatus[];
}

export interface AdminOrderStats {
  total: number;
  pending: number;
  confirmed: number;
  preparing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  returned: number;
  revenue_delivered: number;
  today_orders: number;
  today_revenue: number;
}

export interface OrderListMeta {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

export interface OrderListResponse {
  data: AdminOrder[];
  meta: OrderListMeta;
}

// ─── Fetch helper ─────────────────────────────────────────────────────────

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

// ─── API functions ────────────────────────────────────────────────────────

export interface GetOrdersParams {
  search?: string;
  status?: OrderStatus | "all";
  sort_by?: "created_at" | "total_ttc" | "status";
  sort_dir?: "asc" | "desc";
  per_page?: number;
  page?: number;
}

/**
 * Liste paginée des commandes avec filtres.
 */
export async function getOrders(
  params: GetOrdersParams = {}
): Promise<OrderListResponse> {
  const qs = new URLSearchParams();

  if (params.search) qs.set("search", params.search);
  if (params.status && params.status !== "all") qs.set("status", params.status);
  if (params.sort_by) qs.set("sort_by", params.sort_by);
  if (params.sort_dir) qs.set("sort_dir", params.sort_dir);
  if (params.per_page) qs.set("per_page", String(params.per_page));
  if (params.page) qs.set("page", String(params.page));

  const res = await fetchWithAuth(`/orders?${qs.toString()}`);
  return { data: res.data, meta: res.meta };
}

/**
 * Détail complet d'une commande.
 */
export async function getOrder(id: number): Promise<AdminOrderDetail> {
  const res = await fetchWithAuth(`/orders/${id}`);
  return res.data;
}

/**
 * Statistiques globales des commandes.
 */
export async function getOrderStats(): Promise<AdminOrderStats> {
  const res = await fetchWithAuth("/orders/stats");
  return res.data;
}

/**
 * Changer le statut d'une commande.
 */
export async function updateOrderStatus(
  id: number,
  status: OrderStatus,
  note?: string
): Promise<AdminOrderDetail> {
  const res = await fetchWithAuth(`/orders/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, note: note || null }),
  });
  return res.data;
}

/**
 * Mettre à jour les notes internes.
 */
export async function updateOrderNotes(
  id: number,
  notes: string
): Promise<void> {
  await fetchWithAuth(`/orders/${id}/notes`, {
    method: "PATCH",
    body: JSON.stringify({ notes }),
  });
}

/**
 * URL d'export CSV avec les filtres courants.
 */
export function getExportUrl(params: {
  status?: string;
  date_from?: string;
  date_to?: string;
}): string {
  const qs = new URLSearchParams();
  if (params.status && params.status !== "all") qs.set("status", params.status);
  if (params.date_from) qs.set("date_from", params.date_from);
  if (params.date_to) qs.set("date_to", params.date_to);

  return `${API_URL}/orders/export?${qs.toString()}`;
}