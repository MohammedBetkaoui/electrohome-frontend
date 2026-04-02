import { useEffect, useMemo, useState } from "react";
import {
  Search, Eye, X, ChevronLeft, ChevronRight, ArrowUpDown,
  Users, UserCheck, UserX, ShieldAlert, Mail, Phone, MapPin,
  Calendar, ShoppingCart, Ban, CheckCircle2,
  Download, TrendingUp, CreditCard, Package, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  getClient,
  getClients,
  getClientStats,
  getClientsExportUrl,
  updateClientStatus,
  type AdminClient,
  type AdminClientDetail,
  type AdminClientOrder,
  type ClientStatus,
} from "../../api/adminClients";

const STATUS_CONFIG: Record<ClientStatus, { label: string; color: string }> = {
  active: { label: "Actif", color: "#10B981" },
  inactive: { label: "Inactif", color: "#F59E0B" },
  blocked: { label: "Bloque", color: "#EF4444" },
};

function formatPrice(price: number) {
  return price.toLocaleString("fr-DZ") + " DA";
}

function formatDate(date: string | null) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("fr-DZ", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getInitials(first: string, last: string) {
  return (first[0] + last[0]).toUpperCase();
}

const AVATAR_COLORS = ["#FF6B35", "#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#06B6D4", "#EC4899", "#EF4444"];
function avatarColor(id: string) {
  const idx = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[idx % AVATAR_COLORS.length];
}

function mapStatus(status: string | null | undefined): ClientStatus {
  if (status === "inactive") return "inactive";
  if (status === "blocked") return "blocked";
  return "active";
}

function withMappedStatus<T extends { status: string | null | undefined }>(item: T): T & { status: ClientStatus } {
  return {
    ...item,
    status: mapStatus(item.status),
  };
}

function ClientDetailModal({
  client,
  onClose,
  onStatusChange,
}: {
  client: AdminClientDetail;
  onClose: () => void;
  onStatusChange: (id: number, status: ClientStatus, note?: string) => Promise<void>;
}) {
  const st = STATUS_CONFIG[client.status];
  const [tab, setTab] = useState<"overview" | "orders">("overview");
  const [isUpdating, setIsUpdating] = useState(false);

  const runStatusChange = async (status: ClientStatus) => {
    setIsUpdating(true);
    await onStatusChange(client.userId, status, client.notes ?? undefined);
    setIsUpdating(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-start justify-center pt-6 overflow-y-auto" onClick={onClose}>
      <div
        className="bg-white dark:bg-[#1E1E24] rounded-2xl w-full max-w-3xl shadow-2xl m-4 mb-10"
        style={{ fontFamily: "'Sora', sans-serif" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-6 border-b border-[#E5E7EB] dark:border-white/10">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-[18px] shrink-0"
              style={{ fontWeight: 600, backgroundColor: avatarColor(client.id) }}
            >
              {getInitials(client.firstName, client.lastName)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[17px] text-[#1A2332] dark:text-white" style={{ fontWeight: 600 }}>
                  {client.firstName} {client.lastName}
                </h2>
                <span
                  className="inline-flex px-2 py-0.5 rounded-full text-[10px]"
                  style={{ fontWeight: 500, backgroundColor: st.color + "15", color: st.color }}
                >
                  {st.label}
                </span>
              </div>
              <p className="text-[12px] text-[#9CA3AF] mt-0.5">{client.id} · Client depuis {formatDate(client.createdAt)}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-[#F3F4F6] dark:bg-white/10 flex items-center justify-center text-[#6B7280] hover:text-[#1A2332] dark:hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex border-b border-[#E5E7EB] dark:border-white/10 px-6">
          {(["overview", "orders"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-3 text-[13px] border-b-2 transition-colors ${
                tab === t
                  ? "border-[#FF6B35] text-[#FF6B35]"
                  : "border-transparent text-[#9CA3AF] hover:text-[#6B7280]"
              }`}
              style={{ fontWeight: 500 }}
            >
              {t === "overview" ? "Apercu" : `Commandes (${client.orders.length})`}
            </button>
          ))}
        </div>

        <div className="p-6 max-h-[65vh] overflow-y-auto">
          {tab === "overview" ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: "Total depense", value: formatPrice(client.totalSpent), icon: CreditCard, color: "#FF6B35" },
                  { label: "Commandes", value: client.totalOrders, icon: ShoppingCart, color: "#3B82F6" },
                  { label: "Panier moyen", value: formatPrice(client.averageOrder), icon: TrendingUp, color: "#10B981" },
                  { label: "Categorie favorite", value: client.favoriteCategory, icon: Package, color: "#8B5CF6", small: true },
                ].map((kpi) => (
                  <div key={kpi.label} className="bg-[#F9FAFB] dark:bg-white/5 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <kpi.icon className="w-3.5 h-3.5" style={{ color: kpi.color }} />
                      <span className="text-[11px] text-[#9CA3AF]">{kpi.label}</span>
                    </div>
                    <p className={`text-[#1A2332] dark:text-white ${"small" in kpi ? "text-[12px]" : "text-[15px]"}`} style={{ fontWeight: 600 }}>
                      {kpi.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="bg-[#F9FAFB] dark:bg-white/5 rounded-xl p-4 space-y-3">
                <h4 className="text-[13px] text-[#1A2332] dark:text-white" style={{ fontWeight: 600 }}>Contact</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-[12px] text-[#6B7280] dark:text-white/50">
                    <Mail className="w-3.5 h-3.5 shrink-0" /> {client.email}
                  </div>
                  <div className="flex items-center gap-2 text-[12px] text-[#6B7280] dark:text-white/50">
                    <Phone className="w-3.5 h-3.5 shrink-0" /> {client.phone || "-"}
                  </div>
                  <div className="flex items-start gap-2 text-[12px] text-[#6B7280] dark:text-white/50 md:col-span-2">
                    <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>{client.address || "Adresse non renseignee"}{client.wilaya ? `, ${client.wilaya}` : ""}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-[#F9FAFB] dark:bg-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-[#9CA3AF]" />
                    <span className="text-[11px] text-[#9CA3AF]">Inscrit le</span>
                  </div>
                  <p className="text-[13px] text-[#1A2332] dark:text-white" style={{ fontWeight: 500 }}>{formatDate(client.createdAt)}</p>
                </div>
                <div className="bg-[#F9FAFB] dark:bg-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <ShoppingCart className="w-3.5 h-3.5 text-[#9CA3AF]" />
                    <span className="text-[11px] text-[#9CA3AF]">Derniere commande</span>
                  </div>
                  <p className="text-[13px] text-[#1A2332] dark:text-white" style={{ fontWeight: 500 }}>{formatDate(client.lastOrderAt)}</p>
                </div>
              </div>

              {client.notes && (
                <div className="bg-[#FEF3C7] dark:bg-[#F59E0B]/10 rounded-xl p-4">
                  <p className="text-[12px] text-[#92400E] dark:text-[#F59E0B]" style={{ fontWeight: 500 }}>Note interne</p>
                  <p className="text-[13px] text-[#78350F] dark:text-[#FCD34D] mt-1">{client.notes}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-2">
                {client.status !== "blocked" && (
                  <button
                    disabled={isUpdating}
                    onClick={() => void runStatusChange("blocked")}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#EF4444]/30 text-[#EF4444] text-[12px] hover:bg-[#EF4444]/5 transition-colors disabled:opacity-40"
                    style={{ fontWeight: 500 }}
                  >
                    <Ban className="w-3.5 h-3.5" /> Bloquer le client
                  </button>
                )}
                {client.status === "blocked" && (
                  <button
                    disabled={isUpdating}
                    onClick={() => void runStatusChange("active")}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#10B981]/30 text-[#10B981] text-[12px] hover:bg-[#10B981]/5 transition-colors disabled:opacity-40"
                    style={{ fontWeight: 500 }}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Debloquer le client
                  </button>
                )}
                {client.status === "inactive" && (
                  <button
                    disabled={isUpdating}
                    onClick={() => void runStatusChange("active")}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#10B981]/30 text-[#10B981] text-[12px] hover:bg-[#10B981]/5 transition-colors disabled:opacity-40"
                    style={{ fontWeight: 500 }}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Reactiver le client
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {client.orders.length === 0 ? (
                <p className="text-[13px] text-[#9CA3AF] text-center py-8">Aucune commande</p>
              ) : (
                client.orders.map((order: AdminClientOrder) => (
                  <div key={order.id} className="flex items-center justify-between bg-[#F9FAFB] dark:bg-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-white dark:bg-white/10 flex items-center justify-center">
                        <ShoppingCart className="w-4 h-4 text-[#9CA3AF]" />
                      </div>
                      <div>
                        <p className="text-[13px] text-[#1A2332] dark:text-white" style={{ fontWeight: 600 }}>{order.id}</p>
                        <p className="text-[11px] text-[#9CA3AF]">{formatDate(order.date)} · {order.items} article{order.items > 1 ? "s" : ""}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[13px] text-[#1A2332] dark:text-white" style={{ fontWeight: 600 }}>{formatPrice(order.total)}</p>
                      <span
                        className="inline-flex px-2 py-0.5 rounded-full text-[10px] mt-0.5"
                        style={{ fontWeight: 500, backgroundColor: order.statusColor + "15", color: order.statusColor }}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function AdminClients() {
  const [clients, setClients] = useState<AdminClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ClientStatus | "all">("all");
  const [sortField, setSortField] = useState<"name" | "totalSpent" | "totalOrders" | "createdAt" | "lastOrderAt">("totalSpent");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState<{ total: number; active: number; inactive: number; blocked: number; totalRevenue: number } | null>(null);

  const [detailClient, setDetailClient] = useState<AdminClientDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const perPage = 8;

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);

    return () => clearTimeout(t);
  }, [search]);

  const loadStats = async () => {
    try {
      const s = await getClientStats();
      setStats(s);
    } catch {
      toast.error("Impossible de charger les statistiques clients.");
    }
  };

  const loadClients = async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!silent) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const response = await getClients({
        search: debouncedSearch || undefined,
        status: statusFilter,
        sort_by: sortField,
        sort_dir: sortDir,
        per_page: perPage,
        page,
      });

      setClients(response.data.map((client) => withMappedStatus(client)));
      setTotalPages(response.meta.last_page || 1);
      setTotalCount(response.meta.total || 0);
    } catch {
      toast.error("Impossible de charger les clients.");
    } finally {
      if (!silent) setIsLoading(false);
      if (silent) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    void loadStats();
  }, []);

  useEffect(() => {
    void loadClients();
  }, [debouncedSearch, statusFilter, sortField, sortDir, page]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
    setPage(1);
  };

  const openDetail = async (clientId: number) => {
    setDetailLoading(true);
    try {
      const detail = await getClient(clientId);
      setDetailClient(withMappedStatus(detail));
    } catch {
      toast.error("Impossible de charger la fiche client.");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleStatusChange = async (id: number, newStatus: ClientStatus, note?: string) => {
    try {
      const updated = withMappedStatus(await updateClientStatus(id, newStatus, note));

      setClients((prev) => prev.map((client) => (client.userId === id ? { ...client, status: updated.status } : client)));
      setDetailClient((prev) => (prev && prev.userId === id ? updated : prev));

      const statusText = STATUS_CONFIG[newStatus].label.toLowerCase();
      toast.success(`Client mis a jour: ${statusText}.`);

      await loadStats();
    } catch {
      toast.error("Erreur lors du changement de statut.");
    }
  };

  const handleExport = () => {
    const exportUrl = getClientsExportUrl({
      search: debouncedSearch || undefined,
      status: statusFilter,
      sort_by: sortField,
      sort_dir: sortDir,
    });

    window.open(exportUrl, "_blank");
  };

  const visibleClients = useMemo(() => clients, [clients]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const activeCount = stats?.active ?? 0;
  const inactiveCount = stats?.inactive ?? 0;
  const blockedCount = stats?.blocked ?? 0;
  const totalClients = stats?.total ?? totalCount;
  const totalRevenue = stats?.totalRevenue ?? 0;

  return (
    <div className="space-y-5" style={{ fontFamily: "'Sora', sans-serif" }}>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "Total clients", value: totalClients, icon: Users, color: "#3B82F6" },
          { label: "Clients actifs", value: activeCount, icon: UserCheck, color: "#10B981" },
          { label: "Inactifs", value: inactiveCount, icon: UserX, color: "#F59E0B" },
          { label: "Bloques", value: blockedCount, icon: ShieldAlert, color: "#EF4444" },
          { label: "CA clients", value: formatPrice(totalRevenue), icon: CreditCard, color: "#FF6B35", isRevenue: true },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-[#1E1E24] rounded-xl p-4 border border-[#E5E7EB] dark:border-white/10 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: s.color + "15" }}>
              <s.icon className="w-4 h-4" style={{ color: s.color }} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-[#9CA3AF] truncate">{s.label}</p>
              <p className={`text-[#1A2332] dark:text-white truncate ${"isRevenue" in s ? "text-[13px]" : "text-[18px]"}`} style={{ fontWeight: 700 }}>
                {s.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {([
          ["all", "Tous"],
          ["active", "Actifs"],
          ["inactive", "Inactifs"],
          ["blocked", "Bloques"],
        ] as const).map(([status, label]) => {
          const count =
            status === "all"
              ? totalClients
              : status === "active"
                ? activeCount
                : status === "inactive"
                  ? inactiveCount
                  : blockedCount;

          return (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status as ClientStatus | "all");
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-[12px] border transition-colors ${
                statusFilter === status
                  ? "bg-[#FF6B35] text-white border-[#FF6B35]"
                  : "border-[#E5E7EB] dark:border-white/10 text-[#6B7280] dark:text-white/50"
              }`}
              style={{ fontWeight: 500 }}
            >
              {label} ({count})
            </button>
          );
        })}
      </div>

      <div className="bg-white dark:bg-[#1E1E24] rounded-xl border border-[#E5E7EB] dark:border-white/10 p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex flex-wrap gap-2 items-center flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par nom, email, tel..."
                className="pl-9 pr-4 py-2 rounded-lg bg-[#F9FAFB] dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10 text-[13px] w-72 outline-none text-[#1A2332] dark:text-white placeholder:text-[#9CA3AF] focus:border-[#FF6B35] transition-colors"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => void Promise.all([loadClients({ silent: true }), loadStats()])}
              disabled={isRefreshing}
              className="w-9 h-9 rounded-lg border border-[#E5E7EB] dark:border-white/10 flex items-center justify-center text-[#6B7280] hover:text-[#FF6B35] disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#E5E7EB] dark:border-white/10 text-[13px] text-[#6B7280] hover:border-[#FF6B35] hover:text-[#FF6B35] transition-colors"
              style={{ fontWeight: 500 }}
            >
              <Download className="w-4 h-4" /> Exporter CSV
            </button>
          </div>
        </div>
        <p className="text-[12px] text-[#9CA3AF] mt-3">{totalCount} client{totalCount > 1 ? "s" : ""}</p>
      </div>

      <div className="bg-white dark:bg-[#1E1E24] rounded-xl border border-[#E5E7EB] dark:border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[#E5E7EB] dark:border-white/10 bg-[#F9FAFB] dark:bg-white/5">
                <th className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-[#9CA3AF]" style={{ fontWeight: 500 }}>Client</th>
                <th className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-[#9CA3AF]" style={{ fontWeight: 500 }}>Contact</th>
                <th className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-[#9CA3AF] cursor-pointer select-none" style={{ fontWeight: 500 }} onClick={() => toggleSort("totalOrders")}>
                  <span className="inline-flex items-center gap-1">Commandes <ArrowUpDown className="w-3 h-3" /></span>
                </th>
                <th className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-[#9CA3AF] cursor-pointer select-none" style={{ fontWeight: 500 }} onClick={() => toggleSort("totalSpent")}>
                  <span className="inline-flex items-center gap-1">Total depense <ArrowUpDown className="w-3 h-3" /></span>
                </th>
                <th className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-[#9CA3AF]" style={{ fontWeight: 500 }}>Statut</th>
                <th className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-[#9CA3AF] cursor-pointer select-none" style={{ fontWeight: 500 }} onClick={() => toggleSort("lastOrderAt")}>
                  <span className="inline-flex items-center gap-1">Derniere cmd <ArrowUpDown className="w-3 h-3" /></span>
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {visibleClients.map((client) => {
                const st = STATUS_CONFIG[client.status];

                return (
                  <tr key={client.userId} className="group border-b border-[#E5E7EB]/50 dark:border-white/5 hover:bg-[#F9FAFB] dark:hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-[12px] shrink-0"
                          style={{ fontWeight: 600, backgroundColor: avatarColor(client.id) }}
                        >
                          {getInitials(client.firstName, client.lastName)}
                        </div>
                        <div>
                          <p className="text-[#1A2332] dark:text-white" style={{ fontWeight: 500 }}>
                            {client.firstName} {client.lastName}
                          </p>
                          <p className="text-[11px] text-[#9CA3AF]">{client.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[12px] text-[#6B7280] dark:text-white/60">{client.email}</p>
                      <p className="text-[11px] text-[#9CA3AF]">{client.phone || "-"}</p>
                    </td>
                    <td className="px-4 py-3 text-[#1A2332] dark:text-white" style={{ fontWeight: 600 }}>
                      {client.totalOrders}
                    </td>
                    <td className="px-4 py-3 text-[#1A2332] dark:text-white" style={{ fontWeight: 600 }}>
                      {formatPrice(client.totalSpent)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex px-2.5 py-0.5 rounded-full text-[11px]"
                        style={{ fontWeight: 500, backgroundColor: st.color + "15", color: st.color }}
                      >
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-[#9CA3AF]">{formatDate(client.lastOrderAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => void openDetail(client.userId)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9CA3AF] hover:bg-[#3B82F6]/10 hover:text-[#3B82F6] transition-colors"
                          title="Voir la fiche"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {client.status !== "blocked" ? (
                          <button
                            onClick={() => void handleStatusChange(client.userId, "blocked")}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9CA3AF] hover:bg-[#EF4444]/10 hover:text-[#EF4444] transition-colors"
                            title="Bloquer"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => void handleStatusChange(client.userId, "active")}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9CA3AF] hover:bg-[#10B981]/10 hover:text-[#10B981] transition-colors"
                            title="Debloquer"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        {client.status === "active" && (
                          <button
                            onClick={() => void handleStatusChange(client.userId, "inactive")}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9CA3AF] hover:bg-[#F59E0B]/10 hover:text-[#F59E0B] transition-colors"
                            title="Marquer inactif"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        )}
                        {client.status === "inactive" && (
                          <button
                            onClick={() => void handleStatusChange(client.userId, "active")}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9CA3AF] hover:bg-[#10B981]/10 hover:text-[#10B981] transition-colors"
                            title="Reactiver"
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {visibleClients.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-[13px] text-[#9CA3AF]">
                    Aucun client trouve.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#E5E7EB] dark:border-white/10">
            <p className="text-[12px] text-[#9CA3AF]">Page {page} sur {totalPages}</p>
            <div className="flex gap-1">
              <button disabled={page === 1} onClick={() => setPage(page - 1)} className="w-8 h-8 rounded-lg border border-[#E5E7EB] dark:border-white/10 flex items-center justify-center text-[#9CA3AF] disabled:opacity-30">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i} onClick={() => setPage(i + 1)} className={`w-8 h-8 rounded-lg text-[12px] flex items-center justify-center ${page === i + 1 ? "bg-[#FF6B35] text-white" : "text-[#9CA3AF] hover:bg-[#F3F4F6] dark:hover:bg-white/10"}`} style={{ fontWeight: page === i + 1 ? 600 : 400 }}>
                  {i + 1}
                </button>
              ))}
              <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="w-8 h-8 rounded-lg border border-[#E5E7EB] dark:border-white/10 flex items-center justify-center text-[#9CA3AF] disabled:opacity-30">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {detailLoading && (
        <div className="fixed inset-0 bg-black/20 z-[95] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {detailClient && (
        <ClientDetailModal
          client={detailClient}
          onClose={() => setDetailClient(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}
