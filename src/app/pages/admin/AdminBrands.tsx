import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Edit3,
  Grid3X3,
  Image as ImageIcon,
  Link2,
  Package,
  Plus,
  Search,
  Sparkles,
  Tags,
  Trash2,
  X,
} from "lucide-react";
import {
  AdminBrand,
  createBrand,
  deleteBrand,
  getBrands,
  updateBrand,
} from "../../api/adminBrands";

function getBrandInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function BrandFormModal({
  brand,
  onClose,
  onSave,
}: {
  brand: AdminBrand | null;
  onClose: () => void;
  onSave: (data: Partial<AdminBrand>, id?: number) => Promise<void>;
}) {
  const isEdit = !!brand;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: brand?.name || "",
    slug: brand?.slug || "",
    logo_url: brand?.logo_url || "",
  });

  const previewLabel = form.name.trim() || "Nouvelle marque";
  const canPreviewImage = form.logo_url.trim().length > 0;

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("Le nom de la marque est obligatoire.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(
        {
          name: form.name.trim(),
          slug: form.slug.trim() || undefined,
          logo_url: form.logo_url.trim() || null,
        },
        brand?.id
      );
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la sauvegarde.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/55 px-4 py-8" onClick={onClose}>
      <div
        className="w-full max-w-3xl overflow-hidden rounded-[28px] border border-white/10 bg-white shadow-[0_40px_100px_rgba(15,23,42,0.25)] dark:bg-[#1E1E24]"
        onClick={(event) => event.stopPropagation()}
        style={{ fontFamily: "'Sora', sans-serif" }}
      >
        <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative overflow-hidden border-b border-[#E5E7EB] bg-[radial-gradient(circle_at_top_left,rgba(255,107,53,0.16),transparent_45%),linear-gradient(160deg,#111827_0%,#1F2937_55%,#0F172A_100%)] px-6 py-7 text-white lg:border-b-0 lg:border-r lg:border-r-white/10">
            <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-[#FF6B35]/20 blur-3xl" />
            <div className="absolute bottom-0 left-12 h-24 w-24 rounded-full bg-[#F8C15C]/15 blur-2xl" />
            <div className="relative space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-white/75">
                <Sparkles className="h-3.5 w-3.5" />
                Brand Studio
              </div>
              <div>
                <h2 className="text-[24px] leading-tight" style={{ fontWeight: 700 }}>
                  {isEdit ? "Mettre a jour une marque" : "Ajouter une nouvelle marque"}
                </h2>
                <p className="mt-2 max-w-md text-[13px] text-white/72">
                  Gere le nom, le slug et le visuel de tes partenaires pour garder un catalogue propre et credible.
                </p>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/8 p-5 backdrop-blur">
                <div className="flex items-center gap-4">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[22px] border border-white/12 bg-white/10">
                    {canPreviewImage ? (
                      <img src={form.logo_url} alt={previewLabel} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-[20px] tracking-[0.14em]" style={{ fontWeight: 700 }}>
                        {getBrandInitials(previewLabel) || "BR"}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[18px]" style={{ fontWeight: 600 }}>
                      {previewLabel}
                    </p>
                    <p className="mt-1 truncate text-[12px] uppercase tracking-[0.18em] text-white/58">
                      /{form.slug.trim() || "slug-auto"}
                    </p>
                    <p className="mt-3 text-[12px] text-white/70">
                      {canPreviewImage ? "Logo URL detecte" : "Aucun logo pour le moment"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between border-b border-[#E5E7EB] px-6 py-5 dark:border-white/10">
              <div>
                <p className="text-[16px] text-[#1A2332] dark:text-white" style={{ fontWeight: 600 }}>
                  {isEdit ? "Edition" : "Creation"}
                </p>
                <p className="text-[12px] text-[#9CA3AF]">Les champs essentiels suffisent pour commencer.</p>
              </div>
              <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F3F4F6] text-[#6B7280] dark:bg-white/10 dark:text-white/70">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 px-6 py-6">
              <div>
                <label className="mb-1.5 block text-[12px] text-[#6B7280]" style={{ fontWeight: 500 }}>
                  Nom *
                </label>
                <input
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  className="w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-[13px] text-[#1A2332] outline-none transition-colors focus:border-[#FF6B35] dark:border-white/10 dark:bg-white/5 dark:text-white"
                  placeholder="Ex: Siemens"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[12px] text-[#6B7280]" style={{ fontWeight: 500 }}>
                  Slug
                </label>
                <input
                  value={form.slug}
                  onChange={(event) => setForm({ ...form, slug: event.target.value })}
                  className="w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-[13px] text-[#1A2332] outline-none transition-colors focus:border-[#FF6B35] dark:border-white/10 dark:bg-white/5 dark:text-white"
                  placeholder="siemens"
                />
                <p className="mt-1 text-[11px] text-[#9CA3AF]">Laisse vide pour le generer automatiquement a partir du nom.</p>
              </div>

              <div>
                <label className="mb-1.5 block text-[12px] text-[#6B7280]" style={{ fontWeight: 500 }}>
                  Logo URL
                </label>
                <input
                  value={form.logo_url}
                  onChange={(event) => setForm({ ...form, logo_url: event.target.value })}
                  className="w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-[13px] text-[#1A2332] outline-none transition-colors focus:border-[#FF6B35] dark:border-white/10 dark:bg-white/5 dark:text-white"
                  placeholder="https://cdn.example.com/brands/siemens.png"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-[#E5E7EB] px-6 py-5 dark:border-white/10">
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-xl border border-[#E5E7EB] px-4 py-2.5 text-[13px] text-[#6B7280] transition-colors hover:bg-[#F8FAFC] disabled:opacity-50 dark:border-white/10 dark:text-white/70 dark:hover:bg-white/5"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-xl bg-[#FF6B35] px-5 py-2.5 text-[13px] text-white transition-colors hover:bg-[#E55A2B] disabled:opacity-50"
                style={{ fontWeight: 600 }}
              >
                {isSubmitting && <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
                {isEdit ? "Enregistrer" : "Creer la marque"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeleteModal({
  brand,
  onClose,
  onConfirm,
}: {
  brand: AdminBrand;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const hasProducts = (brand.products_count || 0) > 0;

  const handleConfirm = async () => {
    if (hasProducts) {
      toast.error("Cette marque ne peut pas etre supprimee tant que des produits y sont lies.");
      return;
    }

    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-[28px] border border-[#E5E7EB] bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.22)] dark:border-white/10 dark:bg-[#1E1E24]"
        onClick={(event) => event.stopPropagation()}
        style={{ fontFamily: "'Sora', sans-serif" }}
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#EF4444]/10">
          <AlertTriangle className="h-6 w-6 text-[#EF4444]" />
        </div>
        <h3 className="text-center text-[16px] text-[#1A2332] dark:text-white" style={{ fontWeight: 600 }}>
          Supprimer cette marque ?
        </h3>
        <p className="mt-2 text-center text-[13px] text-[#6B7280] dark:text-white/60">
          {hasProducts
            ? `Impossible de supprimer ${brand.name} car ${brand.products_count} produit(s) y sont encore relies.`
            : `La marque ${brand.name} sera retiree definitivement du referentiel.`}
        </p>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 rounded-xl border border-[#E5E7EB] px-4 py-2.5 text-[13px] text-[#6B7280] disabled:opacity-50 dark:border-white/10 dark:text-white/70"
          >
            Fermer
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDeleting || hasProducts}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#EF4444] px-4 py-2.5 text-[13px] text-white disabled:cursor-not-allowed disabled:opacity-50"
            style={{ fontWeight: 600 }}
          >
            {isDeleting && <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminBrands() {
  const [brands, setBrands] = useState<AdminBrand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [formModal, setFormModal] = useState<{ open: boolean; brand: AdminBrand | null }>({
    open: false,
    brand: null,
  });
  const [deleteModal, setDeleteModal] = useState<AdminBrand | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getBrands();
      setBrands(data);
    } catch (error: any) {
      toast.error(error.message || "Impossible de charger les marques.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (data: Partial<AdminBrand>, id?: number) => {
    try {
      if (id) {
        await updateBrand(id, data);
        toast.success("Marque mise a jour.");
      } else {
        await createBrand(data);
        toast.success("Marque creee.");
      }

      setFormModal({ open: false, brand: null });
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'enregistrement.");
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) {
      return;
    }

    try {
      await deleteBrand(deleteModal.id);
      toast.success("Marque supprimee.");
      setDeleteModal(null);
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la suppression.");
    }
  };

  const filteredBrands = useMemo(() => {
    const term = search.trim().toLowerCase();

    return [...brands]
      .filter((brand) => {
        if (!term) {
          return true;
        }

        return brand.name.toLowerCase().includes(term) || brand.slug.toLowerCase().includes(term);
      })
      .sort((a, b) => {
        const countDiff = (b.products_count || 0) - (a.products_count || 0);
        if (countDiff !== 0) {
          return countDiff;
        }

        return a.name.localeCompare(b.name);
      });
  }, [brands, search]);

  const totalBrands = brands.length;
  const withLogoCount = brands.filter((brand) => Boolean(brand.logo_url)).length;
  const linkedBrandsCount = brands.filter((brand) => (brand.products_count || 0) > 0).length;
  const totalAssignedProducts = brands.reduce((sum, brand) => sum + (brand.products_count || 0), 0);
  const spotlightBrand = filteredBrands[0] || null;

  if (isLoading && brands.length === 0) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E8400C] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6" style={{ fontFamily: "'Sora', sans-serif" }}>
      <section className="relative overflow-hidden rounded-[30px] border border-[#E5E7EB] bg-[radial-gradient(circle_at_top_left,rgba(255,107,53,0.24),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(248,193,92,0.14),transparent_28%),linear-gradient(135deg,#F8FAFC_0%,#FFFFFF_42%,#FFF6F1_100%)] p-6 shadow-[0_25px_65px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_left,rgba(255,107,53,0.18),transparent_32%),linear-gradient(135deg,#131720_0%,#1A2332_48%,#231815_100%)]">
        <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-[#FF6B35]/10 blur-3xl" />
        <div className="absolute bottom-0 left-12 h-28 w-28 rounded-full bg-[#F59E0B]/10 blur-2xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#FED7AA] bg-white/70 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-[#C2410C] shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-[#F8C15C]">
              <Sparkles className="h-3.5 w-3.5" />
              Dashboard brands
            </div>
            <h1 className="mt-4 text-[30px] leading-tight text-[#111827] dark:text-white" style={{ fontWeight: 700 }}>
              Gere tes marques avec une vue plus elegante, plus claire, plus pro.
            </h1>
            <p className="mt-3 max-w-xl text-[14px] leading-6 text-[#6B7280] dark:text-white/68">
              Centralise les partenaires du catalogue, garde des slugs propres et donne une identite visuelle consistente a la boutique.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-white/60 bg-white/75 px-4 py-3 shadow-sm dark:border-white/10 dark:bg-white/5">
              <p className="text-[11px] uppercase tracking-[0.22em] text-[#9CA3AF]">Catalogue</p>
              <p className="mt-1 text-[20px] text-[#111827] dark:text-white" style={{ fontWeight: 700 }}>
                {totalAssignedProducts} produits relies
              </p>
            </div>
            <button
              onClick={() => setFormModal({ open: true, brand: null })}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#FF6B35] px-5 py-3 text-[13px] text-white shadow-[0_18px_35px_rgba(255,107,53,0.25)] transition-transform hover:-translate-y-0.5 hover:bg-[#E55A2B]"
              style={{ fontWeight: 600 }}
            >
              <Plus className="h-4 w-4" />
              Ajouter une marque
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: "Marques", value: totalBrands, icon: Tags, color: "#FF6B35" },
          { label: "Avec logo", value: withLogoCount, icon: ImageIcon, color: "#3B82F6" },
          { label: "Liees a des produits", value: linkedBrandsCount, icon: Package, color: "#10B981" },
          { label: "Cartes visibles", value: filteredBrands.length, icon: Grid3X3, color: "#8B5CF6" },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-[#E5E7EB] bg-white p-4 dark:border-white/10 dark:bg-[#1E1E24]">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: `${item.color}18` }}>
                <item.icon className="h-5 w-5" style={{ color: item.color }} />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#9CA3AF]">{item.label}</p>
                <p className="mt-1 text-[21px] text-[#111827] dark:text-white" style={{ fontWeight: 700 }}>
                  {item.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[26px] border border-[#E5E7EB] bg-white p-5 dark:border-white/10 dark:bg-[#1E1E24]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[18px] text-[#111827] dark:text-white" style={{ fontWeight: 600 }}>
                Repertoire des marques
              </p>
              <p className="mt-1 text-[12px] text-[#9CA3AF]">Recherche rapide par nom ou slug, edition directe et suppression securisee.</p>
            </div>
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher une marque..."
                className="w-full rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] py-3 pl-10 pr-4 text-[13px] text-[#1A2332] outline-none transition-colors focus:border-[#FF6B35] dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {filteredBrands.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-dashed border-[#D1D5DB] px-6 py-12 text-center text-[13px] text-[#9CA3AF] dark:border-white/10">
                Aucune marque ne correspond a cette recherche.
              </div>
            ) : (
              filteredBrands.map((brand) => {
                const hasProducts = (brand.products_count || 0) > 0;

                return (
                  <div
                    key={brand.id}
                    className="group overflow-hidden rounded-[24px] border border-[#E5E7EB] bg-[linear-gradient(180deg,#FFFFFF_0%,#FCFCFD_100%)] p-4 transition-all hover:-translate-y-0.5 hover:border-[#FFD2C2] hover:shadow-[0_18px_38px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.02)_100%)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[20px] border border-[#E5E7EB] bg-[#FFF7ED] text-[#C2410C] dark:border-white/10 dark:bg-white/5 dark:text-[#F8C15C]">
                          {brand.logo_url ? (
                            <img src={brand.logo_url} alt={brand.name} className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-[18px] tracking-[0.14em]" style={{ fontWeight: 700 }}>
                              {getBrandInitials(brand.name)}
                            </span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-[16px] text-[#111827] dark:text-white" style={{ fontWeight: 600 }}>
                            {brand.name}
                          </p>
                          <p className="mt-1 truncate text-[11px] uppercase tracking-[0.18em] text-[#9CA3AF]">/{brand.slug}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                        <button
                          onClick={() => setFormModal({ open: true, brand })}
                          className="flex h-9 w-9 items-center justify-center rounded-xl text-[#9CA3AF] transition-colors hover:bg-[#FF6B35]/10 hover:text-[#FF6B35]"
                          title="Modifier"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteModal(brand)}
                          className="flex h-9 w-9 items-center justify-center rounded-xl text-[#9CA3AF] transition-colors hover:bg-[#EF4444]/10 hover:text-[#EF4444] disabled:cursor-not-allowed disabled:opacity-40"
                          title={hasProducts ? "Suppression bloquee si des produits sont relies" : "Supprimer"}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="inline-flex items-center rounded-full bg-[#FFF1EB] px-3 py-1 text-[11px] text-[#C2410C] dark:bg-[#FF6B35]/12 dark:text-[#FFB59A]">
                        {brand.products_count || 0} produit{brand.products_count === 1 ? "" : "s"}
                      </span>
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] ${brand.logo_url ? "bg-[#E8F7EF] text-[#0F9F63] dark:bg-[#10B981]/10 dark:text-[#7CE5B6]" : "bg-[#EEF2FF] text-[#4F46E5] dark:bg-[#4F46E5]/10 dark:text-[#B4B5FF]"}`}>
                        {brand.logo_url ? "Logo configure" : "Visuel a completer"}
                      </span>
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#F1F5F9] pt-4 dark:border-white/10">
                      <div className="min-w-0">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-[#9CA3AF]">Reference</p>
                        <p className="truncate text-[13px] text-[#1A2332] dark:text-white">
                          {brand.logo_url || "Aucune URL logo"}
                        </p>
                      </div>
                      {brand.logo_url ? (
                        <button
                          onClick={() => window.open(brand.logo_url || "", "_blank", "noopener,noreferrer")}
                          className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-[#E5E7EB] px-3 py-2 text-[12px] text-[#6B7280] transition-colors hover:border-[#FF6B35] hover:text-[#FF6B35] dark:border-white/10 dark:text-white/70"
                        >
                          <Link2 className="h-3.5 w-3.5" />
                          Voir logo
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="overflow-hidden rounded-[26px] border border-[#E5E7EB] bg-white dark:border-white/10 dark:bg-[#1E1E24]">
            <div className="border-b border-[#E5E7EB] px-5 py-4 dark:border-white/10">
              <p className="text-[16px] text-[#111827] dark:text-white" style={{ fontWeight: 600 }}>
                Focus marque
              </p>
              <p className="mt-1 text-[12px] text-[#9CA3AF]">La marque la plus visible dans les resultats en cours.</p>
            </div>

            {spotlightBrand ? (
              <div className="p-5">
                <div className="rounded-[24px] bg-[radial-gradient(circle_at_top_left,rgba(255,107,53,0.18),transparent_38%),linear-gradient(160deg,#111827_0%,#1F2937_55%,#0F172A_100%)] p-5 text-white">
                  <div className="flex items-center gap-4">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[22px] border border-white/10 bg-white/10">
                      {spotlightBrand.logo_url ? (
                        <img src={spotlightBrand.logo_url} alt={spotlightBrand.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-[22px] tracking-[0.16em]" style={{ fontWeight: 700 }}>
                          {getBrandInitials(spotlightBrand.name)}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[22px]" style={{ fontWeight: 700 }}>
                        {spotlightBrand.name}
                      </p>
                      <p className="mt-1 truncate text-[12px] uppercase tracking-[0.18em] text-white/55">/{spotlightBrand.slug}</p>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/6 p-3">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-white/48">Produits</p>
                      <p className="mt-1 text-[20px]" style={{ fontWeight: 700 }}>
                        {spotlightBrand.products_count || 0}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/6 p-3">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-white/48">Visuel</p>
                      <p className="mt-1 text-[14px]" style={{ fontWeight: 600 }}>
                        {spotlightBrand.logo_url ? "Pret" : "A completer"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="px-5 py-10 text-center text-[13px] text-[#9CA3AF]">Aucune marque disponible.</div>
            )}
          </div>

          <div className="rounded-[26px] border border-[#E5E7EB] bg-white p-5 dark:border-white/10 dark:bg-[#1E1E24]">
            <p className="text-[16px] text-[#111827] dark:text-white" style={{ fontWeight: 600 }}>
              Conseils rapides
            </p>
            <div className="mt-4 space-y-3 text-[13px] text-[#6B7280] dark:text-white/65">
              <div className="rounded-2xl bg-[#F8FAFC] px-4 py-3 dark:bg-white/5">
                Utilise un slug court et stable pour faciliter les futurs filtres catalogue.
              </div>
              <div className="rounded-2xl bg-[#F8FAFC] px-4 py-3 dark:bg-white/5">
                Ajoute un logo pour donner plus de credibilite a la page publique des marques.
              </div>
              <div className="rounded-2xl bg-[#F8FAFC] px-4 py-3 dark:bg-white/5">
                La suppression reste bloquee tant que des produits pointent encore vers la marque.
              </div>
            </div>
          </div>
        </div>
      </div>

      {formModal.open ? (
        <BrandFormModal
          brand={formModal.brand}
          onClose={() => setFormModal({ open: false, brand: null })}
          onSave={handleSave}
        />
      ) : null}

      {deleteModal ? (
        <DeleteModal
          brand={deleteModal}
          onClose={() => setDeleteModal(null)}
          onConfirm={handleDelete}
        />
      ) : null}
    </div>
  );
}
