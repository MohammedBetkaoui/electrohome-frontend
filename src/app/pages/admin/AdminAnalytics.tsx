import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  DollarSign,
  Download,
  Package,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  exportAdminAnalyticsPdf,
  getAdminAnalytics,
  type AdminAnalyticsData,
  type AnalyticsPeriod,
} from "../../api/adminAnalytics";

type AnalyticsKpiKey = keyof AdminAnalyticsData["kpis"];

const PERIOD_OPTIONS: Array<{ label: string; value: AnalyticsPeriod }> = [
  { label: "7 jours", value: 7 },
  { label: "30 jours", value: 30 },
  { label: "90 jours", value: 90 },
  { label: "6 mois", value: 180 },
  { label: "1 an", value: 365 },
];

const KPI_META: Record<
  AnalyticsKpiKey,
  {
    label: string;
    color: string;
    icon: LucideIcon;
    format: (value: number) => string;
  }
> = {
  revenue: {
    label: "Chiffre d'affaires",
    color: "#FF6B35",
    icon: DollarSign,
    format: (value) => formatPrice(value),
  },
  orders: {
    label: "Commandes",
    color: "#3B82F6",
    icon: ShoppingCart,
    format: (value) => value.toLocaleString("fr-DZ"),
  },
  itemsSold: {
    label: "Articles vendus",
    color: "#10B981",
    icon: Package,
    format: (value) => value.toLocaleString("fr-DZ"),
  },
  activeCustomers: {
    label: "Clients actifs",
    color: "#8B5CF6",
    icon: Users,
    format: (value) => value.toLocaleString("fr-DZ"),
  },
  averageOrderValue: {
    label: "Panier moyen",
    color: "#F59E0B",
    icon: TrendingUp,
    format: (value) => formatPrice(value),
  },
  newClients: {
    label: "Nouveaux clients",
    color: "#EF4444",
    icon: Calendar,
    format: (value) => value.toLocaleString("fr-DZ"),
  },
};

const CHART_COLORS = ["#FF6B35", "#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#EF4444", "#6B7280"];

function formatPrice(value: number) {
  return value.toLocaleString("fr-DZ") + " DA";
}

function formatCompactRevenue(value: number) {
  if (value >= 1_000_000) {
    return (value / 1_000_000).toFixed(1) + "M";
  }

  if (value >= 1_000) {
    return (value / 1_000).toFixed(0) + "k";
  }

  return String(Math.round(value));
}

