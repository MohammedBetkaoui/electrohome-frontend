import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
  Search, Eye, X, ChevronLeft, ChevronRight, ArrowUpDown,
  ShoppingCart, Clock, Truck, CheckCircle2, XCircle, RotateCcw,
  MapPin, Phone, Mail, Download, Printer, Package, Calendar,
  RefreshCw,
} from "lucide-react";
import {
  getOrders,
  getOrder,
  getOrderStats,
  updateOrderStatus,
  updateOrderNotes,
  getExportUrl,
  type AdminOrder,
  type AdminOrderDetail,
  type AdminOrderStats,
  type OrderStatus,
  type GetOrdersParams,
} from "../../api/Adminorders";
import { IMAGES } from "../../data/store";

// ─── Config statuts ────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; icon: any }
> = {
  pending:   { label: "En attente",    color: "#F59E0B", icon: Clock },
  confirmed: { label: "Confirmée",     color: "#3B82F6", icon: CheckCircle2 },
  processing: { label: "En préparation",color: "#8B5CF6", icon: Package },
  shipped:   { label: "Expédiée",      color: "#06B6D4", icon: Truck },
  delivered: { label: "Livrée",        color: "#10B981", icon: CheckCircle2 },
  cancelled: { label: "Annulée",       color: "#EF4444", icon: XCircle },
  returned:  { label: "Retournée",     color: "#6B7280", icon: RotateCcw },
};

