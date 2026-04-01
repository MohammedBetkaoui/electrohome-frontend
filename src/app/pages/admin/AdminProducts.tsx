import { useState, useMemo, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  Plus, Search, Filter, MoreVertical, Edit2, Trash2, Eye, X,
  ChevronLeft, ChevronRight, Upload, Package, AlertTriangle, CheckCircle2,
  ArrowUpDown, Grid3X3, List, Image as ImageIcon
} from "lucide-react";
import { useNavigate } from "react-router";
import {
  AdminProduct,
  BrandRef,
  CategoryRef,
  getProducts,
  getReferences,
  deleteProduct
} from "../../api/adminProducts";

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: "Actif", color: "#10B981", bg: "#10B981" },
  draft: { label: "Brouillon", color: "#F59E0B", bg: "#F59E0B" },
  outofstock: { label: "Rupture", color: "#EF4444", bg: "#EF4444" },
};

function formatPrice(price: number) {
  return price.toLocaleString("fr-DZ") + " DA";
}

// ─── Product Form Modal ───
// ─── Delete Confirm Modal ───
function DeleteModal({ product, onClose, onConfirm }: { product: AdminProduct; onClose: () => void; onConfirm: () => Promise<boolean | void> }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="bg-white dark:bg-[#1E1E24] rounded-2xl w-full max-w-sm p-6 m-4 shadow-2xl" style={{ fontFamily: "'Sora', sans-serif" }} onClick={(e) => e.stopPropagation()}>
        <div className="w-12 h-12 rounded-full bg-[#EF4444]/10 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6 text-[#EF4444]" />
        </div>
        <h3 className="text-[15px] text-[#1A2332] dark:text-white text-center mb-2" style={{ fontWeight: 600 }}>
          Supprimer ce produit ?
        </h3>
        <p className="text-[13px] text-[#6B7280] dark:text-white/50 text-center mb-6">
          « {product.name} » sera retiré du catalogue, mais restera conservé dans l'historique de vos factures clients.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} disabled={isDeleting} className="flex-1 py-2.5 rounded-lg text-[13px] border border-[#E5E7EB] dark:border-white/10 text-[#6B7280] hover:bg-[#F3F4F6] transition-colors disabled:opacity-50" style={{ fontWeight: 500 }}>Annuler</button>
          <button 
            onClick={handleConfirm} 
            disabled={isDeleting}
            className="flex items-center justify-center gap-2 flex-1 py-2.5 rounded-lg bg-[#EF4444] text-white text-[13px] hover:bg-[#DC2626] transition-colors disabled:opacity-50" 
            style={{ fontWeight: 500 }}
          >
            {isDeleting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Supprimer"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───
export function AdminProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [brands, setBrands] = useState<BrandRef[]>([]);
  const [categories, setCategories] = useState<CategoryRef[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState<"name" | "price" | "stock" | "createdAt">("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [page, setPage] = useState(1);
  const [deleteModal, setDeleteModal] = useState<AdminProduct | null>(null);
  const [actionMenu, setActionMenu] = useState<number | null>(null);
  const perPage = 8;

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [prods, refs] = await Promise.all([getProducts(), getReferences()]);
      setProducts(prods);
      setBrands(refs.brands);
      setCategories(refs.categories);
    } catch (e: any) {
      toast.error(e.message || "Impossible de charger les données.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => {
    let list = [...products];
    if (search) list = list.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(search.toLowerCase())) || (p.brand && p.brand.toLowerCase().includes(search.toLowerCase())));
    if (categoryFilter !== "all") list = list.filter((p) => p.category_id.toString() === categoryFilter);
    if (statusFilter !== "all") list = list.filter((p) => p.status === statusFilter);
    list.sort((a, b) => {
      const m = sortDir === "asc" ? 1 : -1;
      if (sortField === "name") return a.name.localeCompare(b.name) * m;
      if (sortField === "price") return (a.price - b.price) * m;
      if (sortField === "stock") return (a.stock - b.stock) * m;
      return (a.createdAt || "").localeCompare(b.createdAt || "") * m;
    });
    return list;
  }, [products, search, categoryFilter, statusFilter, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / perPage) || 1;
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const handleSaveProduct = async (data: FormData, id?: number) => {
    try {
      if (id) {
        await updateProduct(id, data);
        toast.success("Produit mis à jour avec succès");
      } else {
        await createProduct(data);
        toast.success("Produit ajouté avec succès");
      }
      
      loadData(); // Recharger les produits depuis l'API
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de la sauvegarde du produit.");
      throw e; // Important for Modal to keep spinner or stop it
    }
  };

  const handleDeleteProduct = async () => {
    if (deleteModal) {
      try {
        await deleteProduct(deleteModal.id);
        toast.success("Produit supprimé");
        setDeleteModal(null);
        loadData();
      } catch (e: any) {
        toast.error(e.message || "Erreur lors de la suppression.");
      }
    }
  };

  const activeCount = products.filter((p) => p.status === "active").length;
  const draftCount = products.filter((p) => p.status === "draft").length;
  const oosCount = products.filter((p) => p.status === "outofstock").length;

  if (isLoading && products.length === 0) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#E8400C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5" style={{ fontFamily: "'Sora', sans-serif" }}>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total produits", value: products.length, icon: Package, color: "#3B82F6" },
          { label: "Actifs", value: activeCount, icon: CheckCircle2, color: "#10B981" },
          { label: "Brouillons", value: draftCount, icon: Edit2, color: "#F59E0B" },
          { label: "Rupture de stock", value: oosCount, icon: AlertTriangle, color: "#EF4444" },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-[#1E1E24] rounded-xl p-4 border border-[#E5E7EB] dark:border-white/10 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: s.color + "15" }}>
              <s.icon className="w-4 h-4" style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-[11px] text-[#9CA3AF]">{s.label}</p>
              <p className="text-[18px] text-[#1A2332] dark:text-white" style={{ fontWeight: 700 }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white dark:bg-[#1E1E24] rounded-xl border border-[#E5E7EB] dark:border-white/10 p-4">
        <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
          <div className="flex flex-wrap gap-2 items-center flex-1">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
              <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Rechercher un produit..." className="pl-9 pr-4 py-2 rounded-lg bg-[#F9FAFB] dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10 text-[13px] w-64 outline-none text-[#1A2332] dark:text-white placeholder:text-[#9CA3AF] focus:border-[#FF6B35] transition-colors" />
            </div>
            {/* Category Filter */}
            <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }} className="px-3 py-2 rounded-lg bg-[#F9FAFB] dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10 text-[13px] text-[#1A2332] dark:text-white outline-none focus:border-[#FF6B35] transition-colors">
              <option value="all">Toutes les catégories</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {/* Status Filter */}
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="px-3 py-2 rounded-lg bg-[#F9FAFB] dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10 text-[13px] text-[#1A2332] dark:text-white outline-none focus:border-[#FF6B35] transition-colors">
              <option value="all">Tous les statuts</option>
              <option value="active">Actif</option>
              <option value="draft">Brouillon</option>
              <option value="outofstock">Rupture</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex rounded-lg border border-[#E5E7EB] dark:border-white/10 overflow-hidden">
              <button onClick={() => setViewMode("table")} className={`p-2 ${viewMode === "table" ? "bg-[#FF6B35] text-white" : "text-[#9CA3AF] hover:text-[#6B7280]"}`}>
                <List className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode("grid")} className={`p-2 ${viewMode === "grid" ? "bg-[#FF6B35] text-white" : "text-[#9CA3AF] hover:text-[#6B7280]"}`}>
                <Grid3X3 className="w-4 h-4" />
              </button>
            </div>
            {/* Add Product */}
            <button onClick={() => navigate("/admin/produits/nouveau")} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FF6B35] text-white text-[13px] hover:bg-[#E55A2B] transition-colors" style={{ fontWeight: 500 }}>
              <Plus className="w-4 h-4" />
              Ajouter
            </button>
          </div>
        </div>

        {/* Results count */}
        <p className="text-[12px] text-[#9CA3AF] mt-3">{filtered.length} produit{filtered.length > 1 ? "s" : ""} trouvé{filtered.length > 1 ? "s" : ""}</p>
      </div>

      {/* Table View */}
      {viewMode === "table" ? (
        <div className="bg-white dark:bg-[#1E1E24] rounded-xl border border-[#E5E7EB] dark:border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[#E5E7EB] dark:border-white/10 bg-[#F9FAFB] dark:bg-white/5">
                  <th className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-[#9CA3AF]" style={{ fontWeight: 500 }}>Produit</th>
                  <th className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-[#9CA3AF] cursor-pointer select-none" style={{ fontWeight: 500 }} onClick={() => toggleSort("price")}>
                    <span className="inline-flex items-center gap-1">Prix <ArrowUpDown className="w-3 h-3" /></span>
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-[#9CA3AF] cursor-pointer select-none" style={{ fontWeight: 500 }} onClick={() => toggleSort("stock")}>
                    <span className="inline-flex items-center gap-1">Stock <ArrowUpDown className="w-3 h-3" /></span>
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-[#9CA3AF]" style={{ fontWeight: 500 }}>Catégorie</th>
                  <th className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-[#9CA3AF]" style={{ fontWeight: 500 }}>Statut</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {paginated.map((p) => {
                  const st = STATUS_MAP[p.status];
                  return (
                    <tr key={p.id} className="group border-b border-[#E5E7EB]/50 dark:border-white/5 hover:bg-[#F9FAFB] dark:hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#F3F4F6] dark:bg-white/10 overflow-hidden shrink-0">
                            {p.image ? (
                              <img src={p.image} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#9CA3AF]">
                                <ImageIcon className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-[#1A2332] dark:text-white truncate max-w-[220px]" style={{ fontWeight: 500 }}>{p.name}</p>
                            <p className="text-[11px] text-[#9CA3AF]">{p.brand || "-"} · {p.sku || "-"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-[#1A2332] dark:text-white" style={{ fontWeight: 600 }}>{formatPrice(p.price)}</p>
                        {p.oldPrice && <p className="text-[11px] text-[#9CA3AF] line-through">{formatPrice(p.oldPrice)}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[13px] ${p.stock === 0 ? "text-[#EF4444]" : p.stock < 10 ? "text-[#F59E0B]" : "text-[#1A2332] dark:text-white"}`} style={{ fontWeight: 500 }}>
                          {p.stock}
                        </span>
                        {p.stock > 0 && p.stock < 10 && <span className="text-[10px] text-[#F59E0B] ml-1">Faible</span>}
                      </td>
                      <td className="px-4 py-3 text-[#6B7280] dark:text-white/60">{p.category || "-"}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11px]" style={{ fontWeight: 500, backgroundColor: st.bg + "15", color: st.color }}>
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => navigate(`/admin/produits/modifier/${p.id}`)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9CA3AF] hover:bg-[#FF6B35]/10 hover:text-[#FF6B35] transition-colors"
                            title="Modifier"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteModal(p)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9CA3AF] hover:bg-[#EF4444]/10 hover:text-[#EF4444] transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#E5E7EB] dark:border-white/10">
              <p className="text-[12px] text-[#9CA3AF]">Page {page} sur {totalPages}</p>
              <div className="flex gap-1">
                <button disabled={page === 1} onClick={() => setPage(page - 1)} className="w-8 h-8 rounded-lg border border-[#E5E7EB] dark:border-white/10 flex items-center justify-center text-[#9CA3AF] hover:text-[#6B7280] disabled:opacity-30">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button key={i} onClick={() => setPage(i + 1)} className={`w-8 h-8 rounded-lg text-[12px] flex items-center justify-center ${page === i + 1 ? "bg-[#FF6B35] text-white" : "text-[#9CA3AF] hover:bg-[#F3F4F6] dark:hover:bg-white/10"}`} style={{ fontWeight: page === i + 1 ? 600 : 400 }}>
                    {i + 1}
                  </button>
                ))}
                <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="w-8 h-8 rounded-lg border border-[#E5E7EB] dark:border-white/10 flex items-center justify-center text-[#9CA3AF] hover:text-[#6B7280] disabled:opacity-30">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginated.map((p) => {
            const st = STATUS_MAP[p.status];
            return (
              <div key={p.id} className="bg-white dark:bg-[#1E1E24] rounded-xl border border-[#E5E7EB] dark:border-white/10 overflow-hidden group">
                <div className="relative h-40 bg-[#F3F4F6] dark:bg-white/5">
                  {p.image ? (
                    <img src={p.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#9CA3AF]">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                  )}
                  <span className="absolute top-2 left-2 inline-flex px-2 py-0.5 rounded-full text-[10px]" style={{ fontWeight: 500, backgroundColor: st.bg + "20", color: st.color, backdropFilter: "blur(8px)" }}>
                    {st.label}
                  </span>
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => navigate(`/admin/produits/modifier/${p.id}`)} className="w-7 h-7 rounded-lg bg-white/90 dark:bg-black/50 flex items-center justify-center text-[#6B7280] hover:text-[#FF6B35]">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteModal(p)} className="w-7 h-7 rounded-lg bg-white/90 dark:bg-black/50 flex items-center justify-center text-[#6B7280] hover:text-[#EF4444]">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-[12px] text-[#9CA3AF]">{p.brand || "-"} · {p.sku || "-"}</p>
                  <p className="text-[13px] text-[#1A2332] dark:text-white mt-0.5 truncate" style={{ fontWeight: 500 }}>{p.name}</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-[14px] text-[#FF6B35]" style={{ fontWeight: 700 }}>{formatPrice(p.price)}</p>
                    <p className={`text-[12px] ${p.stock === 0 ? "text-[#EF4444]" : "text-[#9CA3AF]"}`}>Stock: {p.stock}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination for grid */}
      {viewMode === "grid" && totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 mt-4">
          <button disabled={page === 1} onClick={() => setPage(page - 1)} className="w-8 h-8 rounded-lg border border-[#E5E7EB] dark:border-white/10 flex items-center justify-center text-[#9CA3AF] disabled:opacity-30">
            <ChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} onClick={() => setPage(i + 1)} className={`w-8 h-8 rounded-lg text-[12px] ${page === i + 1 ? "bg-[#FF6B35] text-white" : "text-[#9CA3AF] hover:bg-[#F3F4F6] dark:hover:bg-white/10"}`} style={{ fontWeight: page === i + 1 ? 600 : 400 }}>
              {i + 1}
            </button>
          ))}
          <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="w-8 h-8 rounded-lg border border-[#E5E7EB] dark:border-white/10 flex items-center justify-center text-[#9CA3AF] disabled:opacity-30">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Modals */}
      {deleteModal && <DeleteModal product={deleteModal} onClose={() => setDeleteModal(null)} onConfirm={handleDeleteProduct} />}
    </div>
  );
}
