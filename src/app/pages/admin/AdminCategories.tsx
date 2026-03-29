import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Search, Plus, Edit3, Trash2, Grid3X3, ChevronRight, Eye, Package, ToggleRight, ToggleLeft, X, AlertTriangle } from "lucide-react";
import {
  AdminCategory,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus
} from "../../api/adminCategories";

// ─── Category Form Modal ───
function CategoryFormModal({
  category,
  categories,
  onClose,
  onSave,
}: {
  category: AdminCategory | null;
  categories: AdminCategory[];
  onClose: () => void;
  onSave: (data: Partial<AdminCategory>, id?: number) => Promise<void>;
}) {
  const isEdit = !!category;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const parents = categories.filter((c) => !c.parent_id && c.id !== category?.id);

  const [form, setForm] = useState({
    name: category?.name || "",
    slug: category?.slug || "",
    parent_id: category?.parent_id ? String(category.parent_id) : "",
    description: category?.description || "",
  });

  const handleSubmit = async () => {
    if (!form.name) {
      toast.error("Le nom de la catégorie est obligatoire");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(
        {
          name: form.name,
          slug: form.slug || undefined,
          parent_id: form.parent_id ? Number(form.parent_id) : null,
          description: form.description || null,
        },
        category?.id
      );
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de la sauvegarde.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-start justify-center pt-8 overflow-y-auto" onClick={onClose}>
      <div className="bg-white dark:bg-[#1E1E24] rounded-2xl w-full max-w-lg shadow-2xl m-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-[#E5E7EB] dark:border-white/10">
          <h2 className="text-[17px] text-[#1A2332] dark:text-white" style={{ fontWeight: 600 }}>
            {isEdit ? "Modifier la catégorie" : "Nouvelle catégorie"}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-[#F3F4F6] dark:bg-white/10 flex items-center justify-center text-[#6B7280]">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-[12px] text-[#6B7280] mb-1.5" style={{ fontWeight: 500 }}>Nom *</label>
            <input 
              value={form.name} 
              onChange={(e) => setForm({ ...form, name: e.target.value })} 
              className="w-full px-3 py-2.5 rounded-lg bg-[#F9FAFB] dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10 text-[13px] outline-none focus:border-[#FF6B35] text-[#1A2332] dark:text-white" 
              placeholder="Ex: Robots cuiseurs" 
            />
          </div>
          <div>
            <label className="block text-[12px] text-[#6B7280] mb-1.5" style={{ fontWeight: 500 }}>Slug (URL)</label>
            <input 
              value={form.slug} 
              onChange={(e) => setForm({ ...form, slug: e.target.value })} 
              className="w-full px-3 py-2.5 rounded-lg bg-[#F9FAFB] dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10 text-[13px] outline-none focus:border-[#FF6B35] text-[#1A2332] dark:text-white" 
              placeholder="robots-cuiseurs" 
            />
            <p className="text-[11px] text-[#9CA3AF] mt-1">Laissez vide pour auto-générer à partir du nom.</p>
          </div>
          <div>
            <label className="block text-[12px] text-[#6B7280] mb-1.5" style={{ fontWeight: 500 }}>Catégorie parente</label>
            <select 
              value={form.parent_id} 
              onChange={(e) => setForm({ ...form, parent_id: e.target.value })} 
              className="w-full px-3 py-2.5 rounded-lg bg-[#F9FAFB] dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10 text-[13px] outline-none focus:border-[#FF6B35] text-[#1A2332] dark:text-white"
            >
              <option value="">Aucune (catégorie principale)</option>
              {parents.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[12px] text-[#6B7280] mb-1.5" style={{ fontWeight: 500 }}>Description</label>
            <textarea 
              value={form.description} 
              onChange={(e) => setForm({ ...form, description: e.target.value })} 
              rows={3} 
              className="w-full px-3 py-2.5 rounded-lg bg-[#F9FAFB] dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10 text-[13px] outline-none focus:border-[#FF6B35] resize-none text-[#1A2332] dark:text-white" 
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 p-6 border-t border-[#E5E7EB] dark:border-white/10">
          <button 
            disabled={isSubmitting} 
            onClick={onClose} 
            className="px-4 py-2.5 rounded-lg border border-[#E5E7EB] dark:border-white/10 text-[13px] text-[#6B7280] dark:text-white/70 disabled:opacity-50"
          >
            Annuler
          </button>
          <button 
            disabled={isSubmitting} 
            onClick={handleSubmit} 
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#FF6B35] text-white text-[13px] hover:bg-[#E55A2B] disabled:opacity-50" 
            style={{ fontWeight: 600 }}
          >
            {isSubmitting && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {isEdit ? "Mettre à jour" : "Créer"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ───
function DeleteModal({ category, onClose, onConfirm }: { category: AdminCategory; onClose: () => void; onConfirm: () => Promise<void> }) {
  const [isDeleting, setIsDeleting] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="bg-white dark:bg-[#1E1E24] rounded-2xl w-full max-w-sm p-6 m-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="w-12 h-12 rounded-full bg-[#EF4444]/10 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6 text-[#EF4444]" />
        </div>
        <h3 className="text-[15px] text-[#1A2332] dark:text-white text-center mb-2" style={{ fontWeight: 600 }}>Supprimer cette catégorie ?</h3>
        <p className="text-[13px] text-[#6B7280] dark:text-white/50 text-center mb-6">
          « {category.name} » sera définitivement supprimée. 
          {category.products_count && category.products_count > 0 ? (
            <span className="block mt-2 font-bold text-[#EF4444]">Attention : Elle contient des produits !</span>
          ) : null}
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} disabled={isDeleting} className="flex-1 py-2.5 rounded-lg text-[13px] border border-[#E5E7EB] dark:border-white/10 text-[#6B7280] hover:bg-[#F3F4F6] transition-colors disabled:opacity-50" style={{ fontWeight: 500 }}>Annuler</button>
          <button 
            onClick={async () => { setIsDeleting(true); await onConfirm(); setIsDeleting(false); }} 
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
export function AdminCategories() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [formModal, setFormModal] = useState<{ open: boolean; category: AdminCategory | null }>({ open: false, category: null });
  const [deleteModal, setDeleteModal] = useState<AdminCategory | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (e: any) {
      toast.error(e.message || "Erreur de chargement des catégories.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (data: Partial<AdminCategory>, id?: number) => {
    try {
      if (id) {
        await updateCategory(id, data);
        toast.success("Catégorie mise à jour");
      } else {
        await createCategory(data);
        toast.success("Catégorie créée");
      }
      setFormModal({ open: false, category: null });
      loadData();
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de l'enregistrement.");
      throw e;
    }
  };

  const handleToggle = async (cat: AdminCategory) => {
    try {
      await toggleCategoryStatus(cat.id);
      loadData(); // Re-fetch to ensure sync, or optimistic update
    } catch (e: any) {
      toast.error(e.message || "Erreur lors du changement de statut");
    }
  };

  const handleDelete = async () => {
    if (deleteModal) {
      try {
        await deleteCategory(deleteModal.id);
        toast.success("Catégorie supprimée");
        setDeleteModal(null);
        loadData();
      } catch (e: any) {
        toast.error(e.message || "Erreur lors de la suppression.");
      }
    }
  };

  const parents = categories.filter((c) => !c.parent_id);
  const filtered = search ? categories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())) : categories;
  const rootCats = filtered.filter((c) => !c.parent_id);
  const getChildren = (parentId: number) => filtered.filter((c) => c.parent_id === parentId);

  const totalProductsCount = categories.reduce((sum, c) => sum + (c.products_count || 0), 0);
  const activesCount = categories.filter((c) => c.is_enabled).length;

  if (isLoading && categories.length === 0) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#E8400C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5" style={{ fontFamily: "'Sora', sans-serif" }}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Catégories (Parents)", value: parents.length, icon: Grid3X3, color: "#FF6B35" },
          { label: "Sous-catégories", value: categories.filter((c) => c.parent_id).length, icon: ChevronRight, color: "#3B82F6" },
          { label: "Total produits", value: totalProductsCount, icon: Package, color: "#10B981" },
          { label: "Actives", value: activesCount, icon: Eye, color: "#8B5CF6" },
        ].map((k) => (
          <div key={k.label} className="bg-white dark:bg-[#1E1E24] rounded-xl border border-[#E5E7EB] dark:border-white/10 p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: k.color + "15" }}><k.icon className="w-4 h-4" style={{ color: k.color }} /></div>
            <div><p className="text-[11px] text-[#9CA3AF]">{k.label}</p><p className="text-[17px] text-[#1A2332] dark:text-white" style={{ fontWeight: 700 }}>{k.value}</p></div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher une catégorie..." className="w-full pl-9 pr-4 py-2 rounded-lg bg-white dark:bg-[#1E1E24] border border-[#E5E7EB] dark:border-white/10 text-[13px] outline-none text-[#1A2332] dark:text-white placeholder:text-[#9CA3AF] focus:border-[#FF6B35] transition-colors" />
        </div>
        <button onClick={() => setFormModal({ open: true, category: null })} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#FF6B35] text-white text-[13px] hover:bg-[#E55A2B] transition-colors" style={{ fontWeight: 600 }}>
          <Plus className="w-4 h-4" /> Nouvelle catégorie
        </button>
      </div>

      <div className="space-y-3">
        {rootCats.length === 0 ? (
          <div className="text-center py-10 bg-white dark:bg-[#1E1E24] rounded-xl border border-[#E5E7EB] dark:border-white/10 text-[#9CA3AF] text-[13px]">
            Aucune catégorie trouvée.
          </div>
        ) : (
          rootCats.map((cat) => {
            const children = getChildren(cat.id);
            return (
              <div key={cat.id} className="bg-white dark:bg-[#1E1E24] rounded-xl border border-[#E5E7EB] dark:border-white/10 overflow-hidden">
                <div className="group flex items-center justify-between p-4 hover:bg-[#F9FAFB] dark:hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-[24px]">{cat.icon || "📁"}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-[14px] text-[#1A2332] dark:text-white" style={{ fontWeight: 600 }}>{cat.name}</p>
                        <span className="px-2 py-0.5 rounded-full bg-[#FF6B35]/10 text-[#FF6B35] text-[10px]" style={{ fontWeight: 600 }}>{cat.products_count || 0} produits</span>
                      </div>
                      <p className="text-[12px] text-[#9CA3AF]">{cat.description || "Aucune description"}</p>
                      <p className="text-[11px] text-[#6B7280] mt-0.5">/{cat.slug}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleToggle(cat)} className="hover:opacity-80 transition-opacity">
                      {cat.is_enabled ? <ToggleRight className="w-7 h-5 text-[#10B981]" /> : <ToggleLeft className="w-7 h-5 text-[#9CA3AF]" />}
                    </button>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setFormModal({ open: true, category: cat })} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9CA3AF] hover:bg-[#FF6B35]/10 hover:text-[#FF6B35] transition-colors">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteModal(cat)} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9CA3AF] hover:bg-[#EF4444]/10 hover:text-[#EF4444] transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
                {children.length > 0 && (
                  <div className="border-t border-[#E5E7EB] dark:border-white/10 bg-[#F9FAFB] dark:bg-white/5">
                    {children.map((ch) => (
                      <div key={ch.id} className="group flex items-center justify-between px-4 py-3 pl-14 border-b last:border-b-0 border-[#E5E7EB]/50 dark:border-white/5 hover:bg-[#F9FAFB] dark:hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-2">
                          <ChevronRight className="w-3 h-3 text-[#9CA3AF]" />
                          <span className="text-[13px] text-[#1A2332] dark:text-white" style={{ fontWeight: 500 }}>{ch.name}</span>
                          <span className="text-[11px] text-[#9CA3AF]">{ch.products_count || 0} produits</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleToggle(ch)} className="hover:opacity-80 transition-opacity">
                            {ch.is_enabled ? <ToggleRight className="w-5 h-4 text-[#10B981]" /> : <ToggleLeft className="w-5 h-4 text-[#9CA3AF]" />}
                          </button>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setFormModal({ open: true, category: ch })} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#9CA3AF] hover:bg-[#FF6B35]/10 hover:text-[#FF6B35] transition-colors">
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setDeleteModal(ch)} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#9CA3AF] hover:bg-[#EF4444]/10 hover:text-[#EF4444] transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {formModal.open && <CategoryFormModal category={formModal.category} categories={categories} onClose={() => setFormModal({ open: false, category: null })} onSave={handleSave} />}
      {deleteModal && <DeleteModal category={deleteModal} onClose={() => setDeleteModal(null)} onConfirm={handleDelete} />}
    </div>
  );
}
