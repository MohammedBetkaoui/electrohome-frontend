import { useState, useMemo, useEffect } from "react";
import {
  Search, Eye, X, ChevronLeft, ChevronRight, ArrowUpDown,
  RotateCcw, Package, AlertTriangle, Mail, Phone, MapPin,
  Download, Printer, Camera, MessageSquare, CreditCard, BarChart3,
  Clock, CheckCircle2, Truck
} from "lucide-react";
import { toast } from "sonner";
import {
  getReturn,
  getReturns,
  type AdminReturn,
  type ReturnStatus,
} from "../../api/adminReturns";

const REASON_LABELS: Record<string, string> = {
  defective: "Produit défectueux",
  wrong_item: "Mauvais produit reçu",
  damaged: "Produit endommagé",
  not_as_described: "Non conforme à la description",
  changed_mind: "Changement d'avis",
  late_delivery: "Livraison trop tardive",
  refused_delivery: "Refuse a la livraison",
  customer_absent: "Client absent",
};

const RETURN_STATUS_CONFIG: Record<
  ReturnStatus,
  { label: string; color: string; icon: any }
> = {
  pending: { label: "En attente", color: "#F59E0B", icon: Clock },
  approved: { label: "Approuve", color: "#3B82F6", icon: CheckCircle2 },
  pickup: { label: "Collecte", color: "#06B6D4", icon: Truck },
  received: { label: "Recu", color: "#8B5CF6", icon: Package },
  inspecting: { label: "Inspection", color: "#6366F1", icon: Eye },
  refunded: { label: "Rembourse", color: "#10B981", icon: CreditCard },
  rejected: { label: "Rejete", color: "#EF4444", icon: X },
};

