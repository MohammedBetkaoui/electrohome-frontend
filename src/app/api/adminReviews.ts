import { getToken } from "./auth";

const API_URL = "http://localhost:8000/api/admin";

export type ReviewStatus = "approved" | "pending" | "rejected" | "flagged";

export interface AdminReview {
  id: number;
  client: string;
  clientId: number;
  product: string;
  productId: number;
  rating: number;
  title: string | null;
  comment: string | null;
  date: string | null;
  status: ReviewStatus;
  helpful: number;
  reported: number;
  isVerified: boolean;
  adminNotes?: string | null;
}

export interface AdminReviewDetail extends AdminReview {
  moderatedAt?: string | null;
  moderatedBy?: { id: number; name: string } | null;
  clientEmail?: string | null;
  productSlug?: string | null;
  updatedAt?: string | null;
}

export interface AdminReviewStats {
  total: number;
  averageRating: number;
  pendingCount: number;
  flaggedCount: number;
}

export interface ReviewsListMeta {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

export interface ReviewsListResponse {
  data: AdminReview[];
  meta: ReviewsListMeta;
}

export interface GetReviewsParams {
  search?: string;
  status?: ReviewStatus | "all";
  rating?: number;
  sort_by?: "created_at" | "rating" | "helpful_count" | "reported_count";
  sort_dir?: "asc" | "desc";
  per_page?: number;
  page?: number;
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

export async function getReviews(params: GetReviewsParams = {}): Promise<ReviewsListResponse> {
  const qs = new URLSearchParams();

  if (params.search) qs.set("search", params.search);
  if (params.status && params.status !== "all") qs.set("status", params.status);
  if (typeof params.rating === "number") qs.set("rating", String(params.rating));
  if (params.sort_by) qs.set("sort_by", params.sort_by);
  if (params.sort_dir) qs.set("sort_dir", params.sort_dir);
  if (params.per_page) qs.set("per_page", String(params.per_page));
  if (params.page) qs.set("page", String(params.page));

  const res = await fetchWithAuth(`/reviews?${qs.toString()}`);
  return {
    data: res.data,
    meta: res.meta,
  };
}

export async function getReviewStats(): Promise<AdminReviewStats> {
  const res = await fetchWithAuth("/reviews/stats");
  return res.data;
}

export async function updateReviewStatus(
  id: number,
  status: ReviewStatus,
  note?: string,
): Promise<AdminReviewDetail> {
  const res = await fetchWithAuth(`/reviews/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({
      status,
      note: note || null,
    }),
  });

  return res.data;
}

export async function bulkUpdateReviewStatus(
  reviewIds: number[],
  status: ReviewStatus,
  note?: string,
): Promise<{ updatedCount: number; status: ReviewStatus }> {
  const res = await fetchWithAuth("/reviews/bulk-status", {
    method: "PATCH",
    body: JSON.stringify({
      review_ids: reviewIds,
      status,
      note: note || null,
    }),
  });

  return res.data;
}

export async function getReview(id: number): Promise<AdminReviewDetail> {
  const res = await fetchWithAuth(`/reviews/${id}`);
  return res.data;
}

export async function updateReviewNotes(id: number, adminNotes: string): Promise<{ adminNotes: string | null }> {
  const res = await fetchWithAuth(`/reviews/${id}/notes`, {
    method: "PATCH",
    body: JSON.stringify({ admin_notes: adminNotes }),
  });

  return res.data;
}
