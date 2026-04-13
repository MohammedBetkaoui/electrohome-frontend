import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Search,
  Package,
  AlertTriangle,
  Download,
  RefreshCw,
  BarChart3,
  Archive,
  ShieldAlert,
  Boxes,
  Sparkles,
  Info,
  ArrowUpRight,
  CircleAlert,
} from "lucide-react";
import {
  getInventory,
  getInventoryExportUrl,
  getInventoryStats,
  type InventoryItem,
  type InventoryStatus,
  type InventoryStats,
} from "../../api/adminInventory";

const STATUS_MAP: Record<
  InventoryStatus,
  { label: string; color: string; description: string }
> = {
  in_stock: {
    label: "En stock",
    color: "#10B981",
    description: "Le stock disponible est supérieur au seuil minimum.",
  },
  low_stock: {
    label: "Stock bas",
    color: "#F59E0B",
    description: "Le stock disponible est proche ou inférieur au seuil.",
  },
  out_of_stock: {
    label: "Rupture",
    color: "#EF4444",
    description: "Le stock physique est épuisé pour cette référence.",
  },
  overstocked: {
    label: "Surstock",
    color: "#3B82F6",
    description: "Le volume en stock est bien supérieur au besoin estimé.",
  },
};

type ViewMode = "all" | "critical" | "best_value";
type PaginationToken = number | "ellipsis-left" | "ellipsis-right";

const PAGE_SIZE_OPTIONS = [10, 20, 50];

function formatPrice(price: number) {
  return price.toLocaleString("fr-DZ") + " DA";
}