function formatPrice(price: number) {
  return price.toLocaleString("fr-DZ") + " DA";
}
function formatDate(date: string) {
  return new Date(date).toLocaleDateString("fr-DZ", { day: "2-digit", month: "short", year: "numeric" });
}
function formatDateTime(date: string) {
  return new Date(date).toLocaleDateString("fr-DZ", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ─── Return Detail Modal ───
function ReturnDetailModal({
  ret,
  onClose,
}: {
  ret: AdminReturn;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-start justify-center pt-6 overflow-y-auto" onClick={onClose}>
      <div
        className="bg-white dark:bg-[#1E1E24] rounded-2xl w-full max-w-3xl shadow-2xl m-4 mb-10"
        style={{ fontFamily: "'Sora', sans-serif" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#E5E7EB] dark:border-white/10">
          <div className="flex items-center gap-3">
            <h2 className="text-[17px] text-[#1A2332] dark:text-white" style={{ fontWeight: 600 }}>
              Retour {ret.id}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 rounded-lg bg-[#F3F4F6] dark:bg-white/10 flex items-center justify-center text-[#6B7280] hover:text-[#1A2332] dark:hover:text-white">
              <Printer className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-lg bg-[#F3F4F6] dark:bg-white/10 flex items-center justify-center text-[#6B7280] hover:text-[#1A2332] dark:hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Client */}
            <div className="bg-[#F9FAFB] dark:bg-white/5 rounded-xl p-4 space-y-3">
              <h4 className="text-[13px] text-[#1A2332] dark:text-white" style={{ fontWeight: 600 }}>Client</h4>
              <p className="text-[13px] text-[#1A2332] dark:text-white" style={{ fontWeight: 500 }}>{ret.client}</p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-[12px] text-[#6B7280] dark:text-white/50">
                  <Mail className="w-3.5 h-3.5" /> {ret.email}
                </div>
                <div className="flex items-center gap-2 text-[12px] text-[#6B7280] dark:text-white/50">
                  <Phone className="w-3.5 h-3.5" /> {ret.phone}
                </div>
                <div className="flex items-start gap-2 text-[12px] text-[#6B7280] dark:text-white/50">
                  <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>{ret.address}, {ret.wilaya}</span>
                </div>
              </div>
            </div>

            {/* Return Details */}
            <div className="bg-[#F9FAFB] dark:bg-white/5 rounded-xl p-4 space-y-3">
              <h4 className="text-[13px] text-[#1A2332] dark:text-white" style={{ fontWeight: 600 }}>Détails du retour</h4>
              <div className="space-y-2 text-[12px]">
                <div className="flex justify-between">
                  <span className="text-[#6B7280] dark:text-white/50">Commande d'origine</span>
                  <span className="text-[#FF6B35]" style={{ fontWeight: 500 }}>{ret.orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280] dark:text-white/50">Date de demande</span>
                  <span className="text-[#1A2332] dark:text-white" style={{ fontWeight: 500 }}>{formatDateTime(ret.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280] dark:text-white/50">Dernière MAJ</span>
                  <span className="text-[#1A2332] dark:text-white" style={{ fontWeight: 500 }}>{formatDateTime(ret.updatedAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280] dark:text-white/50">Remboursement via</span>
                  <span className="text-[#1A2332] dark:text-white" style={{ fontWeight: 500 }}>{ret.refundMethod}</span>
                </div>
                {ret.photos && (
                  <div className="flex justify-between items-center">
                    <span className="text-[#6B7280] dark:text-white/50">Photos jointes</span>
                    <span className="inline-flex items-center gap-1 text-[#3B82F6]" style={{ fontWeight: 500 }}>
                      <Camera className="w-3 h-3" /> {ret.photos} photo{ret.photos > 1 ? "s" : ""}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Reason */}
          <div className="bg-[#FEF3C7] dark:bg-[#F59E0B]/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-[#D97706]" />
              <p className="text-[12px] text-[#92400E] dark:text-[#F59E0B]" style={{ fontWeight: 600 }}>
                Motif : {ret.reasonLabel || REASON_LABELS[ret.reason || ""] || ret.reason}
              </p>
            </div>
            <p className="text-[13px] text-[#78350F] dark:text-[#FCD34D]">{ret.reasonDetail}</p>
          </div>

          {/* Items */}
          <div>
            <h4 className="text-[13px] text-[#1A2332] dark:text-white mb-3" style={{ fontWeight: 600 }}>Article{ret.items.length > 1 ? "s" : ""} concerné{ret.items.length > 1 ? "s" : ""}</h4>
            <div className="space-y-2">
              {ret.items.map((item) => (
                <div key={item.sku} className="flex items-center gap-3 bg-[#F9FAFB] dark:bg-white/5 rounded-xl p-3">
                  <div className="w-12 h-12 rounded-lg bg-white dark:bg-white/10 overflow-hidden shrink-0 flex items-center justify-center">
                    {item.image ? (
                      <img src={item.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-5 h-5 text-[#9CA3AF]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-[#1A2332] dark:text-white truncate" style={{ fontWeight: 500 }}>{item.name}</p>
                    <p className="text-[11px] text-[#9CA3AF]">{item.sku} · Qté: {item.quantity}</p>
                  </div>
                  <p className="text-[13px] text-[#1A2332] dark:text-white shrink-0" style={{ fontWeight: 600 }}>{formatPrice(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Refund Amount */}
          {ret.refundAmount > 0 && (
            <div className="bg-[#F0FDF4] dark:bg-[#10B981]/10 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#10B981]" />
                <span className="text-[13px] text-[#166534] dark:text-[#6EE7B7]" style={{ fontWeight: 500 }}>Montant du remboursement</span>
              </div>
              <span className="text-[17px] text-[#166534] dark:text-[#6EE7B7]" style={{ fontWeight: 700 }}>{formatPrice(ret.refundAmount)}</span>
            </div>
          )}

          {/* Admin Notes */}
          {ret.adminNotes && (
            <div className="bg-[#EFF6FF] dark:bg-[#3B82F6]/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4 text-[#3B82F6]" />
                <p className="text-[12px] text-[#1E40AF] dark:text-[#93C5FD]" style={{ fontWeight: 600 }}>Note de l'équipe</p>
              </div>
              <p className="text-[13px] text-[#1E3A5F] dark:text-[#BFDBFE]">{ret.adminNotes}</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───
export function AdminReturns() {
  const [returns, setReturns] = useState<AdminReturn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [reasonFilter, setReasonFilter] = useState("all");
  const [sortField, setSortField] = useState<"createdAt" | "refundAmount">("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [detailReturn, setDetailReturn] = useState<AdminReturn | null>(null);
  const perPage = 8;

  const loadReturns = async () => {
    setIsLoading(true);
    try {
      const res = await getReturns({ per_page: 200 });
      setReturns(res.data);
    } catch {
      toast.error("Impossible de charger les retours.");
    } finally {
      setIsLoading(false);
    }
  };

  const openDetail = async (returnId: number) => {
    setDetailLoading(true);
    try {
      const detail = await getReturn(returnId);
      setDetailReturn(detail);
    } catch {
      toast.error("Impossible de charger le detail du retour.");
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    loadReturns();
  }, []);

  const filtered = useMemo(() => {
    let list = [...returns];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) => {
        const orderId = r.orderId ? r.orderId.toLowerCase() : "";
        return r.id.toLowerCase().includes(q)
          || orderId.includes(q)
          || r.client.toLowerCase().includes(q);
      });
    }
    if (reasonFilter !== "all") list = list.filter((r) => r.reason === reasonFilter);
    list.sort((a, b) => {
      const m = sortDir === "asc" ? 1 : -1;
      if (sortField === "refundAmount") return (a.refundAmount - b.refundAmount) * m;
      return a.createdAt.localeCompare(b.createdAt) * m;
    });
    return list;
  }, [returns, search, reasonFilter, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  };

  const totalRefundAmount = useMemo(
    () => returns.reduce((sum, ret) => sum + ret.refundAmount, 0),
    [returns]
  );
  const averageRefundAmount = returns.length > 0 ? totalRefundAmount / returns.length : 0;
  const returnedItemsTotal = useMemo(
    () => returns.reduce((sum, ret) => sum + ret.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0),
    [returns]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5" style={{ fontFamily: "'Sora', sans-serif" }}>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total retours", value: returns.length, icon: RotateCcw, color: "#3B82F6" },
          { label: "Articles retours", value: returnedItemsTotal, icon: Package, color: "#F59E0B" },
          { label: "Montant total", value: formatPrice(totalRefundAmount), icon: CreditCard, color: "#10B981", isPrice: true },
          { label: "Montant moyen", value: formatPrice(averageRefundAmount), icon: BarChart3, color: "#8B5CF6", isPrice: true },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-[#1E1E24] rounded-xl p-4 border border-[#E5E7EB] dark:border-white/10 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: s.color + "15" }}>
              <s.icon className="w-4 h-4" style={{ color: s.color }} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-[#9CA3AF] truncate">{s.label}</p>
              <p className={`text-[#1A2332] dark:text-white truncate ${"isPrice" in s ? "text-[13px]" : "text-[18px]"}`} style={{ fontWeight: 700 }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white dark:bg-[#1E1E24] rounded-xl border border-[#E5E7EB] dark:border-white/10 p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex flex-wrap gap-2 items-center flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
              <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Rechercher par ID, commande, client..." className="pl-9 pr-4 py-2 rounded-lg bg-[#F9FAFB] dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10 text-[13px] w-64 outline-none text-[#1A2332] dark:text-white placeholder:text-[#9CA3AF] focus:border-[#FF6B35] transition-colors" />
            </div>
            <select value={reasonFilter} onChange={(e) => { setReasonFilter(e.target.value); setPage(1); }} className="px-3 py-2 rounded-lg bg-[#F9FAFB] dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10 text-[13px] text-[#1A2332] dark:text-white outline-none focus:border-[#FF6B35] transition-colors">
              <option value="all">Tous les motifs</option>
              {Object.entries(REASON_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#E5E7EB] dark:border-white/10 text-[13px] text-[#6B7280] hover:border-[#FF6B35] hover:text-[#FF6B35] transition-colors" style={{ fontWeight: 500 }}>
            <Download className="w-4 h-4" /> Exporter
          </button>
        </div>
        <p className="text-[12px] text-[#9CA3AF] mt-3">{filtered.length} retour{filtered.length > 1 ? "s" : ""}</p>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#1E1E24] rounded-xl border border-[#E5E7EB] dark:border-white/10 overflow-hidden">
        <div className="md:hidden p-3 space-y-3">
          {paginated.length === 0 ? (
            <div className="text-center py-10 text-[#9CA3AF] text-[13px]">
              Aucun retour trouve
            </div>
          ) : (
            paginated.map((r) => {
              const status = RETURN_STATUS_CONFIG[r.status];
              const StatusIcon = status.icon;

              return (
                <article
                  key={r.id}
                  className="rounded-2xl border border-[#E5E7EB] dark:border-white/10 bg-[linear-gradient(135deg,rgba(255,107,53,0.05),rgba(59,130,246,0.03))] dark:bg-white/[0.02] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p
                        className="text-[#1A2332] dark:text-white truncate"
                        style={{ fontWeight: 700 }}
                      >
                        {r.id}
                      </p>
                      <p className="text-[12px] text-[#FF6B35] truncate mt-0.5">
                        {r.orderId || "Commande inconnue"}
                      </p>
                    </div>

                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] shrink-0"
                      style={{
                        fontWeight: 600,
                        backgroundColor: status.color + "15",
                        color: status.color,
                      }}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </span>
                  </div>

                  <p className="mt-2 text-[12px] text-[#6B7280] dark:text-white/60 truncate">
                    {r.client}
                  </p>

                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div className="rounded-xl bg-white/80 dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10 px-3 py-2">
                      <p className="text-[10px] text-[#9CA3AF]">Montant</p>
                      <p className="text-[13px] text-[#1A2332] dark:text-white" style={{ fontWeight: 700 }}>
                        {r.refundAmount > 0 ? formatPrice(r.refundAmount) : "-"}
                      </p>
                    </div>
                    <div className="rounded-xl bg-white/80 dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10 px-3 py-2">
                      <p className="text-[10px] text-[#9CA3AF]">Articles</p>
                      <p className="text-[13px] text-[#1A2332] dark:text-white" style={{ fontWeight: 700 }}>
                        {r.items.reduce((sum, item) => sum + item.quantity, 0)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 rounded-xl border border-[#E5E7EB] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] px-3 py-2">
                    <p className="text-[10px] text-[#9CA3AF] mb-1">Motif</p>
                    <p className="text-[12px] text-[#6B7280] dark:text-white/65 truncate">
                      {r.reasonLabel || REASON_LABELS[r.reason || ""] || r.reason || "-"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3 mt-3 text-[11px] text-[#9CA3AF]">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(r.createdAt)}
                    </span>
                    {r.wilaya && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {r.wilaya}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-end">
                    <button
                      onClick={() => openDetail(r.returnId)}
                      disabled={detailLoading}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] dark:border-white/10 px-3 py-1.5 text-[11px] text-[#6B7280] hover:text-[#FF6B35] hover:border-[#FF6B35] transition-colors disabled:opacity-50"
                      style={{ fontWeight: 600 }}
                    >
                      Voir detail <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[#E5E7EB] dark:border-white/10 bg-[#F9FAFB] dark:bg-white/5">
                <th className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-[#9CA3AF]" style={{ fontWeight: 500 }}>Retour</th>
                <th className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-[#9CA3AF]" style={{ fontWeight: 500 }}>Client</th>
                <th className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-[#9CA3AF]" style={{ fontWeight: 500 }}>Article</th>
                <th className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-[#9CA3AF]" style={{ fontWeight: 500 }}>Motif</th>
                <th className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-[#9CA3AF] cursor-pointer select-none" style={{ fontWeight: 500 }} onClick={() => toggleSort("refundAmount")}>
                  <span className="inline-flex items-center gap-1">Montant <ArrowUpDown className="w-3 h-3" /></span>
                </th>
                <th className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-[#9CA3AF] cursor-pointer select-none" style={{ fontWeight: 500 }} onClick={() => toggleSort("createdAt")}>
                  <span className="inline-flex items-center gap-1">Date <ArrowUpDown className="w-3 h-3" /></span>
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {paginated.map((r) => {
                return (
                  <tr key={r.id} className="border-b border-[#E5E7EB]/50 dark:border-white/5 hover:bg-[#F9FAFB] dark:hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-[#1A2332] dark:text-white" style={{ fontWeight: 600 }}>{r.id}</p>
                      <p className="text-[11px] text-[#FF6B35]">{r.orderId}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[#1A2332] dark:text-white" style={{ fontWeight: 500 }}>{r.client}</p>
                      <p className="text-[11px] text-[#9CA3AF]">{r.phone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[#F3F4F6] dark:bg-white/10 overflow-hidden shrink-0 flex items-center justify-center">
                          {r.items[0]?.image ? (
                            <img src={r.items[0].image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-4 h-4 text-[#9CA3AF]" />
                          )}
                        </div>
                        <p className="text-[12px] text-[#6B7280] dark:text-white/60 truncate max-w-[140px]">
                          {r.items[0]?.name || "—"}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[12px] text-[#6B7280] dark:text-white/60">
                        {r.reasonLabel || REASON_LABELS[r.reason || ""] || r.reason || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#1A2332] dark:text-white" style={{ fontWeight: 600 }}>
                      {r.refundAmount > 0 ? formatPrice(r.refundAmount) : "—"}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-[#9CA3AF]">{formatDate(r.createdAt)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openDetail(r.returnId)}
                        disabled={detailLoading}
                        className="w-8 h-8 rounded-lg hover:bg-[#F3F4F6] dark:hover:bg-white/10 flex items-center justify-center text-[#9CA3AF] hover:text-[#FF6B35] transition-colors disabled:opacity-50"
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

        {/* Pagination */}
        {totalPages > 1 && (
          <>
            <div className="md:hidden px-4 py-3 border-t border-[#E5E7EB] dark:border-white/10 flex items-center justify-between">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="inline-flex items-center gap-1 rounded-lg border border-[#E5E7EB] dark:border-white/10 px-3 py-1.5 text-[12px] text-[#6B7280] disabled:opacity-30"
                style={{ fontWeight: 600 }}
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Precedent
              </button>
              <p className="text-[12px] text-[#9CA3AF]">{page}/{totalPages}</p>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="inline-flex items-center gap-1 rounded-lg border border-[#E5E7EB] dark:border-white/10 px-3 py-1.5 text-[12px] text-[#6B7280] disabled:opacity-30"
                style={{ fontWeight: 600 }}
              >
                Suivant <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="hidden md:flex items-center justify-between px-4 py-3 border-t border-[#E5E7EB] dark:border-white/10">
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
          </>
        )}
      </div>

      {/* Detail Modal */}
      {detailReturn && (
        <ReturnDetailModal
          ret={detailReturn}
          onClose={() => setDetailReturn(null)}
        />
      )}
    </div>
  );
}
