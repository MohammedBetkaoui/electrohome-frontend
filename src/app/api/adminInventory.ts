import { getToken } from './auth';

const API_URL = 'http://localhost:8000/api/admin';

export type InventoryStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstocked';

export interface InventoryItem {
  id: number;
  name: string;
  sku: string;
  category: string;
  stock: number;
  reserved: number;
  available: number;
  minStock: number;
  price: number;
  supplier: string;
  lastRestocked: string | null;
  status: InventoryStatus;
}

export interface InventoryStats {
  total_value: number;
  total_items: number;
  low_stock_count: number;
  references_count: number;
}

interface InventoryResponse {
  status: string;
  data: InventoryItem[];
  meta?: Record<string, unknown>;
}

interface InventoryStatsResponse {
  status: string;
  data: InventoryStats;
}

export interface InventoryQueryParams {
  search?: string;
  status?: InventoryStatus | 'all';
  category?: string | 'all';
  sort_by?: 'name' | 'stock' | 'price' | 'updated_at';
  sort_dir?: 'asc' | 'desc';
}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = getToken();

  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    let message = 'Une erreur est survenue';

    try {
      const errorData = await response.json();
      message = errorData?.message || errorData?.error || message;
    } catch {
      message = response.statusText || message;
    }

    throw new Error(message);
  }

  return response;
}

function buildQueryString(params?: InventoryQueryParams) {
  const searchParams = new URLSearchParams();

  if (!params) {
    return '';
  }

  if (params.search) {
    searchParams.set('search', params.search);
  }

  if (params.status && params.status !== 'all') {
    searchParams.set('status', params.status);
  }

  if (params.category && params.category !== 'all') {
    searchParams.set('category', params.category);
  }

  if (params.sort_by) {
    searchParams.set('sort_by', params.sort_by);
  }

  if (params.sort_dir) {
    searchParams.set('sort_dir', params.sort_dir);
  }

  const query = searchParams.toString();

  return query ? `?${query}` : '';
}

export async function getInventory(params?: InventoryQueryParams) {
  const response = await fetchWithAuth(`${API_URL}/inventory${buildQueryString(params)}`);
  const result: InventoryResponse = await response.json();

  return result.data;
}

export async function getInventoryStats() {
  const response = await fetchWithAuth(`${API_URL}/inventory/stats`);
  const result: InventoryStatsResponse = await response.json();

  return result.data;
}

export function getInventoryExportUrl(params?: InventoryQueryParams) {
  const query = buildQueryString(params);
  const token = getToken();

  if (!token) {
    return `${API_URL}/inventory/export${query}`;
  }

  const separator = query ? '&' : '?';

  return `${API_URL}/inventory/export${query}${separator}token=${encodeURIComponent(token)}`;
}