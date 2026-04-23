import { getToken } from "./auth";

const API_BASE = "http://localhost:8000/api";

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

export interface DeliveryMethod {
  id: number;
  name: string;
  label: string;
  description: string;
  price: number;
  delay_min: number;
  delay_max: number;
}

export interface DeliveryRules {
  free_threshold: number;
  standard_fee: number;
}

export interface WilayaOption {
  id: number;
  name: string;
  delivery_price: number;
  delivery_price_agency: number;
}

export interface WeightPricingOption {
  id: number;
  max_weight_kg: number;
  price: number;
}

export interface PaymentMethodOption {
  value: "cash_on_delivery";
  label: string;
  description: string;
}

export interface CheckoutOptions {
  delivery_methods: DeliveryMethod[];
  delivery_rules: DeliveryRules;
  wilayas: WilayaOption[];
  weight_pricings: WeightPricingOption[];
  payment_methods: PaymentMethodOption[];
}

export interface ShippingAddress {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  address: string;
  postal_code: string | null;
  city: string;
  wilaya_id: number | null;
  wilaya_name: string | null;
  phone: string;
  is_default: boolean;
}

export interface OrderItemPayload {
  product_id: number;
  quantity: number;
}

export interface OrderAddressPayload {
  first_name: string;
  last_name: string;
  address: string;
  city: string;
  phone: string;
  postal_code?: string;
  wilaya_id?: number;
  save?: boolean;
}

export interface OrderPreview {
  items_count: number;
  subtotal: number;
  delivery_cost: number;
  weight_surcharge: number;
  discount_amount: number;
  total_ttc: number;
  promo_code: string | null;
  delivery_method: DeliveryMethod;
  wilaya: WilayaOption | null;
  delivery_type: "home" | "agency";
  total_weight_kg: number;
}

export interface PlaceOrderPayload {
  shipping_address_id?: number;
  address?: OrderAddressPayload;
  delivery_method_id: number;
  items: OrderItemPayload[];
  promo_code?: string;
  wilaya_id?: number;
  delivery_type?: "home" | "agency";
  payment_method: "cash_on_delivery";
  notes?: string;
}

export interface OrderCreateResponse {
  order_id: number;
  order_number: string;
  total_ttc: number;
  estimated_delivery: string | null;
  status: string;
}

export interface CustomerOrder {
  id: number;
  order_number: string;
  items_count: number;
  total_ttc: number;
  status: string;
  payment_status: string;
  delivery_label: string | null;
  city: string | null;
  created_at: string;
}

export interface CustomerOrderItem {
  id: number;
  product_id: number | null;
  product_name: string;
  product_brand: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
}

export interface CustomerOrderStatusHistory {
  status: string;
  note: string | null;
  created_at: string | null;
}

export interface CustomerOrderDetail {
  id: number;
  order_number: string;
  status: string;
  payment_method: string;
  payment_status: string;
  subtotal: number;
  delivery_cost: number;
  discount_amount: number;
  total_ttc: number;
  promo_code: string | null;
  notes: string | null;
  estimated_delivery: string | null;
  created_at: string;
  address: {
    full_name: string;
    address: string;
    city: string;
    postal_code: string | null;
    phone: string;
  } | null;
  delivery_method: {
    label: string;
    delay_min: number;
    delay_max: number;
  } | null;
  items: CustomerOrderItem[];
  status_history: CustomerOrderStatusHistory[];
  can_cancel: boolean;
}

export interface CustomerOrderListResponse {
  data: CustomerOrder[];
  meta: {
    total: number;
    current_page: number;
    last_page: number;
  };
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  auth?: boolean;
};

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers({
    Accept: "application/json",
  });

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (options.auth) {
    const token = getToken();
    if (!token) {
      throw new ApiError("Vous devez vous connecter pour continuer.", 401);
    }
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: options.method || (options.body !== undefined ? "POST" : "GET"),
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      payload?.message || "Une erreur est survenue.",
      response.status,
      payload?.errors,
    );
  }

  return payload?.data as T;
}

export function getCheckoutOptions() {
  return request<CheckoutOptions>("/checkout/options");
}

export function previewOrder(payload: {
  delivery_method_id: number;
  items: OrderItemPayload[];
  promo_code?: string;
  wilaya_id?: number;
  delivery_type?: "home" | "agency";
}) {
  return request<OrderPreview>("/checkout/preview", {
    body: payload,
  });
}

export function getCheckoutAddresses() {
  return request<ShippingAddress[]>("/checkout/addresses", { auth: true });
}

export function placeOrder(payload: PlaceOrderPayload) {
  return request<OrderCreateResponse>("/orders", {
    body: payload,
    auth: true,
  });
}

export async function getMyOrders(): Promise<CustomerOrderListResponse> {
  const token = getToken();
  if (!token) {
    throw new ApiError("Vous devez vous connecter pour continuer.", 401);
  }

  const response = await fetch(`${API_BASE}/orders`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      payload?.message || "Une erreur est survenue.",
      response.status,
      payload?.errors,
    );
  }

  return {
    data: (payload?.data || []) as CustomerOrder[],
    meta: payload?.meta || {
      total: 0,
      current_page: 1,
      last_page: 1,
    },
  };
}

export function getMyOrder(id: number) {
  return request<CustomerOrderDetail>(`/orders/${id}`, { auth: true });
}

export async function cancelMyOrder(id: number) {
  await request(`/orders/${id}`, {
    method: "DELETE",
    auth: true,
  });
}
