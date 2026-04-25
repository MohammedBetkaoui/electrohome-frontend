const DEFAULT_API_BASE = "/api";

function normalizeApiBase(value?: string): string {
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    return DEFAULT_API_BASE;
  }

  return trimmedValue.replace(/\/+$/, "") || DEFAULT_API_BASE;
}

export const API_BASE = normalizeApiBase(import.meta.env.VITE_API_BASE_URL);

export function buildApiUrl(endpoint: string): string {
  return `${API_BASE}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
}