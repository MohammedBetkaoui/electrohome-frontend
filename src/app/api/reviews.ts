import { getToken } from "./auth";

const API_BASE = "http://localhost:8000/api";

export type ReviewStatus = "approved" | "pending" | "rejected" | "flagged";

export interface ProductReview {
  id: number;
  rating: number;
  title: string | null;
  comment: string | null;
  isVerified: boolean;
  helpful: number;
  reported: number;
  createdAt: string | null;
  client: {
    id: number;
    name: string;
  };
}

export interface ProductReviewsMeta {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
  average_rating: number;
  review_count: number;
  rating_distribution: Record<string, number>;
}

export interface ProductReviewsResponse {
  data: ProductReview[];
  meta: ProductReviewsMeta;
}

export interface MyReview {
  id: number;
  productId: number;
  product: {
    name: string | null;
    slug: string | null;
  };
  rating: number;
  title: string | null;
  comment: string | null;
  status: ReviewStatus;
  isVerified: boolean;
  helpful: number;
  reported: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface MyReviewsResponse {
  data: MyReview[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
}

async function request<T>(endpoint: string, options: RequestInit = {}, requireAuth = false): Promise<T> {
  const token = getToken();

  if (requireAuth && !token) {
    throw new Error("Vous devez vous connecter pour continuer.");
  }

  const headers = new Headers(options.headers || {});
  headers.set("Accept", "application/json");

  if (!(options.body instanceof FormData)) {
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
    error.status = response.status;
    error.errors = payload?.errors;
    throw error;
  }

  return payload as T;
}

export async function getProductReviews(
  product: string,
  params: {
    page?: number;
    perPage?: number;
    sort?: "newest" | "oldest" | "rating_desc" | "rating_asc" | "helpful";
    rating?: number;
  } = {},
): Promise<ProductReviewsResponse> {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.perPage) qs.set("per_page", String(params.perPage));
  if (params.sort) qs.set("sort", params.sort);
  if (params.rating) qs.set("rating", String(params.rating));

  const query = qs.toString();
  const endpoint = query
    ? `/products/${encodeURIComponent(product)}/reviews?${query}`
    : `/products/${encodeURIComponent(product)}/reviews`;

  const res = await request<{ status: string; data: ProductReview[]; meta: ProductReviewsMeta }>(endpoint);
  return {
    data: res.data,
    meta: res.meta,
  };
}

export async function getMyReviews(params: { status?: ReviewStatus | "all"; productId?: number; perPage?: number } = {}): Promise<MyReviewsResponse> {
  const qs = new URLSearchParams();

  if (params.status) qs.set("status", params.status);
  if (params.productId) qs.set("product_id", String(params.productId));
  if (params.perPage) qs.set("per_page", String(params.perPage));

  const query = qs.toString();
  const endpoint = query ? `/reviews/my?${query}` : "/reviews/my";

  const res = await request<{ status: string; data: MyReview[]; meta: MyReviewsResponse["meta"] }>(endpoint, {}, true);
  return {
    data: res.data,
    meta: res.meta,
  };
}

export async function createMyReview(payload: {
  product_id: number;
  rating: number;
  title?: string;
  comment: string;
}): Promise<MyReview> {
  const res = await request<{ status: string; data: MyReview }>("/reviews", {
    method: "POST",
    body: JSON.stringify(payload),
  }, true);

  return res.data;
}

export async function updateMyReview(id: number, payload: {
  rating?: number;
  title?: string;
  comment?: string;
}): Promise<MyReview> {
  const res = await request<{ status: string; data: MyReview }>(`/reviews/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  }, true);

  return res.data;
}

export async function deleteMyReview(id: number): Promise<void> {
  await request<{ status: string }>(`/reviews/${id}`, {
    method: "DELETE",
  }, true);
}

export async function markReviewHelpful(id: number): Promise<{ helpful: number; reported: number; status: ReviewStatus }> {
  const res = await request<{ status: string; data: { helpful: number; reported: number; status: ReviewStatus } }>(`/reviews/${id}/helpful`, {
    method: "POST",
  }, true);

  return res.data;
}

export async function reportReview(id: number): Promise<{ helpful: number; reported: number; status: ReviewStatus; autoFlagged: boolean }> {
  const res = await request<{ status: string; data: { helpful: number; reported: number; status: ReviewStatus; autoFlagged: boolean } }>(`/reviews/${id}/report`, {
    method: "POST",
  }, true);

  return res.data;
}