function formatPrice(price: number) {
  return price.toLocaleString("fr-DZ") + " DA";
}
function formatShortDate(date: string) {
  return new Date(date).toLocaleDateString("fr-DZ", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
function formatDateTime(date: string) {
  return new Date(date).toLocaleDateString("fr-DZ", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const ADMIN_ORDERS_REFRESH_MS = 5000;

// ─── Main Page ─────────────────────────────────────────────────────────────
export function AdminOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [stats, setStats] = useState<AdminOrderStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filtres & pagination
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [sortField, setSortField] = useState<"created_at" | "total_ttc" | "status">("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);


  const perPage = 10;

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  // Charger stats
  const loadStats = async () => {
    try {
      const s = await getOrderStats();
      setStats(s);
    } catch {}
  };

  // Charger commandes
  const loadOrders = async ({
    silent = false,
    showRefreshState = false,
  }: {
    silent?: boolean;
    showRefreshState?: boolean;
  } = {}) => {
    if (!silent) {
      setIsLoading(true);
    } else if (showRefreshState) {
      setIsRefreshing(true);
    }

    try {
      const params: GetOrdersParams = {
        search: debouncedSearch || undefined,
        status: statusFilter,
        sort_by: sortField,
        sort_dir: sortDir,
        per_page: perPage,
        page,
      };

      const res = await getOrders(params);
      setOrders(res.data);
      setTotalPages(res.meta.last_page);
      setTotalCount(res.meta.total);
    } catch {
      if (!silent || showRefreshState) {
        toast.error("Impossible de charger les commandes.");
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
      if (showRefreshState) {
        setIsRefreshing(false);
      }
    }
  };

  // Ouvrir le détail
  const openDetail = (id: number) => {
    navigate(`/admin/commandes/${id}`);
  };


  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    loadOrders();
  }, [debouncedSearch, statusFilter, sortField, sortDir, page]);

  useEffect(() => {
    let polling = false;

    const refreshOrders = async () => {
      if (document.visibilityState !== "visible" || polling) {
        return;
      }

      polling = true;

      try {
        await Promise.all([
          loadOrders({ silent: true }),
          loadStats(),
        ]);


      } finally {
        polling = false;
      }
    };

    const intervalId = window.setInterval(() => {
      void refreshOrders();
    }, ADMIN_ORDERS_REFRESH_MS);

    const handleFocus = () => {
      void refreshOrders();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshOrders();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [debouncedSearch, statusFilter, sortField, sortDir, page]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortField(field);
      setSortDir("desc");
    }
    setPage(1);
  };

  const handleExport = () => {
    const url = getExportUrl({ status: statusFilter !== "all" ? statusFilter : undefined });
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-5" style={{ fontFamily: "'Sora', sans-serif" }}>
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: "Total",        value: stats.total,     icon: ShoppingCart, color: "#3B82F6" },
            { label: "En attente",   value: stats.pending,   icon: Clock,        color: "#F59E0B" },
            {
              label: "En cours",
              value: stats.confirmed + stats.processing + stats.shipped,
              icon: Truck, color: "#8B5CF6",
            },
            { label: "Livrées",      value: stats.delivered, icon: CheckCircle2, color: "#10B981" },
            {
              label: "CA livré",
              value: stats.revenue_delivered.toLocaleString("fr-DZ") + " DA",
              icon: ShoppingCart, color: "#FF6B35", isRevenue: true,
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white dark:bg-[#1E1E24] rounded-xl p-4 border border-[#E5E7EB] dark:border-white/10 flex items-center gap-3"
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: s.color + "15" }}
              >
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-[#9CA3AF] truncate">{s.label}</p>
                <p
                  className={`text-[#1A2332] dark:text-white truncate ${"isRevenue" in s ? "text-[13px]" : "text-[18px]"}`}
                  style={{ fontWeight: 700 }}
                >
                  {s.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Status Quick Filters */}
      <div className="flex flex-wrap gap-2">
        {(["all", "pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned"] as const).map(
          (key) => {
            const cfg = key === "all" ? null : STATUS_CONFIG[key];
            const count =
              key === "all"
                ? stats?.total ?? 0
                : (stats?.[key as keyof typeof stats] as number) ?? 0;
            return (
              <button
                key={key}
                onClick={() => { setStatusFilter(key); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-[12px] border transition-colors ${
                  statusFilter === key
                    ? "bg-[#FF6B35] text-white border-[#FF6B35]"
                    : "border-[#E5E7EB] dark:border-white/10 text-[#6B7280] dark:text-white/50"
                }`}
                style={{ fontWeight: 500 }}
              >
                {key === "all" ? "Toutes" : cfg?.label} ({count})
              </button>
            );
          }
        )}
      </div>

      {/* Toolbar */}
      <div className="bg-white dark:bg-[#1E1E24] rounded-xl border border-[#E5E7EB] dark:border-white/10 p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher commande, client, téléphone..."
              className="pl-9 pr-4 py-2 rounded-lg bg-[#F9FAFB] dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10 text-[13px] w-full outline-none text-[#1A2332] dark:text-white placeholder:text-[#9CA3AF] focus:border-[#FF6B35]"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                void Promise.all([
                  loadOrders({ silent: true, showRefreshState: true }),
                  loadStats(),
                  Promise.resolve(),
                ]);
              }}
              disabled={isRefreshing}
              className="w-9 h-9 rounded-lg border border-[#E5E7EB] dark:border-white/10 flex items-center justify-center text-[#6B7280] hover:text-[#FF6B35] disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#E5E7EB] dark:border-white/10 text-[13px] text-[#6B7280] hover:border-[#FF6B35] hover:text-[#FF6B35]"
              style={{ fontWeight: 500 }}
            >
              <Download className="w-4 h-4" /> Exporter CSV
            </button>
          </div>
        </div>
        <p className="text-[12px] text-[#9CA3AF] mt-3">
          {totalCount} commande{totalCount > 1 ? "s" : ""}
        </p>
        <p className="text-[12px] text-[#9CA3AF] mt-1">
          Liste synchronisée automatiquement toutes les 5 secondes.
        </p>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#1E1E24] rounded-xl border border-[#E5E7EB] dark:border-white/10 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-[#E5E7EB] dark:border-white/10 bg-[#F9FAFB] dark:bg-white/5">
                    <th
                      className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-[#9CA3AF]"
                      style={{ fontWeight: 500 }}
                    >
                      Commande
                    </th>
                    <th
                      className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-[#9CA3AF]"
                      style={{ fontWeight: 500 }}
                    >
                      Client
                    </th>
                    <th
                      className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-[#9CA3AF]"
                      style={{ fontWeight: 500 }}
                    >
                      Articles
                    </th>
                    <th
                      className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-[#9CA3AF] cursor-pointer select-none"
                      style={{ fontWeight: 500 }}
                      onClick={() => toggleSort("total_ttc")}
                    >
                      <span className="inline-flex items-center gap-1">
                        Total <ArrowUpDown className="w-3 h-3" />
                      </span>
                    </th>
                    <th
                      className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-[#9CA3AF]"
                      style={{ fontWeight: 500 }}
                    >
                      Statut
                    </th>
                    <th
                      className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-[#9CA3AF]"
                      style={{ fontWeight: 500 }}
                    >
                      Paiement
                    </th>
                    <th
                      className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-[#9CA3AF] cursor-pointer select-none"
                      style={{ fontWeight: 500 }}
                      onClick={() => toggleSort("created_at")}
                    >
                      <span className="inline-flex items-center gap-1">
                        Date <ArrowUpDown className="w-3 h-3" />
                      </span>
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="text-center py-12 text-[#9CA3AF] text-[13px]"
                      >
                        Aucune commande trouvée
                      </td>
                    </tr>
                  ) : (
                    orders.map((o) => {
                      const st = STATUS_CONFIG[o.status];
                      const StIcon = st.icon;
                      return (
                        <tr
                          key={o.id}
                          className="border-b border-[#E5E7EB]/50 dark:border-white/5 hover:bg-[#F9FAFB] dark:hover:bg-white/5 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <p
                              className="text-[#1A2332] dark:text-white"
                              style={{ fontWeight: 600 }}
                            >
                              {o.order_number}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <p
                              className="text-[#1A2332] dark:text-white"
                              style={{ fontWeight: 500 }}
                            >
                              {o.client}
                            </p>
                            {o.phone && (
                              <p className="text-[11px] text-[#9CA3AF]">
                                {o.phone}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5 flex-wrap max-w-[160px]">
                              {o.items_preview.slice(0, 2).map((item, i) => (
                                <span
                                  key={i}
                                  className="text-[11px] text-[#6B7280] dark:text-white/50 truncate"
                                >
                                  {item.quantity}× {item.name}
                                </span>
                              ))}
                              {o.items_count > (o.items_preview.length) && (
                                <span className="text-[10px] text-[#9CA3AF]">
                                  +{o.items_count - o.items_preview.length} autre
                                  {o.items_count - o.items_preview.length > 1 ? "s" : ""}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <p
                              className="text-[#1A2332] dark:text-white"
                              style={{ fontWeight: 600 }}
                            >
                              {formatPrice(o.total_ttc)}
                            </p>
                            {o.delivery_cost === 0 && (
                              <p className="text-[10px] text-[#10B981]">
                                Livraison gratuite
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px]"
                              style={{
                                fontWeight: 500,
                                backgroundColor: st.color + "15",
                                color: st.color,
                              }}
                            >
                              <StIcon className="w-3 h-3" />
                              {st.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[12px] text-[#6B7280]">
                            {o.payment_method === "cash_on_delivery"
                              ? "À la livraison"
                              : o.payment_method}
                          </td>
                          <td className="px-4 py-3 text-[12px] text-[#9CA3AF]">
                            {formatShortDate(o.created_at)}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => openDetail(o.id)}
                              
                              className="w-8 h-8 rounded-lg hover:bg-[#F3F4F6] dark:hover:bg-white/10 flex items-center justify-center text-[#9CA3AF] hover:text-[#FF6B35] transition-colors disabled:opacity-50"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-[#E5E7EB] dark:border-white/10">
                <p className="text-[12px] text-[#9CA3AF]">
                  Page {page} sur {totalPages}
                </p>
                <div className="flex gap-1">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="w-8 h-8 rounded-lg border border-[#E5E7EB] dark:border-white/10 flex items-center justify-center text-[#9CA3AF] disabled:opacity-30"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    const p = i + 1;
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-8 h-8 rounded-lg text-[12px] flex items-center justify-center ${
                          page === p
                            ? "bg-[#FF6B35] text-white"
                            : "text-[#9CA3AF] hover:bg-[#F3F4F6] dark:hover:bg-white/10"
                        }`}
                        style={{ fontWeight: page === p ? 600 : 400 }}
                      >
                        {p}
                      </button>
                    );
                  })}
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                    className="w-8 h-8 rounded-lg border border-[#E5E7EB] dark:border-white/10 flex items-center justify-center text-[#9CA3AF] disabled:opacity-30"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

        </div>
  );
}