function formatPercent(value: number) {
  if (!Number.isFinite(value)) return "0%";
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function formatPaymentMethod(name: string) {
  const normalized = name.replace(/_/g, " ").trim();
  if (!normalized) return "Non renseigné";

  return normalized
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function AnalyticsLoadingState() {
  return (
    <div className="space-y-5" style={{ fontFamily: "'Sora', sans-serif" }}>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="h-12 w-[340px] rounded-xl border border-[#E5E7EB] dark:border-white/10 bg-white dark:bg-[#1E1E24] animate-pulse" />
        <div className="h-11 w-36 rounded-xl border border-[#E5E7EB] dark:border-white/10 bg-white dark:bg-[#1E1E24] animate-pulse" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-[118px] rounded-xl border border-[#E5E7EB] dark:border-white/10 bg-white dark:bg-[#1E1E24] animate-pulse"
          />
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 h-[360px] rounded-xl border border-[#E5E7EB] dark:border-white/10 bg-white dark:bg-[#1E1E24] animate-pulse" />
        <div className="h-[360px] rounded-xl border border-[#E5E7EB] dark:border-white/10 bg-white dark:bg-[#1E1E24] animate-pulse" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-[320px] rounded-xl border border-[#E5E7EB] dark:border-white/10 bg-white dark:bg-[#1E1E24] animate-pulse" />
        <div className="h-[320px] rounded-xl border border-[#E5E7EB] dark:border-white/10 bg-white dark:bg-[#1E1E24] animate-pulse" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-[300px] rounded-xl border border-[#E5E7EB] dark:border-white/10 bg-white dark:bg-[#1E1E24] animate-pulse" />
        <div className="h-[300px] rounded-xl border border-[#E5E7EB] dark:border-white/10 bg-white dark:bg-[#1E1E24] animate-pulse" />
      </div>
    </div>
  );
}

export function AdminAnalytics() {
  const [period, setPeriod] = useState<AnalyticsPeriod>(30);
  const [analytics, setAnalytics] = useState<AdminAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = async (selectedPeriod: AnalyticsPeriod, refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const data = await getAdminAnalytics(selectedPeriod);
      setAnalytics(data);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Impossible de charger les analyses.";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    void loadAnalytics(period);
  }, [period]);

  const handleExportPdf = async () => {
    try {
      setIsExporting(true);
      const file = await exportAdminAnalyticsPdf(period);
      const url = window.URL.createObjectURL(file.blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = file.fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Impossible d'exporter le PDF.";
      toast.error(message);
    } finally {
      setIsExporting(false);
    }
  };

  const kpis = useMemo(() => {
    if (!analytics) return [];

    return (Object.keys(KPI_META) as AnalyticsKpiKey[]).map((key) => {
      const meta = KPI_META[key];
      const metric = analytics.kpis[key];
      const positive = metric.change >= 0;

      return {
        key,
        label: meta.label,
        icon: meta.icon,
        color: meta.color,
        value: meta.format(metric.value),
        change: formatPercent(metric.change),
        positive,
      };
    });
  }, [analytics]);

  const paymentTotal = useMemo(
    () => analytics?.paymentMethods.reduce((sum, method) => sum + method.value, 0) ?? 0,
    [analytics],
  );

  const funnelBase = analytics?.funnel[0]?.value ?? 0;

  if (isLoading && !analytics) {
    return <AnalyticsLoadingState />;
  }

  if (!analytics) {
    return (
      <div
        className="rounded-2xl border border-[#E5E7EB] dark:border-white/10 bg-white dark:bg-[#1E1E24] p-8 text-center"
        style={{ fontFamily: "'Sora', sans-serif" }}
      >
        <p className="text-[15px] text-[#1A2332] dark:text-white" style={{ fontWeight: 600 }}>
          Analyses indisponibles
        </p>
        <p className="text-[13px] text-[#6B7280] dark:text-white/55 mt-2">
          {error || "La page analytics n'a pas pu être chargée."}
        </p>
        <button
          onClick={() => void loadAnalytics(period)}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FF6B35] text-white text-[13px]"
          style={{ fontWeight: 600 }}
        >
          <RefreshCw className="w-4 h-4" /> Recharger
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5" style={{ fontFamily: "'Sora', sans-serif" }}>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex bg-white dark:bg-[#1E1E24] rounded-xl border border-[#E5E7EB] dark:border-white/10 p-1 flex-wrap">
          {PERIOD_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setPeriod(option.value)}
              className={`px-3 py-2 rounded-lg text-[12px] transition-colors ${
                period === option.value
                  ? "bg-[#FF6B35] text-white"
                  : "text-[#6B7280] hover:text-[#1A2332] dark:hover:text-white"
              }`}
              style={{ fontWeight: period === option.value ? 600 : 400 }}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => void loadAnalytics(period, true)}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#E5E7EB] dark:border-white/10 text-[13px] text-[#6B7280] hover:border-[#FF6B35] hover:text-[#FF6B35] disabled:opacity-60"
            style={{ fontWeight: 500 }}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} /> Actualiser
          </button>
          <button
            onClick={() => void handleExportPdf()}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#E5E7EB] dark:border-white/10 text-[13px] text-[#6B7280] hover:border-[#FF6B35] hover:text-[#FF6B35] disabled:opacity-60"
            style={{ fontWeight: 500 }}
          >
            <Download className="w-4 h-4" /> {isExporting ? "Generation..." : "Exporter PDF"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpis.map((kpi) => (
          <div key={kpi.key} className="bg-white dark:bg-[#1E1E24] rounded-xl border border-[#E5E7EB] dark:border-white/10 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: kpi.color + "15" }}>
                <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
              </div>
              <span className={`flex items-center gap-0.5 text-[11px] ${kpi.positive ? "text-[#10B981]" : "text-[#EF4444]"}`} style={{ fontWeight: 500 }}>
                {kpi.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {kpi.change}
              </span>
            </div>
            <p className="text-[17px] text-[#1A2332] dark:text-white truncate" style={{ fontWeight: 700 }}>{kpi.value}</p>
            <p className="text-[11px] text-[#9CA3AF] mt-0.5">{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-white dark:bg-[#1E1E24] rounded-xl border border-[#E5E7EB] dark:border-white/10 p-5">
          <h3 className="text-[14px] text-[#1A2332] dark:text-white mb-4" style={{ fontWeight: 600 }}>
            Évolution du CA et des commandes
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={analytics.monthlyTrend}>
                <defs>
                  <linearGradient id="analyticsRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF6B35" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#FF6B35" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} tickFormatter={formatCompactRevenue} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 12, fontFamily: "'Sora'" }}
                  formatter={(value: number, name: string) => [
                    name === "revenue" ? formatPrice(value) : value.toLocaleString("fr-DZ"),
                    name === "revenue" ? "CA" : "Commandes",
                  ]}
                />
                <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#FF6B35" strokeWidth={2.5} fill="url(#analyticsRevenue)" />
                <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1E1E24] rounded-xl border border-[#E5E7EB] dark:border-white/10 p-5">
          <h3 className="text-[14px] text-[#1A2332] dark:text-white mb-4" style={{ fontWeight: 600 }}>
            Entonnoir des commandes
          </h3>
          <div className="space-y-3">
            {analytics.funnel.map((step, index) => {
              const percent = funnelBase > 0 ? (step.value / funnelBase) * 100 : 0;
              const previousValue = index > 0 ? analytics.funnel[index - 1].value : step.value;
              const dropoff = index > 0 && previousValue > 0
                ? ((1 - step.value / previousValue) * 100).toFixed(1)
                : null;

              return (
                <div key={step.stage}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] text-[#6B7280]">{step.stage}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] text-[#1A2332] dark:text-white" style={{ fontWeight: 600 }}>
                        {step.value.toLocaleString("fr-DZ")}
                      </span>
                      {dropoff && <span className="text-[10px] text-[#EF4444]">-{dropoff}%</span>}
                    </div>
                  </div>
                  <div className="w-full h-8 bg-[#F3F4F6] dark:bg-white/5 rounded-lg overflow-hidden">
                    <div
                      className="h-full rounded-lg transition-all flex items-center justify-end pr-2"
                      style={{ width: `${percent}%`, backgroundColor: CHART_COLORS[index % CHART_COLORS.length] + "25" }}
                    >
                      <span className="text-[10px]" style={{ color: CHART_COLORS[index % CHART_COLORS.length], fontWeight: 600 }}>
                        {percent.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-[#1E1E24] rounded-xl border border-[#E5E7EB] dark:border-white/10 p-5">
          <h3 className="text-[14px] text-[#1A2332] dark:text-white mb-4" style={{ fontWeight: 600 }}>
            Revenus de la période
          </h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.periodRevenueTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} tickFormatter={formatCompactRevenue} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 12 }}
                  formatter={(value: number, name: string) => [
                    name === "revenue" ? formatPrice(value) : value.toLocaleString("fr-DZ"),
                    name === "revenue" ? "CA" : "Commandes",
                  ]}
                />
                <Bar dataKey="revenue" radius={[6, 6, 0, 0]} barSize={36} fill="#FF6B35" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1E1E24] rounded-xl border border-[#E5E7EB] dark:border-white/10 p-5">
          <h3 className="text-[14px] text-[#1A2332] dark:text-white mb-4" style={{ fontWeight: 600 }}>
            CA par catégorie
          </h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.categoryRevenue} layout="vertical" margin={{ left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} tickFormatter={formatCompactRevenue} />
                <YAxis dataKey="name" type="category" width={130} tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 12 }}
                  formatter={(value: number) => [formatPrice(value), "CA"]}
                />
                <Bar dataKey="revenue" radius={[0, 6, 6, 0]} barSize={16}>
                  {analytics.categoryRevenue.map((category, index) => (
                    <Cell key={category.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-[#1E1E24] rounded-xl border border-[#E5E7EB] dark:border-white/10 p-5">
          <h3 className="text-[14px] text-[#1A2332] dark:text-white mb-4" style={{ fontWeight: 600 }}>
            Modes de paiement
          </h3>
          <div className="h-[250px] flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.paymentMethods}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  dataKey="value"
                  paddingAngle={3}
                  strokeWidth={0}
                >
                  {analytics.paymentMethods.map((method, index) => (
                    <Cell key={method.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 12 }}
                  formatter={(value: number) => [value.toLocaleString("fr-DZ"), "Commandes"]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-2">
            {analytics.paymentMethods.map((method, index) => {
              const pct = paymentTotal > 0 ? (method.value / paymentTotal) * 100 : 0;

              return (
                <div key={method.name} className="flex items-center justify-between text-[12px]">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                    <span className="text-[#6B7280] dark:text-white/60 truncate">{formatPaymentMethod(method.name)}</span>
                  </div>
                  <span className="text-[#1A2332] dark:text-white shrink-0" style={{ fontWeight: 600 }}>
                    {pct.toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-[#1E1E24] rounded-xl border border-[#E5E7EB] dark:border-white/10 p-5">
          <h3 className="text-[14px] text-[#1A2332] dark:text-white mb-4" style={{ fontWeight: 600 }}>
            Acquisition de nouveaux clients
          </h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.newCustomersTrend}>
                <defs>
                  <linearGradient id="customersGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 12 }}
                  formatter={(value: number) => [value.toLocaleString("fr-DZ"), "Nouveaux clients"]}
                />
                <Area type="monotone" dataKey="customers" stroke="#10B981" strokeWidth={2} fill="url(#customersGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-[#1E1E24] rounded-xl border border-[#E5E7EB] dark:border-white/10 p-5">
          <h3 className="text-[14px] text-[#1A2332] dark:text-white mb-4" style={{ fontWeight: 600 }}>
            Top 5 produits vendus
          </h3>
          <div className="space-y-3">
            {analytics.topProducts.map((product, index) => {
              const trendPositive = product.trend >= 0;

              return (
                <div key={`${product.productId ?? product.name}-${index}`} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-[#F3F4F6] dark:bg-white/10 flex items-center justify-center text-[12px] text-[#6B7280]" style={{ fontWeight: 600 }}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-[#1A2332] dark:text-white truncate" style={{ fontWeight: 500 }}>{product.name}</p>
                    <p className="text-[11px] text-[#9CA3AF]">{product.sold.toLocaleString("fr-DZ")} ventes</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="block text-[13px] text-[#FF6B35]" style={{ fontWeight: 600 }}>{formatPrice(product.revenue)}</span>
                    <span className={`text-[11px] ${trendPositive ? "text-[#10B981]" : "text-[#EF4444]"}`}>{formatPercent(product.trend)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-[#1E1E24] rounded-xl border border-[#E5E7EB] dark:border-white/10 p-5">
          <h3 className="text-[14px] text-[#1A2332] dark:text-white mb-4" style={{ fontWeight: 600 }}>
            Commandes par ville
          </h3>
          <div className="space-y-2.5">
            {analytics.topCities.map((city) => (
              <div key={city.city}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[12px] text-[#1A2332] dark:text-white" style={{ fontWeight: 500 }}>
                    {city.city}
                  </span>
                  <span className="text-[12px] text-[#6B7280]">
                    {city.orders.toLocaleString("fr-DZ")} ({city.pct.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-[#F3F4F6] dark:bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-[#FF6B35]" style={{ width: `${city.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}