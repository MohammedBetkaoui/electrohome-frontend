import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Flame, ChevronRight, ShoppingCart, Tag, Timer, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { getCatalogCategories, type CatalogCategory } from "../api/categories";
import { getCatalogProducts } from "../api/products";
import { ProductCard } from "../components/ProductCard";
import { Skeleton } from "../components/ui/skeleton";
import { formatPrice, useStore } from "../data/store";
import {
  getPromotionDiscountPercent,
  getPromotionSavings,
  hasActivePromotion,
} from "../lib/promotions";
import type { Product } from "../data/store";

function formatCategoryLabel(slug: string, categories: CatalogCategory[]): string {
  const matchingCategory = categories.find((category) => category.slug === slug);

  if (matchingCategory) {
    return matchingCategory.name;
  }

  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getFlashDeadline() {
  const now = new Date();
  const deadline = new Date(now);
  deadline.setHours(23, 59, 59, 999);
  return Math.max(0, deadline.getTime() - now.getTime());
}

function useFlashCountdown() {
  const [timeLeft, setTimeLeft] = useState(getFlashDeadline);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setTimeLeft(getFlashDeadline());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const hours = Math.floor(timeLeft / 3600000);
  const minutes = Math.floor((timeLeft % 3600000) / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);

  return {
    hours: String(hours).padStart(2, "0"),
    minutes: String(minutes).padStart(2, "0"),
    seconds: String(seconds).padStart(2, "0"),
  };
}

function PromotionsPageSkeleton() {
  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-20 py-8 space-y-6">
      <Skeleton className="h-5 w-48" />
      <Skeleton className="h-[280px] rounded-[32px]" />
      <Skeleton className="h-[340px] rounded-[28px]" />
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-11 w-32 rounded-xl shrink-0" />
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="rounded-xl border border-border overflow-hidden bg-card">
            <Skeleton className="aspect-square w-full rounded-none" />
            <div className="p-4 space-y-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-5 w-28" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PromotionsPage() {
  const { addToCart } = useStore();
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [promoProducts, setPromoProducts] = useState<Product[]>([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const countdown = useFlashCountdown();

  useEffect(() => {
    let ignore = false;

    setIsLoading(true);

    Promise.allSettled([
      getCatalogProducts({
        limit: 120,
        hasDiscount: true,
        sort: "discount_desc",
      }),
      getCatalogCategories(),
    ])
      .then(([productsResult, categoriesResult]) => {
        if (ignore) {
          return;
        }

        if (productsResult.status === "fulfilled") {
          setPromoProducts(productsResult.value.filter((product) => hasActivePromotion(product)));
          setError("");
        } else {
          setPromoProducts([]);
          setError(productsResult.reason instanceof Error ? productsResult.reason.message : "Impossible de charger les promotions.");
        }

        if (categoriesResult.status === "fulfilled") {
          setCategories(categoriesResult.value);
        } else {
          setCategories([]);
        }
      })
      .finally(() => {
        if (!ignore) {
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const categoryTabs = useMemo(() => {
    const counts = new Map<string, number>();

    promoProducts.forEach((product) => {
      counts.set(product.category, (counts.get(product.category) ?? 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([slug, count]) => ({
        slug,
        name: formatCategoryLabel(slug, categories),
        count,
      }))
      .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name));
  }, [categories, promoProducts]);

  useEffect(() => {
    if (activeFilter === "all") {
      return;
    }

    if (!categoryTabs.some((category) => category.slug === activeFilter)) {
      setActiveFilter("all");
    }
  }, [activeFilter, categoryTabs]);

  const filteredProducts = useMemo(
    () => activeFilter === "all"
      ? promoProducts
      : promoProducts.filter((product) => product.category === activeFilter),
    [activeFilter, promoProducts],
  );

  const spotlightProduct = filteredProducts[0] ?? promoProducts[0] ?? null;
  const gridProducts = filteredProducts.filter((product) => product.id !== spotlightProduct?.id);
  const visibleProducts = spotlightProduct ? filteredProducts : promoProducts;
  const averageDiscount = visibleProducts.length > 0
    ? Math.round(
        visibleProducts.reduce((total, product) => total + getPromotionDiscountPercent(product), 0) / visibleProducts.length,
      )
    : 0;
  const totalSavings = visibleProducts.reduce((total, product) => total + getPromotionSavings(product), 0);
  const brandCount = new Set(visibleProducts.map((product) => product.brand).filter(Boolean)).size;

  const handleSpotlightAddToCart = (product: Product) => {
    const result = addToCart(product);

    if (result.reason === "out_of_stock") {
      toast.error("Ce produit est actuellement hors stock.");
      return;
    }

    if (result.reason === "max_stock_reached") {
      toast.info(`Stock maximum atteint${result.quantity > 0 ? ` : ${result.quantity}` : ""}.`);
      return;
    }

    toast.success("Produit ajoute au panier.");
  };

  if (isLoading) {
    return <PromotionsPageSkeleton />;
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-20 py-8">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6 flex-wrap">
        <Link to="/" className="hover:text-foreground">Accueil</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground">Promotions</span>
      </nav>

      <section
        className="rounded-[32px] p-6 md:p-8 text-white border border-white/10 overflow-hidden relative"
        style={{ background: "linear-gradient(135deg, #121826 0%, #1A1A2E 55%, #E8400C 160%)" }}
      >
        <div className="absolute inset-0 opacity-20" style={{ background: "radial-gradient(circle at top right, #FFD60A 0%, transparent 36%)" }} />
        <div className="relative grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_320px] gap-6 items-start">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[11px] uppercase tracking-[0.18em] mb-4">
              <Flame className="w-3.5 h-3.5 text-[#FFD60A]" />
              Ventes flash ElectroHome
            </div>
            <h1 className="text-3xl md:text-4xl leading-tight" style={{ fontWeight: 700 }}>
              Les meilleures promotions du moment, directement publiees depuis notre catalogue.
            </h1>
            <p className="text-sm md:text-[15px] text-white/75 mt-4 max-w-2xl">
              Les remises affichees ici sont synchronisees avec la boutique en temps reel. Quand l'administration active
              une promo, elle apparait automatiquement sur cette page, dans la recherche et sur les fiches produit.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
              {[
                { label: "Promotions disponibles", value: `${visibleProducts.length}` },
                { label: "Remise moyenne", value: `${averageDiscount}%` },
                { label: "Marques concernees", value: `${brandCount}` },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl bg-white/8 border border-white/10 p-4 backdrop-blur">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-white/55">{item.label}</p>
                  <p className="text-[22px] mt-2" style={{ fontWeight: 700 }}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] bg-white/8 border border-white/10 p-5 backdrop-blur space-y-4">
            <div className="flex items-center gap-2 text-[12px] uppercase tracking-[0.14em] text-white/55">
              <Timer className="w-4 h-4 text-[#FFD60A]" />
              Se termine dans
            </div>
            <div className="flex items-center gap-2">
              {[countdown.hours, countdown.minutes, countdown.seconds].map((value, index) => (
                <div
                  key={index}
                  className="w-16 h-16 rounded-2xl bg-[#E8400C] text-white flex items-center justify-center text-[24px] font-mono shadow-lg shadow-[#E8400C]/20"
                  style={{ fontWeight: 700 }}
                >
                  {value}
                </div>
              ))}
            </div>
            <p className="text-[12px] text-white/70">
              Economies potentielles visibles: <span style={{ fontWeight: 700 }}>{formatPrice(totalSavings)}</span>
            </p>
            <div className="rounded-2xl bg-[#FFD60A] text-[#111] p-4">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.12em]">
                <TrendingUp className="w-4 h-4" />
                Bon plan du jour
              </div>
              <p className="text-[13px] mt-2" style={{ fontWeight: 600 }}>
                Les produits les plus remises sont mis en avant ici, avec le meme prix que sur leur fiche detaillee.
              </p>
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground mt-6">
          {error}
        </div>
      ) : spotlightProduct ? (
        <>
          <section className="mt-8 rounded-[28px] border border-border bg-card overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_1.1fr] gap-0">
              <div className="bg-[#F6F7FB] dark:bg-[#0F1623] p-6 md:p-8 flex items-center justify-center">
                <img
                  src={spotlightProduct.image}
                  alt={spotlightProduct.name}
                  className="w-full max-w-md rounded-[24px] object-cover aspect-square shadow-2xl shadow-black/10"
                />
              </div>

              <div className="p-6 md:p-8 flex flex-col justify-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8400C]/10 text-[#E8400C] text-[11px] uppercase tracking-[0.16em] w-fit mb-4">
                  <Tag className="w-3.5 h-3.5" />
                  Promotion du jour
                </div>
                <p className="text-sm text-muted-foreground">
                  {spotlightProduct.brand} {spotlightProduct.category ? `· ${formatCategoryLabel(spotlightProduct.category, categories)}` : ""}
                </p>
                <h2 className="text-2xl md:text-3xl mt-2" style={{ fontWeight: 700 }}>
                  {spotlightProduct.name}
                </h2>
                <p className="text-sm text-muted-foreground mt-3 max-w-xl">
                  {spotlightProduct.description || spotlightProduct.specs}
                </p>

                <div className="flex flex-wrap items-center gap-3 mt-6">
                  <span className="text-[34px] text-[#E8400C]" style={{ fontWeight: 700 }}>
                    {formatPrice(spotlightProduct.price)}
                  </span>
                  {spotlightProduct.oldPrice && (
                    <span className="text-lg text-muted-foreground line-through">
                      {formatPrice(spotlightProduct.oldPrice)}
                    </span>
                  )}
                  <span className="px-3 py-1 rounded-full bg-[#111827] text-white text-sm" style={{ fontWeight: 700 }}>
                    -{getPromotionDiscountPercent(spotlightProduct)}%
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-6 max-w-md">
                  <div className="rounded-2xl bg-muted p-4">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Economie</p>
                    <p className="text-[18px] mt-2" style={{ fontWeight: 700 }}>
                      {formatPrice(getPromotionSavings(spotlightProduct))}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-muted p-4">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Disponibilite</p>
                    <p className="text-[18px] mt-2" style={{ fontWeight: 700 }}>
                      {typeof spotlightProduct.stock === "number" && spotlightProduct.stock > 0 ? `${spotlightProduct.stock} en stock` : "Hors stock"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <button
                    onClick={() => handleSpotlightAddToCart(spotlightProduct)}
                    disabled={typeof spotlightProduct.stock === "number" && spotlightProduct.stock <= 0}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#E8400C] text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ fontWeight: 700 }}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    {typeof spotlightProduct.stock === "number" && spotlightProduct.stock <= 0 ? "Hors stock" : "Ajouter au panier"}
                  </button>
                  <Link
                    to={`/produit/${spotlightProduct.slug ?? spotlightProduct.id}`}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-border hover:bg-muted transition-colors"
                    style={{ fontWeight: 600 }}
                  >
                    Voir la fiche produit
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-8">
            <div className="flex flex-wrap gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => setActiveFilter("all")}
                className={`px-4 py-2.5 rounded-xl text-sm whitespace-nowrap transition-colors ${
                  activeFilter === "all"
                    ? "bg-[#E8400C] text-white"
                    : "bg-card border border-border hover:bg-muted"
                }`}
                style={{ fontWeight: 600 }}
              >
                Toutes les promos ({promoProducts.length})
              </button>
              {categoryTabs.map((category) => (
                <button
                  key={category.slug}
                  onClick={() => setActiveFilter(category.slug)}
                  className={`px-4 py-2.5 rounded-xl text-sm whitespace-nowrap transition-colors ${
                    activeFilter === category.slug
                      ? "bg-[#E8400C] text-white"
                      : "bg-card border border-border hover:bg-muted"
                  }`}
                  style={{ fontWeight: 600 }}
                >
                  {category.name} ({category.count})
                </button>
              ))}
            </div>
          </section>

          {gridProducts.length > 0 ? (
            <section className="mt-6">
              <div className="flex items-center justify-between gap-3 mb-5">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Selection</p>
                  <h3 className="text-xl mt-1" style={{ fontWeight: 700 }}>
                    {activeFilter === "all"
                      ? "Toutes les offres disponibles"
                      : `Promotions ${formatCategoryLabel(activeFilter, categories)}`}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  {gridProducts.length} produit{gridProducts.length > 1 ? "s" : ""} supplementaire{gridProducts.length > 1 ? "s" : ""}
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {gridProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          ) : (
            <section className="mt-6 rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
              {filteredProducts.length > 0
                ? "Cette categorie n'a qu'une seule offre mise en avant pour le moment."
                : "Aucune promotion n'est disponible pour ce filtre pour le moment."}
            </section>
          )}
        </>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-8 text-center mt-6">
          <div className="w-14 h-14 rounded-full bg-[#E8400C]/10 flex items-center justify-center mx-auto mb-4">
            <Flame className="w-6 h-6 text-[#E8400C]" />
          </div>
          <h2 className="text-xl" style={{ fontWeight: 700 }}>Aucune promotion en cours</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Revenez plus tard ou explorez le catalogue complet pour decouvrir nos nouveautes.
          </p>
          <div className="flex justify-center gap-3 mt-6">
            <Link to="/recherche" className="px-5 py-3 rounded-xl bg-[#E8400C] text-white text-sm hover:opacity-90">
              Explorer le catalogue
            </Link>
            <Link to="/" className="px-5 py-3 rounded-xl border border-border text-sm hover:bg-muted">
              Retour a l'accueil
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
