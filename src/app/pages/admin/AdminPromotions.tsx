import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  Edit3,
  Eye,
  Flame,
  Package,
  Plus,
  RefreshCw,
  Search,
  Tag,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import {
  getAdminPromotionsPayload,
  removeAdminPromotion,
  saveAdminPromotion,
} from "../../api/adminPromotions";
import type { AdminProduct, ReferencesData } from "../../api/adminProducts";
import { formatPrice } from "../../data/store";
import {
  getPromotionDiscountPercent,
  getPromotionSavings,
  getPromotionStockSavings,
  hasActivePromotion,
} from "../../lib/promotions";

type PromotionEditorMode = "create" | "edit";
type VisibilityFilter = "all" | "visible" | "hidden";

type PromotionFormState = {
  price: string;
  oldPrice: string;
  status: AdminProduct["status"];
};

const STATUS_META: Record<AdminProduct["status"], { label: string; color: string; bg: string }> = {
  active: { label: "Actif", color: "#10B981", bg: "#10B981" },
  draft: { label: "Brouillon", color: "#F59E0B", bg: "#F59E0B" },
  outofstock: { label: "Rupture", color: "#EF4444", bg: "#EF4444" },
};

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function isVisibleInStore(product: AdminProduct): boolean {
  return hasActivePromotion(product) && product.status === "active" && product.stock > 0;
}

function getInitialPromotionForm(product: AdminProduct): PromotionFormState {
  if (hasActivePromotion(product) && product.oldPrice) {
    return {
      price: String(product.price),
      oldPrice: String(product.oldPrice),
      status: product.status,
    };
  }

  const basePrice = Math.max(1, Math.round(product.price));
  const suggestedPrice = basePrice > 1 ? Math.max(1, Math.floor(basePrice * 0.9)) : 1;

  return {
    price: String(suggestedPrice),
    oldPrice: String(basePrice > suggestedPrice ? basePrice : suggestedPrice + 1),
    status: product.status === "draft" ? "draft" : "active",
  };
}

function PromotionsLoadingState() {
  return (
    <div className="space-y-5" style={{ fontFamily: "'Sora', sans-serif" }}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-24 rounded-xl border border-[#E5E7EB] dark:border-white/10 bg-white dark:bg-[#1E1E24] animate-pulse"
          />
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.7fr)_360px] gap-5">
        <div className="space-y-4">
          <div className="h-36 rounded-2xl border border-[#E5E7EB] dark:border-white/10 bg-white dark:bg-[#1E1E24] animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-72 rounded-2xl border border-[#E5E7EB] dark:border-white/10 bg-white dark:bg-[#1E1E24] animate-pulse"
              />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-44 rounded-2xl border border-[#E5E7EB] dark:border-white/10 bg-white dark:bg-[#1E1E24] animate-pulse" />
          <div className="h-72 rounded-2xl border border-[#E5E7EB] dark:border-white/10 bg-white dark:bg-[#1E1E24] animate-pulse" />
        </div>
      </div>
    </div>
  );
}

