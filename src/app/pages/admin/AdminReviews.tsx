import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Search, Star, CheckCircle2, X, Eye, Flag, MessageCircle, ThumbsUp, ChevronLeft, ChevronRight, Save } from "lucide-react";
import { toast } from "sonner";
import {
  bulkUpdateReviewStatus,
  getReview,
  getReviewStats,
  getReviews,
  updateReviewNotes,
  updateReviewStatus,
  type AdminReview,
  type AdminReviewDetail,
  type ReviewStatus,
} from "../../api/adminReviews";

const STATUS_CFG: Record<ReviewStatus, { label: string; color: string }> = {
  approved: { label: "Approuvé", color: "#10B981" },
  pending: { label: "En attente", color: "#F59E0B" },
  rejected: { label: "Rejeté", color: "#EF4444" },
  flagged: { label: "Signalé", color: "#8B5CF6" },
};

type RatingFilter = "all" | "5" | "4" | "3" | "2" | "1";

const PAGE_SIZE = 10;

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className="w-3.5 h-3.5" fill={i <= rating ? "#F59E0B" : "none"} stroke={i <= rating ? "#F59E0B" : "#D1D5DB"} />
      ))}
    </div>
  );
}

export function AdminReviews() {
  const location = useLocation();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    averageRating: 0,
    pendingCount: 0,
    flaggedCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | "all">("all");
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  const [detailId, setDetailId] = useState<number | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<AdminReviewDetail | null>(null);
  const [notesDraft, setNotesDraft] = useState("");
  const [notesLoading, setNotesLoading] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, ratingFilter]);

  const refreshReviews = async (targetPage = page) => {
    const [reviewsRes, statsRes] = await Promise.all([
      getReviews({
        search: debouncedSearch || undefined,
        status: statusFilter,
        rating: ratingFilter === "all" ? undefined : Number(ratingFilter),
        per_page: PAGE_SIZE,
        page: targetPage,
      }),
      getReviewStats(),
    ]);

    setReviews(reviewsRes.data);
    setTotalPages(Math.max(1, reviewsRes.meta.last_page || 1));
    setTotalCount(reviewsRes.meta.total || 0);
    setStats(statsRes);
    setSelectedIds((prev) => prev.filter((id) => reviewsRes.data.some((row) => row.id === id)));
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);

      try {
        const [reviewsRes, statsRes] = await Promise.all([
          getReviews({
            search: debouncedSearch || undefined,
            status: statusFilter,
            rating: ratingFilter === "all" ? undefined : Number(ratingFilter),
            per_page: PAGE_SIZE,
            page,
          }),
          getReviewStats(),
        ]);

        if (cancelled) return;

        setReviews(reviewsRes.data);
        setTotalPages(Math.max(1, reviewsRes.meta.last_page || 1));
        setTotalCount(reviewsRes.meta.total || 0);
        setStats(statsRes);
        setSelectedIds((prev) => prev.filter((id) => reviewsRes.data.some((row) => row.id === id)));
      } catch {
        if (!cancelled) {
          toast.error("Impossible de charger les avis clients.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, statusFilter, ratingFilter, page]);

  const pages = useMemo(() => {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }, [totalPages]);

  const handleUpdateStatus = async (reviewId: number, status: ReviewStatus) => {
    setActionLoadingId(reviewId);

    try {
      await updateReviewStatus(reviewId, status);
      toast.success("Statut de l'avis mis a jour.");
      await refreshReviews(page);

      if (detailId === reviewId) {
        const reviewDetail = await getReview(reviewId);
        setDetail(reviewDetail);
        setNotesDraft(reviewDetail.adminNotes || "");
      }
    } catch {
      toast.error("Impossible de modifier le statut de cet avis.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const openDetail = async (reviewId: number) => {
    setDetailId(reviewId);
    setDetailLoading(true);

    try {
      const reviewDetail = await getReview(reviewId);
      setDetail(reviewDetail);
      setNotesDraft(reviewDetail.adminNotes || "");
    } catch {
      toast.error("Impossible de charger le detail de cet avis.");
      setDetailId(null);
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const focusValue = Number(params.get("focus"));

    if (!Number.isFinite(focusValue) || focusValue <= 0) {
      return;
    }

    void openDetail(focusValue);

    params.delete("focus");
    const nextSearch = params.toString();
    navigate(
      {
        pathname: location.pathname,
        search: nextSearch ? `?${nextSearch}` : "",
      },
      { replace: true },
    );
  }, [location.pathname, location.search, navigate]);

  const closeDetail = () => {
    setDetailId(null);
    setDetail(null);
    setNotesDraft("");
  };

  const saveNotes = async () => {
    if (!detailId) return;

    setNotesLoading(true);
    try {
      const response = await updateReviewNotes(detailId, notesDraft);
      setDetail((prev) => prev ? { ...prev, adminNotes: response.adminNotes } : prev);
      setReviews((prev) => prev.map((row) => row.id === detailId ? { ...row, adminNotes: response.adminNotes } : row));
      toast.success("Notes admin mises a jour.");
    } catch {
      toast.error("Impossible de sauvegarder les notes admin.");
    } finally {
      setNotesLoading(false);
    }
  };

  const toggleSelected = (reviewId: number) => {
    setSelectedIds((prev) => prev.includes(reviewId)
      ? prev.filter((id) => id !== reviewId)
      : [...prev, reviewId]);
  };

  const allSelected = reviews.length > 0 && reviews.every((row) => selectedIds.includes(row.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !reviews.some((row) => row.id === id)));
      return;
    }

    setSelectedIds((prev) => {
      const merged = new Set(prev);
      reviews.forEach((row) => merged.add(row.id));
      return Array.from(merged);
    });
  };

  const applyBulkStatus = async (status: ReviewStatus) => {
    if (selectedIds.length === 0) return;

    setBulkLoading(true);
    try {
      const response = await bulkUpdateReviewStatus(selectedIds, status);
      toast.success(`${response.updatedCount} avis mis a jour.`);
      setSelectedIds([]);
      await refreshReviews(page);

      if (detail && selectedIds.includes(detail.id)) {
        const reviewDetail = await getReview(detail.id);
        setDetail(reviewDetail);
        setNotesDraft(reviewDetail.adminNotes || "");
      }
    } catch {
      toast.error("Impossible d'appliquer l'action en lot.");
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <div className="space-y-5" style={{ fontFamily: "'Sora', sans-serif" }}>
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total avis", value: stats.total, icon: MessageCircle, color: "#FF6B35" },
          { label: "Note moyenne", value: stats.averageRating.toFixed(1) + "/5", icon: Star, color: "#F59E0B" },
          { label: "En attente", value: stats.pendingCount, icon: Eye, color: "#3B82F6" },
          { label: "Signales", value: stats.flaggedCount, icon: Flag, color: "#EF4444" },
        ].map((k) => (
          <div key={k.label} className="bg-white dark:bg-[#1E1E24] rounded-xl border border-[#E5E7EB] dark:border-white/10 p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: k.color + "15" }}>
              <k.icon className="w-4 h-4" style={{ color: k.color }} />
            </div>
            <div><p className="text-[11px] text-[#9CA3AF]">{k.label}</p><p className="text-[17px] text-[#1A2332] dark:text-white" style={{ fontWeight: 700 }}>{k.value}</p></div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-[#1E1E24] rounded-xl border border-[#E5E7EB] dark:border-white/10 p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <label className="inline-flex items-center gap-2 text-[12px] text-[#6B7280]">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleSelectAll}
              className="w-4 h-4 accent-[#FF6B35]"
            />
            Tout selectionner
          </label>

          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un avis..." className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#F9FAFB] dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10 text-[13px] outline-none text-[#1A2332] dark:text-white placeholder:text-[#9CA3AF] focus:border-[#FF6B35]" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-lg bg-[#F9FAFB] dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10 text-[13px] text-[#1A2332] dark:text-white outline-none">
            <option value="all">Tous les statuts</option>
            {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)} className="px-3 py-2 rounded-lg bg-[#F9FAFB] dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10 text-[13px] text-[#1A2332] dark:text-white outline-none">
            <option value="all">Toutes les notes</option>
            {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} étoile{n > 1 ? "s" : ""}</option>)}
          </select>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="bg-white dark:bg-[#1E1E24] rounded-xl border border-[#E5E7EB] dark:border-white/10 p-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[12px] text-[#6B7280]">
            <span style={{ fontWeight: 700 }}>{selectedIds.length}</span> avis selectionne(s)
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => void applyBulkStatus("approved")}
              disabled={bulkLoading}
              className="px-3 py-1.5 rounded-lg bg-[#10B981]/10 text-[#10B981] text-[11px] disabled:opacity-60"
              style={{ fontWeight: 600 }}
            >
              Approuver
            </button>
            <button
              onClick={() => void applyBulkStatus("rejected")}
              disabled={bulkLoading}
              className="px-3 py-1.5 rounded-lg bg-[#EF4444]/10 text-[#EF4444] text-[11px] disabled:opacity-60"
              style={{ fontWeight: 600 }}
            >
              Rejeter
            </button>
            <button
              onClick={() => void applyBulkStatus("flagged")}
              disabled={bulkLoading}
              className="px-3 py-1.5 rounded-lg bg-[#8B5CF6]/10 text-[#8B5CF6] text-[11px] disabled:opacity-60"
              style={{ fontWeight: 600 }}
            >
              Signaler
            </button>
            <button
              onClick={() => void applyBulkStatus("pending")}
              disabled={bulkLoading}
              className="px-3 py-1.5 rounded-lg bg-[#F59E0B]/10 text-[#F59E0B] text-[11px] disabled:opacity-60"
              style={{ fontWeight: 600 }}
            >
              Mettre en attente
            </button>
          </div>
        </div>
      )}

      {/* Reviews list */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-[#9CA3AF] text-[13px]">Chargement des avis...</div>
        ) : reviews.map((r) => {
          const st = STATUS_CFG[r.status];
          return (
            <div key={r.id} className="bg-white dark:bg-[#1E1E24] rounded-xl border border-[#E5E7EB] dark:border-white/10 p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(r.id)}
                    onChange={() => toggleSelected(r.id)}
                    className="w-4 h-4 mt-1 accent-[#FF6B35]"
                  />
                  <div className="w-9 h-9 rounded-full bg-[#FF6B35]/15 flex items-center justify-center text-[12px] text-[#FF6B35]" style={{ fontWeight: 600 }}>
                    {r.client.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <p className="text-[13px] text-[#1A2332] dark:text-white" style={{ fontWeight: 500 }}>{r.client}</p>
                    <p className="text-[11px] text-[#9CA3AF]">{r.product} • {r.date ? new Date(r.date).toLocaleDateString("fr-DZ", { day: "2-digit", month: "short" }) : "-"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Stars rating={r.rating} />
                  <span className="inline-flex px-2 py-0.5 rounded-full text-[10px]" style={{ fontWeight: 500, backgroundColor: st.color + "15", color: st.color }}>{st.label}</span>
                </div>
              </div>
              <h4 className="text-[14px] text-[#1A2332] dark:text-white mb-1" style={{ fontWeight: 600 }}>{r.title || "Avis client"}</h4>
              <p className="text-[13px] text-[#6B7280] dark:text-white/60 mb-3">{r.comment || "-"}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-[11px] text-[#9CA3AF]">
                  <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> {r.helpful} utile(s)</span>
                  {r.reported > 0 && <span className="flex items-center gap-1 text-[#EF4444]"><Flag className="w-3 h-3" /> {r.reported} signalement(s)</span>}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => void openDetail(r.id)}
                    className="px-3 py-1.5 rounded-lg bg-[#0EA5E9]/10 text-[#0EA5E9] text-[11px] hover:bg-[#0EA5E9]/20"
                    style={{ fontWeight: 500 }}
                  >
                    Detail
                  </button>

                  {r.status === "pending" && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(r.id, "approved")}
                        disabled={actionLoadingId === r.id}
                        className="px-3 py-1.5 rounded-lg bg-[#10B981]/10 text-[#10B981] text-[11px] hover:bg-[#10B981]/20 disabled:opacity-60"
                        style={{ fontWeight: 500 }}
                      >
                        Approuver
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(r.id, "rejected")}
                        disabled={actionLoadingId === r.id}
                        className="px-3 py-1.5 rounded-lg bg-[#EF4444]/10 text-[#EF4444] text-[11px] hover:bg-[#EF4444]/20 disabled:opacity-60"
                        style={{ fontWeight: 500 }}
                      >
                        Rejeter
                      </button>
                    </>
                  )}
                  {r.status === "flagged" && (
                    <button
                      onClick={() => handleUpdateStatus(r.id, "pending")}
                      disabled={actionLoadingId === r.id}
                      className="px-3 py-1.5 rounded-lg bg-[#F59E0B]/10 text-[#F59E0B] text-[11px] hover:bg-[#F59E0B]/20 disabled:opacity-60"
                      style={{ fontWeight: 500 }}
                    >
                      Examiner
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {!loading && reviews.length === 0 && <div className="text-center py-12 text-[#9CA3AF] text-[13px]">Aucun avis trouve</div>}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 bg-white dark:bg-[#1E1E24] rounded-xl border border-[#E5E7EB] dark:border-white/10 p-3">
          <p className="text-[12px] text-[#9CA3AF]">
            {totalCount === 0 ? "0" : `${(page - 1) * PAGE_SIZE + 1}-${Math.min(page * PAGE_SIZE, totalCount)}`} sur {totalCount}
          </p>
          <div className="flex items-center gap-1">
            <button
              disabled={page === 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="w-8 h-8 rounded-lg border border-[#E5E7EB] dark:border-white/10 flex items-center justify-center text-[#9CA3AF] disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {pages.map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-[12px] flex items-center justify-center ${
                  page === p ? "bg-[#FF6B35] text-white" : "text-[#9CA3AF] hover:bg-[#F3F4F6] dark:hover:bg-white/10"
                }`}
                style={{ fontWeight: page === p ? 600 : 400 }}
              >
                {p}
              </button>
            ))}

            <button
              disabled={page === totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              className="w-8 h-8 rounded-lg border border-[#E5E7EB] dark:border-white/10 flex items-center justify-center text-[#9CA3AF] disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {detailId && (
        <div className="fixed inset-0 bg-black/50 z-[120] flex items-start justify-center pt-8 px-4" onClick={closeDetail}>
          <div
            className="w-full max-w-3xl max-h-[88vh] overflow-y-auto bg-white dark:bg-[#1E1E24] rounded-2xl border border-[#E5E7EB] dark:border-white/10"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB] dark:border-white/10">
              <div>
                <p className="text-[11px] text-[#9CA3AF]">Moderation avis</p>
                <h3 className="text-[16px] text-[#1A2332] dark:text-white" style={{ fontWeight: 700 }}>
                  Avis #{detailId}
                </h3>
              </div>
              <button
                onClick={closeDetail}
                className="w-8 h-8 rounded-lg bg-[#F3F4F6] dark:bg-white/10 flex items-center justify-center text-[#6B7280] hover:text-[#1A2332]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {detailLoading || !detail ? (
                <div className="text-center py-10 text-[13px] text-[#9CA3AF]">Chargement du detail...</div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-[#E5E7EB] dark:border-white/10 p-4 bg-[#F9FAFB] dark:bg-white/5">
                      <p className="text-[11px] text-[#9CA3AF] mb-2">Client</p>
                      <p className="text-[14px] text-[#1A2332] dark:text-white" style={{ fontWeight: 700 }}>{detail.client}</p>
                      <p className="text-[12px] text-[#6B7280] dark:text-white/60 mt-1">{detail.clientEmail || "-"}</p>
                    </div>

                    <div className="rounded-xl border border-[#E5E7EB] dark:border-white/10 p-4 bg-[#F9FAFB] dark:bg-white/5">
                      <p className="text-[11px] text-[#9CA3AF] mb-2">Produit</p>
                      <p className="text-[14px] text-[#1A2332] dark:text-white" style={{ fontWeight: 700 }}>{detail.product}</p>
                      <p className="text-[12px] text-[#6B7280] dark:text-white/60 mt-1">ID: {detail.productId}</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#E5E7EB] dark:border-white/10 p-4">
                    <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Stars rating={detail.rating} />
                        <span
                          className="inline-flex px-2 py-0.5 rounded-full text-[10px]"
                          style={{
                            fontWeight: 600,
                            backgroundColor: STATUS_CFG[detail.status].color + "15",
                            color: STATUS_CFG[detail.status].color,
                          }}
                        >
                          {STATUS_CFG[detail.status].label}
                        </span>
                        {detail.isVerified && (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] bg-[#10B981]/10 text-[#10B981]" style={{ fontWeight: 600 }}>
                            Achat verifie
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-[#9CA3AF]">
                        Cree: {detail.date ? new Date(detail.date).toLocaleString("fr-DZ") : "-"}
                      </div>
                    </div>

                    <p className="text-[14px] text-[#1A2332] dark:text-white" style={{ fontWeight: 700 }}>
                      {detail.title || "Avis client"}
                    </p>
                    <p className="text-[13px] text-[#6B7280] dark:text-white/60 mt-2">
                      {detail.comment || "-"}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-[#9CA3AF]">
                      <span className="inline-flex items-center gap-1"><ThumbsUp className="w-3.5 h-3.5" /> {detail.helpful} utile(s)</span>
                      <span className="inline-flex items-center gap-1"><Flag className="w-3.5 h-3.5" /> {detail.reported} signalement(s)</span>
                      <span className="inline-flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> MAJ: {detail.updatedAt ? new Date(detail.updatedAt).toLocaleString("fr-DZ") : "-"}</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#E5E7EB] dark:border-white/10 p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[13px] text-[#1A2332] dark:text-white" style={{ fontWeight: 700 }}>
                        Notes administrateur
                      </p>
                      <button
                        onClick={() => void saveNotes()}
                        disabled={notesLoading}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FF6B35] text-white text-[11px] disabled:opacity-60"
                        style={{ fontWeight: 600 }}
                      >
                        <Save className="w-3.5 h-3.5" /> Sauvegarder
                      </button>
                    </div>

                    <textarea
                      value={notesDraft}
                      onChange={(event) => setNotesDraft(event.target.value)}
                      rows={4}
                      placeholder="Ajouter une note de moderation..."
                      className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] dark:border-white/10 bg-[#F9FAFB] dark:bg-white/5 text-[13px] text-[#1A2332] dark:text-white outline-none"
                    />

                    <div className="text-[11px] text-[#9CA3AF]">
                      Modere par: {detail.moderatedBy?.name || "-"} {detail.moderatedAt ? `(${new Date(detail.moderatedAt).toLocaleString("fr-DZ")})` : ""}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => void handleUpdateStatus(detail.id, "approved")}
                      disabled={actionLoadingId === detail.id}
                      className="px-3 py-1.5 rounded-lg bg-[#10B981]/10 text-[#10B981] text-[11px] disabled:opacity-60"
                      style={{ fontWeight: 600 }}
                    >
                      Approuver
                    </button>
                    <button
                      onClick={() => void handleUpdateStatus(detail.id, "pending")}
                      disabled={actionLoadingId === detail.id}
                      className="px-3 py-1.5 rounded-lg bg-[#F59E0B]/10 text-[#F59E0B] text-[11px] disabled:opacity-60"
                      style={{ fontWeight: 600 }}
                    >
                      Mettre en attente
                    </button>
                    <button
                      onClick={() => void handleUpdateStatus(detail.id, "flagged")}
                      disabled={actionLoadingId === detail.id}
                      className="px-3 py-1.5 rounded-lg bg-[#8B5CF6]/10 text-[#8B5CF6] text-[11px] disabled:opacity-60"
                      style={{ fontWeight: 600 }}
                    >
                      Signaler
                    </button>
                    <button
                      onClick={() => void handleUpdateStatus(detail.id, "rejected")}
                      disabled={actionLoadingId === detail.id}
                      className="px-3 py-1.5 rounded-lg bg-[#EF4444]/10 text-[#EF4444] text-[11px] disabled:opacity-60"
                      style={{ fontWeight: 600 }}
                    >
                      Rejeter
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