function formatDate(date: string | null) {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("fr-DZ", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getCoverageDays(item: InventoryItem) {
  const denominator = Math.max(item.minStock, 1);
  return Math.round((item.available / denominator) * 30);
}

export function AdminInventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<InventoryStatus | "all">(
    "all",
  );
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search);
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [search]);

  const loadStats = async () => {
    try {
      const data = await getInventoryStats();
      setStats(data);
    } catch {
      toast.error("Impossible de charger les statistiques d’inventaire.");
    }
  };

  const loadInventory = async ({
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
      const data = await getInventory({
        search: debouncedSearch || undefined,
        status: statusFilter,
        category: categoryFilter,
        sort_by: "updated_at",
        sort_dir: "desc",
      });

      setItems(data);
    } catch {
      if (!silent || showRefreshState) {
        toast.error("Impossible de charger l’inventaire.");
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

  useEffect(() => {
    void loadStats();
  }, []);

  useEffect(() => {
    void loadInventory();
  }, [debouncedSearch, statusFilter, categoryFilter]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, categoryFilter, viewMode, pageSize]);

  const categories = useMemo(
    () => [...new Set(items.map((item) => item.category).filter(Boolean))],
    [items],
  );

  const computed = useMemo(() => {
    const enriched = items.map((item) => ({
      ...item,
      coverageDays: getCoverageDays(item),
      stockValue: item.stock * item.price,
      needsAttention:
        item.status === "low_stock" || item.status === "out_of_stock",
      pressureScore:
        item.status === "out_of_stock"
          ? 1000
          : item.status === "low_stock"
            ? 500 + item.reserved * 5 + Math.max(item.minStock - item.available, 0)
            : item.reserved,
    }));

    const criticalItems = [...enriched]
      .filter((item) => item.needsAttention)
      .sort((a, b) => b.pressureScore - a.pressureScore)
      .slice(0, 5);

    const topValueItems = [...enriched]
      .sort((a, b) => b.stockValue - a.stockValue)
      .slice(0, 5);

    let visibleItems = enriched;

    if (viewMode === "critical") {
      visibleItems = enriched.filter((item) => item.needsAttention);
    }

    if (viewMode === "best_value") {
      visibleItems = [...enriched].sort((a, b) => b.stockValue - a.stockValue);
    }

    return {
      visibleItems,
      criticalItems,
      topValueItems,
      attentionCount: enriched.filter((item) => item.needsAttention).length,
      reservedUnits: enriched.reduce((sum, item) => sum + item.reserved, 0),
      dormantValue: enriched
        .filter((item) => item.status === "overstocked")
        .reduce((sum, item) => sum + item.stockValue, 0),
    };
  }, [items, viewMode]);

  const pagination = useMemo(() => {
    const totalItems = computed.visibleItems.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const currentPage = Math.min(page, totalPages);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    const pageItems = computed.visibleItems.slice(startIndex, endIndex);

    const from = totalItems === 0 ? 0 : startIndex + 1;
    const to = totalItems === 0 ? 0 : Math.min(endIndex, totalItems);

    const pages: PaginationToken[] = [];

    if (totalPages <= 7) {
      for (let index = 1; index <= totalPages; index += 1) {
        pages.push(index);
      }
    } else {
      pages.push(1);

      const showLeftEllipsis = currentPage > 4;
      const showRightEllipsis = currentPage < totalPages - 3;

      if (showLeftEllipsis) {
        pages.push("ellipsis-left");
      }

      const windowStart = showLeftEllipsis ? Math.max(2, currentPage - 1) : 2;
      const windowEnd = showRightEllipsis
        ? Math.min(totalPages - 1, currentPage + 1)
        : totalPages - 1;

      for (let index = windowStart; index <= windowEnd; index += 1) {
        pages.push(index);
      }

      if (showRightEllipsis) {
        pages.push("ellipsis-right");
      }

      pages.push(totalPages);
    }

    return {
      totalItems,
      totalPages,
      currentPage,
      from,
      to,
      pageItems,
      pages,
      canGoPrevious: currentPage > 1,
      canGoNext: currentPage < totalPages,
    };
  }, [computed.visibleItems, page, pageSize]);

  useEffect(() => {
    if (page > pagination.totalPages) {
      setPage(pagination.totalPages);
    }
  }, [page, pagination.totalPages]);

  const handleRefresh = async () => {
    await Promise.all([
      loadInventory({ silent: true, showRefreshState: true }),
      loadStats(),
    ]);
  };

  const handleExport = () => {
    const url = getInventoryExportUrl({
      search: debouncedSearch || undefined,
      status: statusFilter,
      category: categoryFilter,
      sort_by: "updated_at",
      sort_dir: "desc",
    });

    window.open(url, "_blank");
  };

  return (
    <div className="space-y-5" style={{ fontFamily: "'Sora', sans-serif" }}>
      <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white dark:border-white/10 dark:bg-[#1E1E24]">
        <div className="relative p-5 sm:p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,107,53,0.12),transparent_35%),radial-gradient(circle_at_left,rgba(59,130,246,0.10),transparent_30%)]" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#FFE2D5] bg-[#FFF4EF] px-3 py-1 text-[12px] text-[#FF6B35] dark:border-[#FF6B35]/20 dark:bg-[#FF6B35]/10">
                <Sparkles className="h-3.5 w-3.5" />
                Centre de pilotage inventaire
              </div>
              <div>
                <h1 className="text-[24px] text-[#1A2332] dark:text-white">
                  Inventaire intelligent
                </h1>
                <p className="mt-1 max-w-2xl text-[13px] text-[#6B7280] dark:text-white/60">
                  Vue priorisée du stock, des alertes critiques et des références
                  à forte valeur pour agir plus vite.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[520px]">
              {[
                {
                  label: "Valeur totale",
                  value: stats ? formatPrice(stats.total_value) : "—",
                  icon: Package,
                  color: "#FF6B35",
                },
                {
                  label: "Unités réservées",
                  value: computed.reservedUnits.toLocaleString(),
                  icon: Boxes,
                  color: "#8B5CF6",
                },
                {
                  label: "Alertes actives",
                  value: computed.attentionCount.toString(),
                  icon: ShieldAlert,
                  color: "#EF4444",
                },
                {
                  label: "Valeur surstock",
                  value: formatPrice(computed.dormantValue),
                  icon: BarChart3,
                  color: "#3B82F6",
                },
              ].map((card) => (
                <div
                  key={card.label}
                  className="rounded-xl border border-[#E5E7EB] bg-white/85 p-4 backdrop-blur dark:border-white/10 dark:bg-white/5"
                >
                  <div
                    className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${card.color}15` }}
                  >
                    <card.icon className="h-4 w-4" style={{ color: card.color }} />
                  </div>
                  <p className="text-[11px] text-[#9CA3AF]">{card.label}</p>
                  <p
                    className="mt-1 truncate text-[16px] text-[#1A2332] dark:text-white"
                    style={{ fontWeight: 700 }}
                  >
                    {card.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        <div className="space-y-5">
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 dark:border-white/10 dark:bg-[#1E1E24]">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <div className="relative w-full sm:min-w-[220px] sm:flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher par nom ou SKU..."
                    className="w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] py-2.5 pl-9 pr-4 text-[13px] text-[#1A2332] outline-none placeholder:text-[#9CA3AF] focus:border-[#FF6B35] dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as InventoryStatus | "all")
                  }
                  className="w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2.5 text-[13px] text-[#1A2332] outline-none sm:w-auto dark:border-white/10 dark:bg-white/5 dark:text-white"
                >
                  <option value="all">Tous les statuts</option>
                  {Object.entries(STATUS_MAP).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value.label}
                    </option>
                  ))}
                </select>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2.5 text-[13px] text-[#1A2332] outline-none sm:w-auto dark:border-white/10 dark:bg-white/5 dark:text-white"
                >
                  <option value="all">Toutes catégories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => void handleRefresh()}
                  disabled={isRefreshing}
                  className="flex h-10 w-full items-center justify-center rounded-xl border border-[#E5E7EB] text-[#6B7280] hover:text-[#FF6B35] disabled:opacity-50 sm:w-10 dark:border-white/10"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                  />
                </button>

                <button
                  onClick={handleExport}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#E5E7EB] px-3 py-2.5 text-[12px] text-[#6B7280] hover:border-[#FF6B35] hover:text-[#FF6B35] sm:w-auto dark:border-white/10"
                  style={{ fontWeight: 500 }}
                >
                  <Download className="h-3.5 w-3.5" /> Exporter
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {[
                  {
                    key: "all" as ViewMode,
                    label: "Vue complète",
                    count: items.length,
                  },
                  {
                    key: "critical" as ViewMode,
                    label: "Priorité critique",
                    count: computed.attentionCount,
                  },
                  {
                    key: "best_value" as ViewMode,
                    label: "Plus forte valeur",
                    count: computed.topValueItems.length,
                  },
                ].map((mode) => (
                  <button
                    key={mode.key}
                    onClick={() => setViewMode(mode.key)}
                    className={`rounded-full px-3 py-1.5 text-[12px] transition-colors ${
                      viewMode === mode.key
                        ? "bg-[#FF6B35] text-white"
                        : "border border-[#E5E7EB] text-[#6B7280] dark:border-white/10 dark:text-white/60"
                    }`}
                    style={{ fontWeight: 600 }}
                  >
                    {mode.label} ({mode.count})
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white dark:border-white/10 dark:bg-[#1E1E24]">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#FF6B35] border-t-transparent" />
              </div>
            ) : (
              <>
                <div className="divide-y divide-[#E5E7EB] dark:divide-white/10 md:hidden">
                  {pagination.totalItems === 0 ? (
                    <div className="py-12 text-center text-[13px] text-[#9CA3AF]">
                      Aucun article trouvé
                    </div>
                  ) : (
                    pagination.pageItems.map((item) => {
                      const statusConfig = STATUS_MAP[item.status];
                      const coverageTone =
                        item.coverageDays <= 30
                          ? "#EF4444"
                          : item.coverageDays <= 60
                            ? "#F59E0B"
                            : "#10B981";

                      return (
                        <article key={item.id} className="space-y-3 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p
                                className="truncate text-[14px] text-[#1A2332] dark:text-white"
                                style={{ fontWeight: 700 }}
                              >
                                {item.name}
                              </p>
                              <p className="mt-1 truncate text-[11px] text-[#9CA3AF]">
                                <span className="font-mono">{item.sku}</span> • {item.category}
                              </p>
                              <p className="truncate text-[11px] text-[#9CA3AF]">
                                Fournisseur: {item.supplier}
                              </p>
                            </div>

                            <span
                              className="inline-flex rounded-full px-2.5 py-1 text-[10px]"
                              style={{
                                fontWeight: 700,
                                backgroundColor: `${statusConfig.color}15`,
                                color: statusConfig.color,
                              }}
                            >
                              {statusConfig.label}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-center">
                            {[
                              {
                                label: "Stock",
                                value: item.stock,
                                valueClass: "text-[#1A2332] dark:text-white",
                              },
                              {
                                label: "Réservé",
                                value: item.reserved,
                                valueClass: "text-[#8B5CF6]",
                              },
                              {
                                label: "Disponible",
                                value: item.available,
                                valueClass: "text-[#1A2332] dark:text-white",
                              },
                              {
                                label: "Seuil",
                                value: item.minStock,
                                valueClass: "text-[#6B7280] dark:text-white/70",
                              },
                            ].map((metric) => (
                              <div
                                key={metric.label}
                                className="rounded-lg bg-[#F9FAFB] px-2 py-2 dark:bg-white/5"
                              >
                                <p className="text-[10px] text-[#9CA3AF]">{metric.label}</p>
                                <p
                                  className={`text-[13px] ${metric.valueClass}`}
                                  style={{ fontWeight: 700 }}
                                >
                                  {metric.value}
                                </p>
                              </div>
                            ))}
                          </div>

                          <div className="space-y-2">
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#E5E7EB] dark:bg-white/10">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${Math.min(
                                    100,
                                    Math.max(
                                      8,
                                      (item.available / Math.max(item.stock, 1)) * 100,
                                    ),
                                  )}%`,
                                  backgroundColor: statusConfig.color,
                                }}
                              />
                            </div>

                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-[#9CA3AF]">
                                MAJ {formatDate(item.lastRestocked)}
                              </span>
                              <span style={{ color: coverageTone, fontWeight: 700 }}>
                                {item.coverageDays} j
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-[12px]">
                              <span className="text-[#9CA3AF]">Valeur stock</span>
                              <span
                                className="text-[#1A2332] dark:text-white"
                                style={{ fontWeight: 700 }}
                              >
                                {formatPrice(item.stockValue)}
                              </span>
                            </div>
                          </div>
                        </article>
                      );
                    })
                  )}
                </div>

                <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB] dark:border-white/10 dark:bg-white/5">
                      {[
                        "Produit",
                        "Santé stock",
                        "Stock",
                        "Réservé",
                        "Disponible",
                        "Seuil",
                        
                        "Valeur",
                      ].map((header) => (
                        <th
                          key={header}
                          className="px-4 py-3 text-left text-[11px] uppercase tracking-wider text-[#9CA3AF]"
                          style={{ fontWeight: 500 }}
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pagination.totalItems === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="py-12 text-center text-[13px] text-[#9CA3AF]"
                        >
                          Aucun article trouvé
                        </td>
                      </tr>
                    ) : (
                      pagination.pageItems.map((item) => {
                        const statusConfig = STATUS_MAP[item.status];
                        const coverageTone =
                          item.coverageDays <= 30
                            ? "#EF4444"
                            : item.coverageDays <= 60
                              ? "#F59E0B"
                              : "#10B981";

                        return (
                          <tr
                            key={item.id}
                            className="border-b border-[#E5E7EB]/50 transition-colors hover:bg-[#F9FAFB] dark:border-white/5 dark:hover:bg-white/5"
                          >
                            <td className="px-4 py-3">
                              <p
                                className="text-[#1A2332] dark:text-white"
                                style={{ fontWeight: 600 }}
                              >
                                {item.name}
                              </p>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-[#9CA3AF]">
                                <span className="font-mono">{item.sku}</span>
                                <span>•</span>
                                <span>{item.category}</span>
                                <span>•</span>
                                <span>{item.supplier}</span>
                              </div>
                            </td>

                            <td className="px-4 py-3">
                              <span
                                className="inline-flex rounded-full px-2.5 py-1 text-[11px]"
                                style={{
                                  fontWeight: 600,
                                  backgroundColor: `${statusConfig.color}15`,
                                  color: statusConfig.color,
                                }}
                              >
                                {statusConfig.label}
                              </span>
                              <p className="mt-1 text-[11px] text-[#9CA3AF]">
                                MAJ {formatDate(item.lastRestocked)}
                              </p>
                            </td>

                            <td
                              className="px-4 py-3 text-[#1A2332] dark:text-white"
                              style={{ fontWeight: 700 }}
                            >
                              {item.stock}
                            </td>

                            <td
                              className="px-4 py-3 text-[#8B5CF6]"
                              style={{ fontWeight: 600 }}
                            >
                              {item.reserved}
                            </td>

                            <td className="px-4 py-3">
                              <div className="text-[#1A2332] dark:text-white" style={{ fontWeight: 700 }}>
                                {item.available}
                              </div>
                              <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-[#E5E7EB] dark:bg-white/10">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      Math.max(
                                        8,
                                        (item.available / Math.max(item.stock, 1)) * 100,
                                      ),
                                    )}%`,
                                    backgroundColor: statusConfig.color,
                                  }}
                                />
                              </div>
                            </td>

                            <td className="px-4 py-3 text-[#9CA3AF]">
                              <div style={{ fontWeight: 600 }}>{item.minStock}</div>
                              <div className="text-[11px]">minimum visé</div>
                            </td>

                           

                            <td className="px-4 py-3">
                              <div
                                className="text-[#1A2332] dark:text-white"
                                style={{ fontWeight: 700 }}
                              >
                                {formatPrice(item.stockValue)}
                              </div>
                              <p className="text-[11px] text-[#9CA3AF]">
                                {formatPrice(item.price)} / unité
                              </p>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
                </div>

                <div className="flex flex-col gap-3 border-t border-[#E5E7EB] p-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[12px] text-[#6B7280] dark:text-white/60">
                    Affichage {pagination.from} à {pagination.to} sur {pagination.totalItems}
                  </p>

                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex items-center gap-2 text-[12px] text-[#6B7280] dark:text-white/60">
                      Lignes
                      <select
                        value={pageSize}
                        onChange={(event) => {
                          setPageSize(Number(event.target.value));
                        }}
                        className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-2 py-1.5 text-[12px] text-[#1A2332] outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
                      >
                        {PAGE_SIZE_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>

                    <button
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                      disabled={!pagination.canGoPrevious}
                      className="rounded-lg border border-[#E5E7EB] px-3 py-1.5 text-[12px] text-[#6B7280] disabled:opacity-50 dark:border-white/10 dark:text-white/70"
                      style={{ fontWeight: 600 }}
                    >
                      Précédent
                    </button>

                    {pagination.pages.map((token, index) =>
                      typeof token === "number" ? (
                        <button
                          key={token}
                          onClick={() => setPage(token)}
                          className={`rounded-lg px-3 py-1.5 text-[12px] ${
                            pagination.currentPage === token
                              ? "bg-[#FF6B35] text-white"
                              : "border border-[#E5E7EB] text-[#6B7280] dark:border-white/10 dark:text-white/70"
                          }`}
                          style={{ fontWeight: 700 }}
                        >
                          {token}
                        </button>
                      ) : (
                        <span
                          key={`${token}-${index}`}
                          className="px-1 text-[12px] text-[#9CA3AF]"
                        >
                          ...
                        </span>
                      ),
                    )}

                    <button
                      onClick={() =>
                        setPage((current) =>
                          Math.min(pagination.totalPages, current + 1),
                        )
                      }
                      disabled={!pagination.canGoNext}
                      className="rounded-lg border border-[#E5E7EB] px-3 py-1.5 text-[12px] text-[#6B7280] disabled:opacity-50 dark:border-white/10 dark:text-white/70"
                      style={{ fontWeight: 600 }}
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 dark:border-white/10 dark:bg-[#1E1E24]">
            <div className="mb-4 flex items-center gap-2">
              <CircleAlert className="h-4 w-4 text-[#EF4444]" />
              <h3
                className="text-[14px] text-[#1A2332] dark:text-white"
                style={{ fontWeight: 700 }}
              >
                Références à traiter en priorité
              </h3>
            </div>

            <div className="space-y-3">
              {computed.criticalItems.length === 0 ? (
                <p className="text-[13px] text-[#9CA3AF]">
                  Aucune alerte critique pour le moment.
                </p>
              ) : (
                computed.criticalItems.map((item) => {
                  const statusConfig = STATUS_MAP[item.status];

                  return (
                    <div
                      key={item.id}
                      className="rounded-xl border border-[#E5E7EB] p-3 dark:border-white/10"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p
                            className="truncate text-[13px] text-[#1A2332] dark:text-white"
                            style={{ fontWeight: 600 }}
                          >
                            {item.name}
                          </p>
                          <p className="mt-1 text-[11px] text-[#9CA3AF]">
                            {item.category} • {item.supplier}
                          </p>
                        </div>
                        <span
                          className="rounded-full px-2 py-1 text-[10px]"
                          style={{
                            fontWeight: 700,
                            backgroundColor: `${statusConfig.color}15`,
                            color: statusConfig.color,
                          }}
                        >
                          {statusConfig.label}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                        {[
                          { label: "Disponible", value: item.available },
                          { label: "Seuil", value: item.minStock },
                          { label: "Réservé", value: item.reserved },
                        ].map((metric) => (
                          <div
                            key={metric.label}
                            className="rounded-lg bg-[#F9FAFB] px-2 py-2 dark:bg-white/5"
                          >
                            <p className="text-[10px] text-[#9CA3AF]">
                              {metric.label}
                            </p>
                            <p
                              className="text-[13px] text-[#1A2332] dark:text-white"
                              style={{ fontWeight: 700 }}
                            >
                              {metric.value}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 dark:border-white/10 dark:bg-[#1E1E24]">
            <div className="mb-4 flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-[#3B82F6]" />
              <h3
                className="text-[14px] text-[#1A2332] dark:text-white"
                style={{ fontWeight: 700 }}
              >
                Références à plus forte valeur stockée
              </h3>
            </div>

            <div className="space-y-3">
              {computed.topValueItems.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[#E5E7EB] p-3 dark:border-white/10"
                >
                  <div className="min-w-0">
                    <p className="text-[12px] text-[#9CA3AF]">#{index + 1}</p>
                    <p
                      className="truncate text-[13px] text-[#1A2332] dark:text-white"
                      style={{ fontWeight: 600 }}
                    >
                      {item.name}
                    </p>
                    <p className="text-[11px] text-[#9CA3AF]">
                      {item.stock} unités • {item.category}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className="text-[13px] text-[#1A2332] dark:text-white"
                      style={{ fontWeight: 700 }}
                    >
                      {formatPrice(item.stockValue)}
                    </p>
                    <p className="text-[11px] text-[#9CA3AF]">
                      {formatPrice(item.price)} / unité
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 dark:border-white/10 dark:bg-[#1E1E24]">
            <div className="mb-3 flex items-center gap-2">
              <Info className="h-4 w-4 text-[#FF6B35]" />
              <h3
                className="text-[14px] text-[#1A2332] dark:text-white"
                style={{ fontWeight: 700 }}
              >
                Guide des statuts & seuil
              </h3>
            </div>

            <div className="space-y-3">
              {Object.values(STATUS_MAP).map((status) => (
                <div
                  key={status.label}
                  className="rounded-xl border border-[#E5E7EB] p-3 dark:border-white/10"
                >
                  <div className="mb-1 flex items-center gap-2">
                    <span
                      className="inline-flex rounded-full px-2 py-1 text-[10px]"
                      style={{
                        fontWeight: 700,
                        backgroundColor: `${status.color}15`,
                        color: status.color,
                      }}
                    >
                      {status.label}
                    </span>
                  </div>
                  <p className="text-[12px] text-[#6B7280] dark:text-white/60">
                    {status.description}
                  </p>
                </div>
              ))}

              <div className="rounded-xl border border-dashed border-[#FF6B35]/30 bg-[#FFF8F4] p-3 dark:bg-[#FF6B35]/5">
                <p
                  className="text-[12px] text-[#1A2332] dark:text-white"
                  style={{ fontWeight: 700 }}
                >
                  Colonne “Seuil”
                </p>
                <p className="mt-1 text-[12px] text-[#6B7280] dark:text-white/60">
                  Le seuil représente le minimum recommandé avant alerte. Si le
                  disponible passe sous ce niveau, la référence devient “Stock
                  bas”.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
