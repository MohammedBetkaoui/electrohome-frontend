import { getToken } from "./auth";

const API_URL = "http://localhost:8000/api/admin";

export type AdminNotifType = "order" | "client" | "inventory";

export interface AdminNotification {
  id: number;
  title: string;
  message: string;
  type: AdminNotifType;
  payload?: Record<string, unknown> | null;
  date: string;
  read: boolean;
}

export interface AdminNotificationsResponse {
  data: AdminNotification[];
  meta: {
    serverTime: string;
    unreadCount: number;
  };
}

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = getToken();
  const headers = new Headers(options.headers || {});

  if (token) headers.set("Authorization", `Bearer ${token}`);
  headers.set("Content-Type", "application/json");
  headers.set("Accept", "application/json");

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    const error: any = new Error(data.message || "Une erreur est survenue");
    error.errors = data.errors;
    error.status = response.status;
    throw error;
  }

  return data;
}

export async function getAdminNotifications(params: {
  limit?: number;
} = {}): Promise<AdminNotificationsResponse> {
  const qs = new URLSearchParams();

  if (params.limit) qs.set("limit", String(params.limit));

  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  const res = await fetchWithAuth(`/notifications${suffix}`);

  return {
    data: res.data,
    meta: res.meta,
  };
}

export async function markAdminNotificationRead(id: number): Promise<void> {
  await fetchWithAuth(`/notifications/${id}/read`, {
    method: "PATCH",
  });
}

export async function markAllAdminNotificationsRead(): Promise<void> {
  await fetchWithAuth("/notifications/read-all", {
    method: "PATCH",
  });
}

export async function deleteAdminNotification(id: number): Promise<void> {
  await fetchWithAuth(`/notifications/${id}`, {
    method: "DELETE",
  });
}

export async function deleteAllAdminNotifications(): Promise<void> {
  await fetchWithAuth("/notifications", {
    method: "DELETE",
  });
}
