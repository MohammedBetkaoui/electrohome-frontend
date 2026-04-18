import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
  ArrowUpRight,
  DollarSign,
  Eye,
  FileText,
  Package,
  RefreshCw,
  RotateCcw,
  ShoppingCart,
  Star,
  Tag,
  TrendingDown,
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
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  getAdminDashboard,
  type AdminDashboardData,
} from "../../api/adminAnalytics";

type DashboardKpiKey = keyof AdminDashboardData["kpis"];

const KPI_META: Record<
  DashboardKpiKey,
  {
    label: string;
    color: string;
    icon: LucideIcon;
    inverse?: boolean;
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
  activeCustomers: {
    label: "Clients actifs",
    color: "#10B981",
    icon: Users,
    format: (value) => value.toLocaleString("fr-DZ"),
  },
  openReturns: {
    label: "Retours ouverts",
    color: "#8B5CF6",
    icon: RotateCcw,
    inverse: true,
    format: (value) => value.toLocaleString("fr-DZ"),
  },
};

const HIGHLIGHT_META = [
  { key: "pendingReviews", label: "Avis en attente", icon: Star, color: "#F59E0B" },
  { key: "lowStockProducts", label: "Stock faible", icon: Package, color: "#EF4444" },
  { key: "publishedPosts", label: "Articles publiés", icon: FileText, color: "#06B6D4" },
  { key: "activePromotions", label: "Promotions actives", icon: Tag, color: "#10B981" },
] as const;

const CHART_COLORS = ["#FF6B35", "#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#6B7280"];

const ORDER_STATUS_META: Record<string, { label: string; color: string }> = {
  pending: { label: "En attente", color: "#F59E0B" },
  confirmed: { label: "Confirmée", color: "#3B82F6" },
  processing: { label: "En préparation", color: "#8B5CF6" },
  shipped: { label: "Expédiée", color: "#06B6D4" },
  delivered: { label: "Livrée", color: "#10B981" },
  cancelled: { label: "Annulée", color: "#EF4444" },
  returned: { label: "Retournée", color: "#6B7280" },
};

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