function PromotionEditorModal({
  mode,
  products,
  initialProduct,
  isSubmitting,
  onClose,
  onSubmit,
}: {
  mode: PromotionEditorMode;
  products: AdminProduct[];
  initialProduct: AdminProduct | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (
    product: AdminProduct,
    values: { price: number; oldPrice: number; status: AdminProduct["status"] },
  ) => Promise<void>;
}) {
  const selectableProducts = mode === "create"
    ? products.filter((product) => !hasActivePromotion(product))
    : products;
  const defaultProduct = initialProduct ?? selectableProducts[0] ?? null;
  const [selectedProductId, setSelectedProductId] = useState(defaultProduct ? String(defaultProduct.id) : "");
  const [form, setForm] = useState<PromotionFormState>(
    defaultProduct
      ? getInitialPromotionForm(defaultProduct)
      : { price: "", oldPrice: "", status: "active" },
  );

  const selectedProduct = useMemo(
    () => products.find((product) => String(product.id) === selectedProductId) ?? null,
    [products, selectedProductId],
  );

  const priceValue = Number(form.price);
  const oldPriceValue = Number(form.oldPrice);
  const hasPreview = Number.isFinite(priceValue)
    && priceValue > 0
    && Number.isFinite(oldPriceValue)
    && oldPriceValue > priceValue;
  const previewDiscount = hasPreview ? Math.round((1 - priceValue / oldPriceValue) * 100) : 0;
  const previewSavings = hasPreview ? Math.max(0, oldPriceValue - priceValue) : 0;

  const handleProductChange = (value: string) => {
    setSelectedProductId(value);

    const nextProduct = products.find((product) => String(product.id) === value);
    if (!nextProduct) {
      return;
    }

    setForm(getInitialPromotionForm(nextProduct));
  };

  const handleSave = async () => {
    if (!selectedProduct) {
      toast.error("Selectionnez un produit a promouvoir.");
      return;
    }

    const price = Number(form.price);
    const oldPrice = Number(form.oldPrice);

    if (!Number.isFinite(price) || price <= 0) {
      toast.error("Le prix promotionnel doit etre superieur a 0.");
      return;
    }

    if (!Number.isFinite(oldPrice) || oldPrice <= price) {
      toast.error("L'ancien prix doit etre superieur au prix promotionnel.");
      return;
    }

    await onSubmit(selectedProduct, {
      price,
      oldPrice,
      status: form.status,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/55 z-[100] flex items-start justify-center pt-8 overflow-y-auto" onClick={onClose}>
      <div
        className="bg-white dark:bg-[#1E1E24] rounded-2xl w-full max-w-2xl shadow-2xl m-4"
        style={{ fontFamily: "'Sora', sans-serif" }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-[#E5E7EB] dark:border-white/10">
          <div>
            <h2 className="text-[18px] text-[#1A2332] dark:text-white" style={{ fontWeight: 700 }}>
              {mode === "create" ? "Nouvelle promotion" : "Modifier la promotion"}
            </h2>
            <p className="text-[12px] text-[#6B7280] dark:text-white/55 mt-1">
              Une promotion devient visible en boutique quand `oldPrice` est superieur a `price` et que le produit est actif.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="w-9 h-9 rounded-xl bg-[#F3F4F6] dark:bg-white/10 flex items-center justify-center text-[#6B7280] hover:text-[#111827] disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {mode === "create" && (
            <div>
              <label className="block text-[12px] text-[#6B7280] dark:text-white/55 mb-1.5" style={{ fontWeight: 600 }}>
                Produit
              </label>
              <select
                value={selectedProductId}
                onChange={(event) => handleProductChange(event.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#F9FAFB] dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10 text-[13px] text-[#1A2332] dark:text-white outline-none focus:border-[#FF6B35] transition-colors"
              >
                {selectableProducts.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} {product.brand ? `- ${product.brand}` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedProduct ? (
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] gap-5">
              <div className="space-y-4">
                <div className="rounded-2xl border border-[#E5E7EB] dark:border-white/10 p-4 bg-[#F9FAFB] dark:bg-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-[#E5E7EB] dark:bg-white/10 overflow-hidden shrink-0">
                      {selectedProduct.image ? (
                        <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" />
                      ) : null}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12px] text-[#6B7280] dark:text-white/55">
                        {selectedProduct.brand || "Produit"} {selectedProduct.category ? `· ${selectedProduct.category}` : ""}
                      </p>
                      <h3 className="text-[15px] text-[#1A2332] dark:text-white truncate" style={{ fontWeight: 700 }}>
                        {selectedProduct.name}
                      </h3>
                      <p className="text-[12px] text-[#9CA3AF]">
                        Prix catalogue actuel: {formatPrice(selectedProduct.price)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] text-[#6B7280] dark:text-white/55 mb-1.5" style={{ fontWeight: 600 }}>
                      Prix promotionnel
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={form.price}
                      onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
                      className="w-full px-4 py-3 rounded-xl bg-[#F9FAFB] dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10 text-[13px] text-[#1A2332] dark:text-white outline-none focus:border-[#FF6B35] transition-colors"
                      placeholder="Ex: 189000"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] text-[#6B7280] dark:text-white/55 mb-1.5" style={{ fontWeight: 600 }}>
                      Ancien prix barre
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={form.oldPrice}
                      onChange={(event) => setForm((current) => ({ ...current, oldPrice: event.target.value }))}
                      className="w-full px-4 py-3 rounded-xl bg-[#F9FAFB] dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10 text-[13px] text-[#1A2332] dark:text-white outline-none focus:border-[#FF6B35] transition-colors"
                      placeholder="Ex: 232000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] text-[#6B7280] dark:text-white/55 mb-1.5" style={{ fontWeight: 600 }}>
                    Visibilite en boutique
                  </label>
                  <select
                    value={form.status}
                    onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as AdminProduct["status"] }))}
                    className="w-full px-4 py-3 rounded-xl bg-[#F9FAFB] dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10 text-[13px] text-[#1A2332] dark:text-white outline-none focus:border-[#FF6B35] transition-colors"
                  >
                    <option value="active">Actif - visible si stock disponible</option>
                    <option value="draft">Brouillon - cache cote boutique</option>
                    <option value="outofstock">Rupture - cache cote boutique</option>
                  </select>
                </div>
              </div>

              <div className="rounded-2xl border border-[#E5E7EB] dark:border-white/10 p-5 bg-[#111827] text-white space-y-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/55">Apercu</p>
                  <h3 className="text-[18px] mt-2" style={{ fontWeight: 700 }}>
                    {hasPreview ? `-${previewDiscount}%` : "Promo en preparation"}
                  </h3>
                </div>
                <div className="space-y-2">
                  <div className="flex items-end gap-2">
                    <span className="text-[24px] text-[#FFD60A]" style={{ fontWeight: 700 }}>
                      {form.price ? formatPrice(Number(form.price) || 0) : "--"}
                    </span>
                    {hasPreview && (
                      <span className="text-[13px] text-white/55 line-through">
                        {formatPrice(Number(form.oldPrice) || 0)}
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-white/70">
                    {hasPreview
                      ? `Economies de ${formatPrice(previewSavings)} par unite.`
                      : "Entrez un ancien prix superieur au prix promotionnel."}
                  </p>
                </div>
                <div className="rounded-xl bg-white/8 border border-white/10 p-3 text-[12px] space-y-2">
                  <div className="flex justify-between gap-3">
                    <span className="text-white/60">Statut produit</span>
                    <span style={{ fontWeight: 600 }}>{STATUS_META[form.status].label}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-white/60">Stock actuel</span>
                    <span style={{ fontWeight: 600 }}>{selectedProduct.stock}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-white/60">Boutique</span>
                    <span style={{ fontWeight: 600 }}>
                      {form.status === "active" && selectedProduct.stock > 0 && hasPreview ? "Visible" : "Masquee"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#D1D5DB] dark:border-white/10 p-6 text-center text-[13px] text-[#6B7280] dark:text-white/55">
              Aucun produit disponible pour une nouvelle promotion.
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-[#E5E7EB] dark:border-white/10">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl border border-[#E5E7EB] dark:border-white/10 text-[13px] text-[#6B7280] dark:text-white/65 hover:bg-[#F3F4F6] dark:hover:bg-white/5 disabled:opacity-50"
            style={{ fontWeight: 600 }}
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={isSubmitting || !selectedProduct}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF6B35] text-white text-[13px] hover:bg-[#E55A2B] disabled:opacity-50"
            style={{ fontWeight: 700 }}
          >
            {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Flame className="w-4 h-4" />}
            {mode === "create" ? "Activer la promotion" : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RemovePromotionModal({
  product,
  isSubmitting,
  onClose,
  onConfirm,
}: {
  product: AdminProduct;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  return (
    <div className="fixed inset-0 bg-black/55 z-[110] flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-[#1E1E24] rounded-2xl w-full max-w-md shadow-2xl"
        style={{ fontFamily: "'Sora', sans-serif" }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="p-6 space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#EF4444]/10 flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-[#EF4444]" />
          </div>
          <div>
            <h3 className="text-[17px] text-[#1A2332] dark:text-white" style={{ fontWeight: 700 }}>
              Retirer la promotion ?
            </h3>
            <p className="text-[13px] text-[#6B7280] dark:text-white/55 mt-2">
              Le badge promo disparaitra de la boutique pour <span style={{ fontWeight: 700 }}>{product.name}</span>.
              Le prix actuel sera conserve.
            </p>
          </div>
          <div className="rounded-xl bg-[#F9FAFB] dark:bg-white/5 p-4 text-[12px] space-y-2 border border-[#E5E7EB] dark:border-white/10">
            <div className="flex justify-between gap-3">
              <span className="text-[#6B7280] dark:text-white/55">Prix actuel</span>
              <span className="text-[#1A2332] dark:text-white" style={{ fontWeight: 600 }}>{formatPrice(product.price)}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-[#6B7280] dark:text-white/55">Ancien prix</span>
              <span className="text-[#1A2332] dark:text-white" style={{ fontWeight: 600 }}>
                {product.oldPrice ? formatPrice(product.oldPrice) : "--"}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-[#6B7280] dark:text-white/55">Reduction</span>
              <span className="text-[#EF4444]" style={{ fontWeight: 700 }}>
                -{getPromotionDiscountPercent(product)}%
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 p-6 pt-0">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl border border-[#E5E7EB] dark:border-white/10 text-[13px] text-[#6B7280] dark:text-white/65 hover:bg-[#F3F4F6] dark:hover:bg-white/5 disabled:opacity-50"
            style={{ fontWeight: 600 }}
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#EF4444] text-white text-[13px] hover:bg-[#DC2626] disabled:opacity-50"
            style={{ fontWeight: 700 }}
          >
            {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Retirer
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminPromotions() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [references, setReferences] = useState<ReferencesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>("all");
  const [editorState, setEditorState] = useState<{ mode: PromotionEditorMode; productId?: number } | null>(null);
  const [removeTarget, setRemoveTarget] = useState<AdminProduct | null>(null);

  const loadData = async ({ silent = false }: { silent?: boolean } = {}) => {
    if (silent) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const payload = await getAdminPromotionsPayload();
      setProducts(payload.products);
      setReferences(payload.references);
    } catch (error) {
      toast.error(getErrorMessage(error, "Impossible de charger les promotions."));
    } finally {
      if (silent) {
        setIsRefreshing(false);
      } else {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const promotionProducts = useMemo(
    () => products.filter((product) => hasActivePromotion(product)),
    [products],
  );

  const promotableProducts = useMemo(
    () => products
      .filter((product) => !hasActivePromotion(product))
      .sort((left, right) => (right.createdAt || "").localeCompare(left.createdAt || "")),
    [products],
  );

  const filteredPromotions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return [...promotionProducts]
      .filter((product) => {
        if (categoryFilter !== "all" && String(product.category_id) !== categoryFilter) {
          return false;
        }

        if (visibilityFilter === "visible" && !isVisibleInStore(product)) {
          return false;
        }

        if (visibilityFilter === "hidden" && isVisibleInStore(product)) {
          return false;
        }

        if (!normalizedSearch) {
          return true;
        }

        return [product.name, product.brand, product.category, product.sku]
          .some((value) => value?.toLowerCase().includes(normalizedSearch));
      })
      .sort((left, right) => {
        const discountGap = getPromotionDiscountPercent(right) - getPromotionDiscountPercent(left);
        if (discountGap !== 0) {
          return discountGap;
        }

        return (right.createdAt || "").localeCompare(left.createdAt || "");
      });
  }, [categoryFilter, promotionProducts, search, visibilityFilter]);

  const visiblePromotionsCount = useMemo(
    () => promotionProducts.filter((product) => isVisibleInStore(product)).length,
    [promotionProducts],
  );

  const averageDiscount = promotionProducts.length > 0
    ? Math.round(
        promotionProducts.reduce((total, product) => total + getPromotionDiscountPercent(product), 0) / promotionProducts.length,
      )
    : 0;
  const totalStockSavings = promotionProducts.reduce((total, product) => total + getPromotionStockSavings(product), 0);
  const editorProduct = editorState?.productId
    ? products.find((product) => product.id === editorState.productId) ?? null
    : null;

  const handleSavePromotion = async (
    product: AdminProduct,
    values: { price: number; oldPrice: number; status: AdminProduct["status"] },
  ) => {
    setIsMutating(true);

    try {
      await saveAdminPromotion(product, values);
      toast.success(`Promotion mise a jour pour ${product.name}.`);
      setEditorState(null);
      await loadData({ silent: true });
    } catch (error) {
      toast.error(getErrorMessage(error, "Impossible d'enregistrer cette promotion."));
    } finally {
      setIsMutating(false);
    }
  };

  const handleRemovePromotion = async () => {
    if (!removeTarget) {
      return;
    }

    setIsMutating(true);

    try {
      await removeAdminPromotion(removeTarget);
      toast.success(`Promotion retiree pour ${removeTarget.name}.`);
      setRemoveTarget(null);
      await loadData({ silent: true });
    } catch (error) {
      toast.error(getErrorMessage(error, "Impossible de retirer cette promotion."));
    } finally {
      setIsMutating(false);
    }
  };

  if (isLoading && products.length === 0) {
    return <PromotionsLoadingState />;
  }

  return (
    <div className="space-y-5" style={{ fontFamily: "'Sora', sans-serif" }}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Promos visibles", value: visiblePromotionsCount, icon: Flame, color: "#FF6B35" },
          { label: "Promos configurees", value: promotionProducts.length, icon: Tag, color: "#3B82F6" },
          { label: "Remise moyenne", value: `${averageDiscount}%`, icon: TrendingUp, color: "#10B981" },
          { label: "Economies en stock", value: formatPrice(totalStockSavings), icon: Package, color: "#8B5CF6" },
        ].map((item) => (
          <div key={item.label} className="bg-white dark:bg-[#1E1E24] rounded-xl border border-[#E5E7EB] dark:border-white/10 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${item.color}15` }}>
              <item.icon className="w-4 h-4" style={{ color: item.color }} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-[#9CA3AF]">{item.label}</p>
              <p className="text-[18px] text-[#1A2332] dark:text-white truncate" style={{ fontWeight: 700 }}>
                {item.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.7fr)_360px] gap-5">
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#1E1E24] rounded-2xl border border-[#E5E7EB] dark:border-white/10 p-4">
            <div className="flex flex-col xl:flex-row xl:items-center gap-3 xl:justify-between">
              <div className="flex flex-col sm:flex-row gap-3 flex-1">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Rechercher une promo par produit, marque ou SKU..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F9FAFB] dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10 text-[13px] text-[#1A2332] dark:text-white outline-none focus:border-[#FF6B35] transition-colors"
                  />
                </div>

                <select
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                  className="px-4 py-3 rounded-xl bg-[#F9FAFB] dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10 text-[13px] text-[#1A2332] dark:text-white outline-none focus:border-[#FF6B35] transition-colors"
                >
                  <option value="all">Toutes les categories</option>
                  {references?.categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>

                <select
                  value={visibilityFilter}
                  onChange={(event) => setVisibilityFilter(event.target.value as VisibilityFilter)}
                  className="px-4 py-3 rounded-xl bg-[#F9FAFB] dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10 text-[13px] text-[#1A2332] dark:text-white outline-none focus:border-[#FF6B35] transition-colors"
                >
                  <option value="all">Toutes les visibilites</option>
                  <option value="visible">Visibles en boutique</option>
                  <option value="hidden">Masquees en boutique</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => void loadData({ silent: true })}
                  disabled={isRefreshing || isMutating}
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-[#E5E7EB] dark:border-white/10 text-[13px] text-[#6B7280] dark:text-white/65 hover:bg-[#F9FAFB] dark:hover:bg-white/5 disabled:opacity-50"
                  style={{ fontWeight: 600 }}
                >
                  <RefreshCw className={`w-4 h-4 ${(isRefreshing || isMutating) ? "animate-spin" : ""}`} />
                  Actualiser
                </button>
                <button
                  onClick={() => setEditorState({ mode: "create" })}
                  disabled={promotableProducts.length === 0 || isMutating}
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-[#FF6B35] text-white text-[13px] hover:bg-[#E55A2B] disabled:opacity-50"
                  style={{ fontWeight: 700 }}
                >
                  <Plus className="w-4 h-4" />
                  Nouvelle promo
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-3 text-[12px] text-[#9CA3AF]">
              <span>{filteredPromotions.length} promotion{filteredPromotions.length > 1 ? "s" : ""} trouvee{filteredPromotions.length > 1 ? "s" : ""}</span>
              <span>•</span>
              <span>{promotableProducts.length} produit{promotableProducts.length > 1 ? "s" : ""} sans promo</span>
              <span>•</span>
              <span>Sync boutique immediate via `price` et `oldPrice`</span>
            </div>
          </div>

          {filteredPromotions.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredPromotions.map((product) => {
                const statusMeta = STATUS_META[product.status];
                const visibleInStore = isVisibleInStore(product);

                return (
                  <div
                    key={product.id}
                    className="bg-white dark:bg-[#1E1E24] rounded-2xl border border-[#E5E7EB] dark:border-white/10 overflow-hidden"
                  >
                    <div className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="w-24 h-24 rounded-2xl bg-[#F3F4F6] dark:bg-white/10 overflow-hidden shrink-0">
                          {product.image ? (
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                          ) : null}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap gap-2 mb-2">
                            <span
                              className="inline-flex px-2.5 py-1 rounded-full text-[11px]"
                              style={{ fontWeight: 600, backgroundColor: `${statusMeta.bg}15`, color: statusMeta.color }}
                            >
                              {statusMeta.label}
                            </span>
                            <span
                              className="inline-flex px-2.5 py-1 rounded-full text-[11px]"
                              style={{
                                fontWeight: 600,
                                backgroundColor: visibleInStore ? "rgba(16, 185, 129, 0.12)" : "rgba(245, 158, 11, 0.15)",
                                color: visibleInStore ? "#10B981" : "#F59E0B",
                              }}
                            >
                              {visibleInStore ? "Visible en boutique" : "Masquee cote boutique"}
                            </span>
                          </div>

                          <p className="text-[12px] text-[#6B7280] dark:text-white/55">
                            {product.brand || "Produit"} {product.category ? `· ${product.category}` : ""}
                          </p>
                          <h3 className="text-[15px] text-[#1A2332] dark:text-white truncate" style={{ fontWeight: 700 }}>
                            {product.name}
                          </h3>
                          <p className="text-[11px] text-[#9CA3AF] mt-1">{product.sku || "SKU non renseigne"}</p>

                          <div className="flex items-end gap-2 mt-4">
                            <span className="text-[22px] text-[#FF6B35]" style={{ fontWeight: 700 }}>
                              {formatPrice(product.price)}
                            </span>
                            {product.oldPrice && (
                              <span className="text-[13px] text-[#9CA3AF] line-through">
                                {formatPrice(product.oldPrice)}
                              </span>
                            )}
                            <span className="text-[12px] px-2 py-1 rounded-lg bg-[#111827] text-white" style={{ fontWeight: 700 }}>
                              -{getPromotionDiscountPercent(product)}%
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 mt-5">
                        {[
                          { label: "Economie", value: formatPrice(getPromotionSavings(product)) },
                          { label: "Stock", value: String(product.stock) },
                          { label: "Potentiel", value: formatPrice(getPromotionStockSavings(product)) },
                        ].map((item) => (
                          <div key={item.label} className="rounded-xl bg-[#F9FAFB] dark:bg-white/5 p-3 border border-[#E5E7EB]/70 dark:border-white/5">
                            <p className="text-[10px] uppercase tracking-wide text-[#9CA3AF]">{item.label}</p>
                            <p className="text-[13px] text-[#1A2332] dark:text-white mt-1 truncate" style={{ fontWeight: 700 }}>
                              {item.value}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="px-5 py-4 border-t border-[#E5E7EB] dark:border-white/10 flex flex-wrap items-center justify-between gap-3">
                      <div className="text-[11px] text-[#9CA3AF]">
                        {product.createdAt ? `Mise en catalogue: ${new Date(product.createdAt).toLocaleDateString("fr-DZ")}` : "Date indisponible"}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => window.open(`/produit/${product.slug}`, "_blank")}
                          className="w-9 h-9 rounded-xl border border-[#E5E7EB] dark:border-white/10 flex items-center justify-center text-[#6B7280] hover:text-[#3B82F6] hover:bg-[#3B82F6]/10 transition-colors"
                          title="Voir en boutique"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditorState({ mode: "edit", productId: product.id })}
                          className="w-9 h-9 rounded-xl border border-[#E5E7EB] dark:border-white/10 flex items-center justify-center text-[#6B7280] hover:text-[#FF6B35] hover:bg-[#FF6B35]/10 transition-colors"
                          title="Modifier"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setRemoveTarget(product)}
                          className="w-9 h-9 rounded-xl border border-[#E5E7EB] dark:border-white/10 flex items-center justify-center text-[#6B7280] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"
                          title="Retirer la promo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white dark:bg-[#1E1E24] rounded-2xl border border-dashed border-[#D1D5DB] dark:border-white/10 p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#FF6B35]/10 flex items-center justify-center mx-auto mb-4">
                <Tag className="w-6 h-6 text-[#FF6B35]" />
              </div>
              <h3 className="text-[18px] text-[#1A2332] dark:text-white" style={{ fontWeight: 700 }}>
                Aucune promotion ne correspond a vos filtres
              </h3>
              <p className="text-[13px] text-[#6B7280] dark:text-white/55 mt-2 max-w-xl mx-auto">
                Creez une promo depuis cette page, ou relancez l'affichage en retirant quelques filtres.
                Toute promotion enregistree ici apparait automatiquement cote boutique.
              </p>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="bg-white dark:bg-[#1E1E24] rounded-2xl border border-[#E5E7EB] dark:border-white/10 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-[#111827] text-white flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-[15px] text-[#1A2332] dark:text-white" style={{ fontWeight: 700 }}>
                  Synchronisation boutique
                </h3>
                <p className="text-[12px] text-[#6B7280] dark:text-white/55">
                  Cette page pilote directement la vitrine client.
                </p>
              </div>
            </div>

            <div className="space-y-3 text-[12px]">
              {[
                "Le produit apparait sur /promotions quand oldPrice > price.",
                "Le produit reste masque cote boutique si son statut est brouillon ou rupture.",
                "La recherche et les fiches produit recuperent automatiquement la remise publiee.",
              ].map((message) => (
                <div key={message} className="flex items-start gap-2 text-[#6B7280] dark:text-white/60">
                  <div className="w-5 h-5 rounded-full bg-[#FF6B35]/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Flame className="w-3 h-3 text-[#FF6B35]" />
                  </div>
                  <p>{message}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-[#1E1E24] rounded-2xl border border-[#E5E7EB] dark:border-white/10 p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-[15px] text-[#1A2332] dark:text-white" style={{ fontWeight: 700 }}>
                  Produits sans promo
                </h3>
                <p className="text-[12px] text-[#6B7280] dark:text-white/55">
                  {promotableProducts.length} produit{promotableProducts.length > 1 ? "s" : ""} pret{promotableProducts.length > 1 ? "s" : ""} a etre remises.
                </p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-[#3B82F6]/10 flex items-center justify-center">
                <Plus className="w-5 h-5 text-[#3B82F6]" />
              </div>
            </div>

            {promotableProducts.length > 0 ? (
              <div className="space-y-3">
                {promotableProducts.slice(0, 6).map((product) => (
                  <div key={product.id} className="rounded-xl border border-[#E5E7EB] dark:border-white/10 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[13px] text-[#1A2332] dark:text-white truncate" style={{ fontWeight: 700 }}>
                          {product.name}
                        </p>
                        <p className="text-[11px] text-[#9CA3AF] mt-1">
                          {product.brand || "Produit"} {product.category ? `· ${product.category}` : ""}
                        </p>
                        <p className="text-[12px] text-[#FF6B35] mt-2" style={{ fontWeight: 700 }}>
                          {formatPrice(product.price)}
                        </p>
                      </div>
                      <button
                        onClick={() => setEditorState({ mode: "create", productId: product.id })}
                        className="px-3 py-2 rounded-xl bg-[#FF6B35]/10 text-[#FF6B35] text-[12px] hover:bg-[#FF6B35]/15"
                        style={{ fontWeight: 700 }}
                      >
                        Creer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-[#D1D5DB] dark:border-white/10 p-4 text-[12px] text-[#6B7280] dark:text-white/55">
                Tous les produits remises sont deja sur une promo, ou le catalogue est vide.
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-[#1E1E24] rounded-2xl border border-[#E5E7EB] dark:border-white/10 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-[#EF4444]/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-[#EF4444]" />
              </div>
              <div>
                <h3 className="text-[15px] text-[#1A2332] dark:text-white" style={{ fontWeight: 700 }}>
                  Points d'attention
                </h3>
                <p className="text-[12px] text-[#6B7280] dark:text-white/55">
                  Pour garder une boutique propre et credible.
                </p>
              </div>
            </div>
            <div className="space-y-2 text-[12px] text-[#6B7280] dark:text-white/60">
              <p>Verifiez que l'ancien prix reste logique par rapport au prix promo.</p>
              <p>Un produit actif mais sans stock reste masque sur la boutique, meme avec promo.</p>
              <p>La suppression retire uniquement l'ancien prix barre, sans remonter le prix actuel.</p>
            </div>
          </div>
        </aside>
      </div>

      {editorState && (
        <PromotionEditorModal
          mode={editorState.mode}
          products={products}
          initialProduct={editorProduct}
          isSubmitting={isMutating}
          onClose={() => !isMutating && setEditorState(null)}
          onSubmit={handleSavePromotion}
        />
      )}

      {removeTarget && (
        <RemovePromotionModal
          product={removeTarget}
          isSubmitting={isMutating}
          onClose={() => !isMutating && setRemoveTarget(null)}
          onConfirm={handleRemovePromotion}
        />
      )}
    </div>
  );
}
