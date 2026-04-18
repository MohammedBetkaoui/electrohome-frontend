import { getToken } from "./auth";

const API_URL = "http://localhost:8000/api/admin";

export type AnalyticsPeriod = 7 | 30 | 90 | 180 | 365;

export interface MetricDelta {
  value: number;
  change: number;
}

export interface RevenueTrendPoint {
  label: string;
  revenue: number;
  orders: number;
}

export interface CategorySharePoint {
  name: string;
  revenue: number;
  share: number;
}

export interface TopProductPoint {
  productId: number | null;
  name: string;
  sold: number;
  revenue: number;
  trend: number;
}

export interface DashboardRecentOrder {
  id: number;
  orderNumber: string;
  client: string;
  total: number;
  status: string;
  date: string | null;
}

export interface WeeklyOrdersPoint {
  label: string;
  orders: number;
}

export interface DashboardHighlights {
  pendingReviews: number;
  lowStockProducts: number;
  publishedPosts: number;
  activePromotions: number;
}

export interface AdminDashboardData {
  kpis: {
    revenue: MetricDelta;
    orders: MetricDelta;
    activeCustomers: MetricDelta;
    openReturns: MetricDelta;
  };
  revenueTrend: RevenueTrendPoint[];
  categoryShare: CategorySharePoint[];
  topProducts: TopProductPoint[];
  recentOrders: DashboardRecentOrder[];
  weeklyOrders: WeeklyOrdersPoint[];
  highlights: DashboardHighlights;
}

export interface FunnelPoint {
  stage: string;
  value: number;
}

export interface CategoryRevenuePoint {
  name: string;
  revenue: number;
}

export interface PaymentMethodPoint {
  name: string;
  value: number;
}

export interface NewCustomersTrendPoint {
  label: string;
  customers: number;
}

export interface TopCityPoint {
  city: string;
  orders: number;
  pct: number;
}

export interface AdminAnalyticsData {
  periodDays: AnalyticsPeriod;
  kpis: {
    revenue: MetricDelta;
    orders: MetricDelta;
    itemsSold: MetricDelta;
    activeCustomers: MetricDelta;
    averageOrderValue: MetricDelta;
    newClients: MetricDelta;
  };
  monthlyTrend: RevenueTrendPoint[];
  funnel: FunnelPoint[];
  periodRevenueTrend: RevenueTrendPoint[];
  categoryRevenue: CategoryRevenuePoint[];
  paymentMethods: PaymentMethodPoint[];
  newCustomersTrend: NewCustomersTrendPoint[];
  topProducts: TopProductPoint[];
  topCities: TopCityPoint[];
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

export async function getAdminDashboard(): Promise<AdminDashboardData> {
  const response = await fetchWithAuth("/dashboard");
  return response.data;
}

export async function getAdminAnalytics(period: AnalyticsPeriod): Promise<AdminAnalyticsData> {
  const response = await fetchWithAuth(`/analytics?period=${period}`);
  return response.data;
}