function formatShortDate(date: string | null) {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("fr-DZ", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatPercent(value: number) {
  if (!Number.isFinite(value)) return "0%";
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function getOrderStatusMeta(status: string) {
  return ORDER_STATUS_META[status] ?? { label: status, color: "#6B7280" };
}

function DashboardLoadingState() {
  return (
    <div className="space-y-6" style={{ fontFamily: "'Sora', sans-serif" }}>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-[126px] rounded-xl border border-[#E5E7EB] dark:border-white/10 bg-white dark:bg-[#1E1E24] animate-pulse"
          />
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 h-[360px] rounded-xl border border-[#E5E7EB] dark:border-white/10 bg-white dark:bg-[#1E1E24] animate-pulse" />
        <div className="h-[360px] rounded-xl border border-[#E5E7EB] dark:border-white/10 bg-white dark:bg-[#1E1E24] animate-pulse" />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 h-[420px] rounded-xl border border-[#E5E7EB] dark:border-white/10 bg-white dark:bg-[#1E1E24] animate-pulse" />
        <div className="space-y-4">
          <div className="h-[210px] rounded-xl border border-[#E5E7EB] dark:border-white/10 bg-white dark:bg-[#1E1E24] animate-pulse" />
          <div className="h-[190px] rounded-xl border border-[#E5E7EB] dark:border-white/10 bg-white dark:bg-[#1E1E24] animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async (refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const data = await getAdminDashboard();
      setDashboard(data);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Impossible de charger le dashboard.";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  const kpis = useMemo(() => {
    if (!dashboard) return [];

    return (Object.keys(KPI_META) as DashboardKpiKey[]).map((key) => {
      const meta = KPI_META[key];
      const metric = dashboard.kpis[key];
      const isPositive = meta.inverse ? metric.change <= 0 : metric.change >= 0;

      return {
        key,
        label: meta.label,
        icon: meta.icon,
        color: meta.color,
        value: meta.format(metric.value),
        change: formatPercent(metric.change),
        isPositive,
      };
    });
  }, [dashboard]);

  const weeklyOrdersTotal = useMemo(
    () => dashboard?.weeklyOrders.reduce((sum, point) => sum + point.orders, 0) ?? 0,
    [dashboard],
  );

  if (isLoading && !dashboard) {
    return <DashboardLoadingState />;
  }

  if (!dashboard) {
    return (
      <div
        className="rounded-2xl border border-[#E5E7EB] dark:border-white/10 bg-white dark:bg-[#1E1E24] p-8 text-center"
        style={{ fontFamily: "'Sora', sans-serif" }}
      >
        <p className="text-[15px] text-[#1A2332] dark:text-white" style={{ fontWeight: 600 }}>
          Données indisponibles
        </p>
        <p className="text-[13px] text-[#6B7280] dark:text-white/55 mt-2">
          {error || "Le dashboard n'a pas pu être chargé."}
        </p>
        <button
          onClick={() => void loadDashboard()}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FF6B35] text-white text-[13px]"
          style={{ fontWeight: 600 }}
        >
          <RefreshCw className="w-4 h-4" /> Recharger
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6" style={{ fontFamily: "'Sora', sans-serif" }}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-[12px] uppercase tracking-[0.18em] text-[#9CA3AF]">Pilotage boutique</p>
          <h2 className="text-[24px] text-[#1A2332] dark:text-white mt-1" style={{ fontWeight: 700 }}>
            Vue temps réel des 30 derniers jours
          </h2>
        </div>
        <button
          onClick={() => void loadDashboard(true)}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E5E7EB] dark:border-white/10 bg-white dark:bg-[#1E1E24] text-[13px] text-[#6B7280] dark:text-white/70 hover:border-[#FF6B35] hover:text-[#FF6B35] disabled:opacity-60"
          style={{ fontWeight: 600 }}
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Actualiser
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.key}
            className="bg-white dark:bg-[#1E1E24] rounded-xl p-5 border border-[#E5E7EB] dark:border-white/10"
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: kpi.color + "15" }}
              >
                <kpi.icon className="w-5 h-5" style={{ color: kpi.color }} />
              </div>
              <span
                className={`flex items-center gap-1 text-[12px] px-2 py-0.5 rounded-full ${
                  kpi.isPositive
                    ? "bg-[#10B981]/10 text-[#10B981]"
                    : "bg-[#EF4444]/10 text-[#EF4444]"
                }`}
                style={{ fontWeight: 500 }}
              >
                {kpi.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {kpi.change}
              </span>
            </div>
            <p className="text-[13px] text-[#6B7280] dark:text-white/50">{kpi.label}</p>
            <p className="text-[22px] text-[#1A2332] dark:text-white mt-0.5" style={{ fontWeight: 700 }}>
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {HIGHLIGHT_META.map((item) => (
          <div
            key={item.key}
            className="rounded-xl border border-[#E5E7EB] dark:border-white/10 bg-white dark:bg-[#1E1E24] p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: item.color + "15" }}
              >
                <item.icon className="w-4 h-4" style={{ color: item.color }} />
              </div>
              <span className="text-[12px] text-[#6B7280] dark:text-white/55">{item.label}</span>
            </div>
            <p className="text-[22px] text-[#1A2332] dark:text-white" style={{ fontWeight: 700 }}>
              {dashboard.highlights[item.key].toLocaleString("fr-DZ")}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-white dark:bg-[#1E1E24] rounded-xl p-5 border border-[#E5E7EB] dark:border-white/10">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-[15px] text-[#1A2332] dark:text-white" style={{ fontWeight: 600 }}>
                Chiffre d'affaires
              </h3>
              <p className="text-[12px] text-[#9CA3AF] mt-0.5">7 derniers mois</p>
            </div>
            <span className="text-[12px] text-[#6B7280] dark:text-white/55">
              {formatPrice(dashboard.revenueTrend.reduce((sum, item) => sum + item.revenue, 0))}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={dashboard.revenueTrend}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF6B35" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#FF6B35" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#9CA3AF" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#9CA3AF" }} tickFormatter={formatCompactRevenue} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1A2332",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 12,
                  color: "#fff",
                }}
                formatter={(value: number, name: string) => [
                  name === "revenue" ? formatPrice(value) : value.toLocaleString("fr-DZ"),
                  name === "revenue" ? "CA" : "Commandes",
                ]}
              />
              <Area type="monotone" dataKey="revenue" stroke="#FF6B35" strokeWidth={2.5} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-[#1E1E24] rounded-xl p-5 border border-[#E5E7EB] dark:border-white/10">
          <h3 className="text-[15px] text-[#1A2332] dark:text-white mb-1" style={{ fontWeight: 600 }}>
            Ventes par catégorie
          </h3>
          <p className="text-[12px] text-[#9CA3AF] mb-4">30 derniers jours</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={dashboard.categoryShare}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                dataKey="share"
                paddingAngle={3}
              >
                {dashboard.categoryShare.map((entry, index) => (
                  <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: "#1A2332", border: "none", borderRadius: 8, fontSize: 12, color: "#fff" }}
                formatter={(value: number) => [`${value.toFixed(1)}%`, "Part"]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {dashboard.categoryShare.map((category, index) => (
              <div key={category.name} className="flex items-center justify-between text-[12px]">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                  />
                  <span className="text-[#6B7280] dark:text-white/60 truncate">{category.name}</span>
                </div>
                <span className="text-[#1A2332] dark:text-white shrink-0" style={{ fontWeight: 600 }}>
                  {category.share.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-white dark:bg-[#1E1E24] rounded-xl border border-[#E5E7EB] dark:border-white/10">
          <div className="flex items-center justify-between p-5 pb-0">
            <div>
              <h3 className="text-[15px] text-[#1A2332] dark:text-white" style={{ fontWeight: 600 }}>
                Commandes récentes
              </h3>
              <p className="text-[12px] text-[#9CA3AF] mt-0.5">Dernières commandes enregistrées</p>
            </div>
            <button
              onClick={() => navigate("/admin/commandes")}
              className="text-[12px] text-[#FF6B35] flex items-center gap-1 hover:underline"
              style={{ fontWeight: 500 }}
            >
              Voir tout <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] mt-4">
              <thead>
                <tr className="border-b border-[#E5E7EB] dark:border-white/10">
                  <th className="text-left px-5 pb-3 text-[11px] uppercase tracking-wider text-[#9CA3AF]" style={{ fontWeight: 500 }}>
                    ID
                  </th>
                  <th className="text-left pb-3 text-[11px] uppercase tracking-wider text-[#9CA3AF]" style={{ fontWeight: 500 }}>
                    Client
                  </th>
                  <th className="text-left pb-3 text-[11px] uppercase tracking-wider text-[#9CA3AF]" style={{ fontWeight: 500 }}>
                    Total
                  </th>
                  <th className="text-left pb-3 text-[11px] uppercase tracking-wider text-[#9CA3AF]" style={{ fontWeight: 500 }}>
                    Statut
                  </th>
                  <th className="text-left pb-3 text-[11px] uppercase tracking-wider text-[#9CA3AF]" style={{ fontWeight: 500 }}>
                    Date
                  </th>
                  <th className="pb-3" />
                </tr>
              </thead>
              <tbody>
                {dashboard.recentOrders.map((order) => {
                  const status = getOrderStatusMeta(order.status);

                  return (
                    <tr
                      key={order.id}
                      className="border-b border-[#E5E7EB]/50 dark:border-white/5 hover:bg-[#F9FAFB] dark:hover:bg-white/5 transition-colors"
                    >
                      <td className="px-5 py-3 text-[#1A2332] dark:text-white" style={{ fontWeight: 600 }}>
                        {order.orderNumber}
                      </td>
                      <td className="py-3 text-[#6B7280] dark:text-white/70">{order.client}</td>
                      <td className="py-3 text-[#1A2332] dark:text-white" style={{ fontWeight: 500 }}>
                        {formatPrice(order.total)}
                      </td>
                      <td className="py-3">
                        <span
                          className="inline-flex px-2.5 py-0.5 rounded-full text-[11px]"
                          style={{
                            fontWeight: 500,
                            backgroundColor: status.color + "15",
                            color: status.color,
                          }}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="py-3 text-[#9CA3AF]">{formatShortDate(order.date)}</td>
                      <td className="py-3 pr-5">
                        <button
                          onClick={() => navigate(`/admin/commandes/${order.id}`)}
                          className="text-[#9CA3AF] hover:text-[#FF6B35] transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-[#1E1E24] rounded-xl p-5 border border-[#E5E7EB] dark:border-white/10">
            <h3 className="text-[15px] text-[#1A2332] dark:text-white mb-4" style={{ fontWeight: 600 }}>
              Top produits
            </h3>
            <div className="space-y-3">
              {dashboard.topProducts.map((product, index) => {
                const trendPositive = product.trend >= 0;

                return (
                  <div key={`${product.productId ?? product.name}-${index}`} className="flex items-center gap-3">
                    <span
                      className="w-6 h-6 rounded-md flex items-center justify-center text-[11px] shrink-0"
                      style={{
                        fontWeight: 600,
                        backgroundColor: index < 3 ? "#FF6B35" : "#E5E7EB",
                        color: index < 3 ? "#fff" : "#6B7280",
                      }}
                    >
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-[#1A2332] dark:text-white truncate" style={{ fontWeight: 500 }}>
                        {product.name}
                      </p>
                      <p className="text-[11px] text-[#9CA3AF]">
                        {product.sold.toLocaleString("fr-DZ")} vendus · {formatPrice(product.revenue)}
                      </p>
                    </div>
                    <span
                      className={`text-[11px] ${trendPositive ? "text-[#10B981]" : "text-[#EF4444]"}`}
                      style={{ fontWeight: 500 }}
                    >
                      {formatPercent(product.trend)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white dark:bg-[#1E1E24] rounded-xl p-5 border border-[#E5E7EB] dark:border-white/10">
            <h3 className="text-[15px] text-[#1A2332] dark:text-white mb-1" style={{ fontWeight: 600 }}>
              Commandes cette semaine
            </h3>
            <p className="text-[12px] text-[#9CA3AF] mb-4">{weeklyOrdersTotal.toLocaleString("fr-DZ")} total</p>
            <ResponsiveContainer width="100%" height={130}>
              <BarChart data={dashboard.weeklyOrders}>
                <Bar dataKey="orders" fill="#FF6B35" radius={[4, 4, 0, 0]} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9CA3AF" }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1A2332", border: "none", borderRadius: 8, fontSize: 12, color: "#fff" }}
                  formatter={(value: number) => [value.toLocaleString("fr-DZ"), "Commandes"]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}