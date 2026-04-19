import { normalizeStoreSettings, type StoreSettings } from "../lib/storeSettings";
import { getToken } from "./auth";

const API_BASE = "http://localhost:8000/api";
const ADMIN_API_BASE = `${API_BASE}/admin`;

type StoreSettingsApiPayload = Partial<StoreSettings> & {
  updatedAt?: string | null;
};

export interface ResolvedStoreSettings {
  settings: StoreSettings;
  updatedAt: string | null;
}

function resolvePayload(payload: StoreSettingsApiPayload | null | undefined): ResolvedStoreSettings {
  return {
    settings: normalizeStoreSettings(payload),
    updatedAt: typeof payload?.updatedAt === "string" ? payload.updatedAt : null,
  };
}

async function fetchPublicSettings(endpoint: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers || {});
  headers.set("Accept", "application/json");

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.message || "Impossible de charger les parametres de la boutique.");
  }

  return payload;
}

async function fetchAdminSettings(endpoint: string, options: RequestInit = {}) {
  const token = getToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  headers.set("Accept", "application/json");

  const response = await fetch(`${ADMIN_API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.message || "Impossible de sauvegarder les parametres de la boutique.");
  }

  return payload;
}

export async function getPublicStoreSettings(): Promise<ResolvedStoreSettings> {
  const response = await fetchPublicSettings("/settings/store");
  return resolvePayload(response?.data);
}

export async function getAdminStoreSettings(): Promise<ResolvedStoreSettings> {
  const response = await fetchAdminSettings("/settings/store");
  return resolvePayload(response?.data);
}

export async function updateAdminStoreSettings(settings: StoreSettings): Promise<ResolvedStoreSettings> {
  const response = await fetchAdminSettings("/settings/store", {
    method: "PUT",
    body: JSON.stringify(settings),
  });

  return resolvePayload(response?.data);
}