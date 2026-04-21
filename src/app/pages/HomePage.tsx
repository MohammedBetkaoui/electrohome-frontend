import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Truck, Shield, Headphones, Award, ChevronRight, ArrowRight, Timer, Sparkles, ShieldCheck, Layers3 } from "lucide-react";
import { toast } from "sonner";
import { IMAGES, formatPrice, useStore } from "../data/store";
import { getCatalogBrands, type CatalogBrand } from "../api/brands";
import { getCatalogCategories, type CatalogCategory } from "../api/categories";
import { getCatalogBlogPosts } from "../api/blog";
import { getCatalogProducts } from "../api/products";
import { ProductCard } from "../components/ProductCard";
import { Skeleton } from "../components/ui/skeleton";
import type { Product } from "../data/store";
import type { BlogPost } from "../lib/blog";
import { formatBlogReadTime } from "../lib/blog";
import { hasActivePromotion } from "../lib/promotions";

function CountdownTimer() {
  const [time, setTime] = useState({ h: 2, m: 14, s: 36 });

  useEffect(() => {
    const interval = setInterval(() => {
      setTime((currentTime) => {
        let { h, m, s } = currentTime;
        s -= 1;

        if (s < 0) {
          s = 59;
          m -= 1;
        }

        if (m < 0) {
          m = 59;
          h -= 1;
        }

        if (h < 0) {
          return { h: 23, m: 59, s: 59 };
        }

        return { h, m, s };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const pad = (value: number) => String(value).padStart(2, "0");

  return (
    <div className="flex gap-2">
      {[pad(time.h), pad(time.m), pad(time.s)].map((value, index) => (
        <div
          key={index}
          className="w-12 h-12 rounded-lg bg-[#E8400C] dark:bg-[#FF5722] text-white flex items-center justify-center text-lg font-mono"
          style={{ fontWeight: 700 }}
        >
          {value}
        </div>
      ))}
    </div>
  );
}

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, index) => (
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
  );
}

function CategoryGridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <Skeleton key={index} className="aspect-[4/3] w-full rounded-xl" />
      ))}
    </div>
  );
}

function BrandGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-24 w-full rounded-2xl" />
      ))}
    </div>
  );
}

function getBrandInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function getBrandAccent(index: number) {
  const accents = [
    "linear-gradient(135deg, rgba(232,64,12,0.18), rgba(255,205,178,0.32))",
    "linear-gradient(135deg, rgba(12,74,110,0.18), rgba(125,211,252,0.26))",
    "linear-gradient(135deg, rgba(22,101,52,0.16), rgba(187,247,208,0.26))",
    "linear-gradient(135deg, rgba(91,33,182,0.16), rgba(221,214,254,0.26))",
    "linear-gradient(135deg, rgba(146,64,14,0.18), rgba(253,230,138,0.28))",
    "linear-gradient(135deg, rgba(155,28,28,0.15), rgba(254,202,202,0.26))",
  ];

  return accents[index % accents.length];
}

export function HomePage() {
  const { addToCart } = useStore();
  const [brands, setBrands] = useState<CatalogBrand[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(true);
  const [brandsError, setBrandsError] = useState("");
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState("");
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [blogLoading, setBlogLoading] = useState(true);
  const [blogError, setBlogError] = useState("");

  useEffect(() => {
    let ignore = false;

    setBrandsLoading(true);

    getCatalogBrands(6)
      .then((items) => {
        if (ignore) return;
        setBrands(items);
        setBrandsError("");
      })
      .catch((error) => {
        if (ignore) return;
        setBrands([]);
        setBrandsError(error instanceof Error ? error.message : "Impossible de charger les marques.");
      })
      .finally(() => {
        if (!ignore) {
          setBrandsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    setCategoriesLoading(true);

    getCatalogCategories(8)
      .then((items) => {
        if (ignore) return;
        setCategories(items);
        setCategoriesError("");
      })
      .catch((error) => {
        if (ignore) return;
        setCategories([]);
        setCategoriesError(error instanceof Error ? error.message : "Impossible de charger les categories.");
      })
      .finally(() => {
        if (!ignore) {
          setCategoriesLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    setBlogLoading(true);

    getCatalogBlogPosts({ limit: 3 })
      .then((posts) => {
        if (ignore) return;
        setBlogPosts(posts);
        setBlogError("");
      })
      .catch((error) => {
        if (ignore) return;
        setBlogPosts([]);
        setBlogError(error instanceof Error ? error.message : "Impossible de charger les articles du blog.");
      })
      .finally(() => {
        if (!ignore) {
          setBlogLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    setProductsLoading(true);

    getCatalogProducts(8)
      .then((products) => {
        if (ignore) return;
        setFeaturedProducts(products);
        setProductsError("");
      })
      .catch((error) => {
        if (ignore) return;
        setFeaturedProducts([]);
        setProductsError(error instanceof Error ? error.message : "Impossible de charger les produits.");
      })
      .finally(() => {
        if (!ignore) {
          setProductsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const flashProducts = featuredProducts.filter((product) => hasActivePromotion(product)).slice(0, 3);
  const firstCategorySlug = categories[0]?.slug || "refrigerateurs";
  const brandCountLabel = brandsLoading ? "..." : String(brands.length);
  const spotlightBrand = brands[0] || null;
  const brandRail = brands.slice(1, 7);
  const totalBrandProducts = brands.reduce((sum, brand) => sum + brand.productsCount, 0);

  const handleFlashAddToCart = (product: Product) => {
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

  return (
    <div>
      <section className="relative overflow-hidden min-h-[600px] md:min-h-[680px]" style={{ background: "linear-gradient(135deg, #0f0f1a 0%, #1A1A2E 40%, #16213E 100%)" }}>
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-[0.07]" style={{ background: "radial-gradient(circle, #E8400C 0%, transparent 70%)" }} />
          <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full opacity-[0.05]" style={{ background: "radial-gradient(circle, #E8400C 0%, transparent 70%)" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-[0.03]" style={{ background: "radial-gradient(circle, #fff 0%, transparent 60%)" }} />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        </div>

        <div className="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-20 py-16 md:py-24 flex flex-col lg:flex-row items-center gap-10 lg:gap-16 relative z-10">
          {/* Left content */}
          <div className="flex-1 text-white">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.08] border border-white/[0.08] text-xs mb-6 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-[#E8400C] animate-pulse" />
              Nouveau catalogue 2026
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] mb-6 tracking-tight" style={{ fontWeight: 800, lineHeight: 1.1 }}>
              Équipez votre maison
              <br />
              avec l&apos;<span className="relative inline-block">
                <span className="relative z-10 text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(135deg, #E8400C 0%, #FF6B3D 100%)" }}>excellence</span>
                <span className="absolute bottom-1 left-0 w-full h-3 bg-[#E8400C]/20 rounded-sm -z-0" />
              </span>
            </h1>
            <p className="text-white/60 mb-8 max-w-lg text-base leading-relaxed">
              Réfrigérateurs, machines à laver, fours et bien plus — découvrez les meilleures marques d&apos;électroménager avec livraison gratuite, installation offerte et garantie étendue.
            </p>
            <div className="flex flex-wrap gap-3 mb-10">
              <Link to="/categorie/refrigerateurs" className="group px-7 py-3.5 rounded-xl bg-[#E8400C] text-white text-sm hover:bg-[#d63a0a] transition-all inline-flex items-center gap-2 shadow-lg shadow-[#E8400C]/25" style={{ fontWeight: 600 }}>
                Explorer le catalogue <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link to="/blog" className="px-7 py-3.5 rounded-xl border border-white/15 text-white text-sm hover:bg-white/[0.06] transition-all backdrop-blur-sm" style={{ fontWeight: 500 }}>
                Nos conseils d&apos;experts
              </Link>
            </div>

            {/* Trust stats */}
            <div className="flex flex-wrap gap-6 md:gap-10">
              {[
                { value: "5 000+", label: "Références" },
                { value: brandCountLabel, label: "Marques" },
                { value: "4.8/5", label: "Satisfaction" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-xl md:text-2xl text-white" style={{ fontWeight: 700 }}>{stat.value}</p>
                  <p className="text-xs text-white/40 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right visual */}
          <div className="flex-1 relative w-full max-w-xl lg:max-w-none">
            <div className="relative">
              {/* Main image */}
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/40 border border-white/[0.06]">
                <img src={IMAGES.kitchen} alt="Cuisine moderne équipée" className="w-full aspect-[4/3] object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f1a]/60 via-transparent to-transparent" />
              </div>

              {/* Floating appliance cards */}
              <div className="hidden md:flex absolute -left-8 top-8 flex-col gap-3 animate-[float_6s_ease-in-out_infinite]">
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.08] backdrop-blur-xl border border-white/10 shadow-xl">
                  <img src={IMAGES.fridge} alt="Réfrigérateur" className="w-10 h-10 rounded-lg object-cover" />
                  <div>
                    <p className="text-white text-xs" style={{ fontWeight: 600 }}>Réfrigérateurs</p>
                    <p className="text-white/40 text-[10px]">Dès 45 000 DA</p>
                  </div>
                </div>
              </div>

              <div className="hidden md:flex absolute -right-6 bottom-16 flex-col gap-3 animate-[float_6s_ease-in-out_infinite_1s]">
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.08] backdrop-blur-xl border border-white/10 shadow-xl">
                  <img src={IMAGES.washer} alt="Machine à laver" className="w-10 h-10 rounded-lg object-cover" />
                  <div>
                    <p className="text-white text-xs" style={{ fontWeight: 600 }}>Machines à laver</p>
                    <p className="text-white/40 text-[10px]">Dès 35 000 DA</p>
                  </div>
                </div>
              </div>

              {/* Promo badge */}
              <div className="absolute -right-3 -top-3 md:right-4 md:top-4 px-3 py-2 rounded-xl bg-[#E8400C] text-white shadow-lg shadow-[#E8400C]/30 animate-[float_5s_ease-in-out_infinite_0.5s]">
                <p className="text-[10px] uppercase tracking-wider opacity-80" style={{ fontWeight: 500 }}>Jusqu&apos;à</p>
                <p className="text-xl" style={{ fontWeight: 800 }}>-40%</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="bg-[#FFD60A] text-[#111] overflow-hidden">
        <div className="flex animate-[scroll_20s_linear_infinite] whitespace-nowrap py-2.5 text-sm" style={{ fontWeight: 500 }}>
          {Array.from({ length: 3 }).map((_, index) => (
            <span key={index} className="mx-8">
              Livraison gratuite des 70 000 DA • -20% sur les refrigerateurs • Installation offerte • Garantie 5 ans
              disponible • Paiement en plusieurs fois sans frais
            </span>
          ))}
        </div>
      </div>

      <section className="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-20 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl" style={{ fontWeight: 600 }}>Nos categories</h2>
          <Link to={`/categorie/${firstCategorySlug}`} className="text-sm text-[#E8400C] flex items-center gap-1 hover:gap-2 transition-all">
            Tout voir <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {categoriesLoading ? (
          <CategoryGridSkeleton />
        ) : categories.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((category) => (
              <Link
                key={category.slug}
                to={`/categorie/${category.slug}`}
                className="group relative aspect-[4/3] rounded-xl overflow-hidden"
              >
                <img src={category.image} alt={category.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-white text-sm mb-0.5" style={{ fontWeight: 600 }}>{category.name}</h3>
                  <p className="text-white/70 text-xs">{category.count} produits</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
            {categoriesError || "Aucune categorie n'est disponible pour le moment."}
          </div>
        )}
      </section>

      <section className="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-20 pb-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl" style={{ fontWeight: 600 }}>Nos bestsellers</h2>
          <Link to="/promotions" className="text-sm text-[#E8400C] flex items-center gap-1 hover:gap-2 transition-all">
            Tout voir <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {productsLoading ? (
          <ProductGridSkeleton />
        ) : featuredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
            {productsError || "Aucun produit n'est disponible pour le moment."}
          </div>
        )}
      </section>

      <section className="border-y border-border bg-[linear-gradient(180deg,rgba(248,250,252,0.7)_0%,rgba(255,255,255,0)_100%)] py-14 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.02)_0%,rgba(255,255,255,0)_100%)]">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-20">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-[#FED7AA] bg-[#FFF7ED] px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-[#C2410C] dark:border-white/10 dark:bg-white/5 dark:text-[#FFB089]">
                <Sparkles className="h-3.5 w-3.5" />
                Marques partenaires
              </p>
              <h2 className="mt-3 text-2xl md:text-3xl" style={{ fontWeight: 600 }}>
                Une selection de marques de reference presentees avec clarte.
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Les logos, le volume de produits et l'acces aux collections sont relies au catalogue afin de garantir une presentation fiable et constamment actualisee.
              </p>
            </div>
            <Link to="/marques" className="hidden text-sm text-[#E8400C] md:inline-flex md:items-center md:gap-1">
              Voir toutes les marques <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {brandsLoading ? (
            <BrandGridSkeleton />
          ) : brands.length > 0 ? (
            <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="relative overflow-hidden rounded-[30px] border border-[#E5E7EB] bg-[radial-gradient(circle_at_top_left,rgba(232,64,12,0.22),transparent_30%),linear-gradient(145deg,#121826_0%,#182132_55%,#101828_100%)] p-6 text-white shadow-[0_30px_80px_rgba(15,23,42,0.15)] dark:border-white/10">
                <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-[#E8400C]/15 blur-3xl" />
                <div className="absolute bottom-0 left-12 h-24 w-24 rounded-full bg-[#F8C15C]/15 blur-2xl" />
                <div className="relative flex h-full flex-col justify-between gap-8">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="max-w-lg">
                      <p className="text-[11px] uppercase tracking-[0.3em] text-white/45">Marque a l'honneur</p>
                      <h3 className="mt-3 text-3xl md:text-4xl" style={{ fontWeight: 700 }}>
                        {spotlightBrand?.name || "Nos partenaires"}
                      </h3>
                      <p className="mt-3 text-sm leading-6 text-white/68">
                        {spotlightBrand
                          ? `${spotlightBrand.productsCount} produits disponibles dans le catalogue, avec une navigation directe vers sa collection.`
                          : "Consultez une selection de marques reconnues pour leur fiabilite, leur qualite et leur conformite aux standards du catalogue."}
                      </p>
                    </div>

                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[24px] border border-white/10 bg-white/10 text-white shadow-[0_20px_40px_rgba(0,0,0,0.18)]">
                      {spotlightBrand?.logoUrl ? (
                        <img src={spotlightBrand.logoUrl} alt={spotlightBrand.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-[20px] tracking-[0.16em]" style={{ fontWeight: 700 }}>
                          {getBrandInitials(spotlightBrand?.name || "EH")}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      { label: "Marques referencees", value: brands.length, icon: Layers3 },
                      { label: "Produits associes", value: totalBrandProducts, icon: ShieldCheck },
                      { label: "Acces direct", value: "100%", icon: Sparkles },
                    ].map((item) => (
                      <div key={item.label} className="rounded-[22px] border border-white/10 bg-white/7 p-4 backdrop-blur">
                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                          <item.icon className="h-4 w-4 text-[#FFB089]" />
                        </div>
                        <p className="text-[22px] text-white" style={{ fontWeight: 700 }}>
                          {item.value}
                        </p>
                        <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-white/45">{item.label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {spotlightBrand ? (
                      <Link
                        to={`/recherche?brand=${encodeURIComponent(spotlightBrand.name)}`}
                        className="inline-flex items-center gap-2 rounded-2xl bg-[#E8400C] px-5 py-3 text-sm text-white shadow-[0_18px_35px_rgba(232,64,12,0.28)] hover:bg-[#D63A0A]"
                        style={{ fontWeight: 600 }}
                      >
                        Explorer {spotlightBrand.name}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    ) : null}
                    <Link
                      to="/marques"
                      className="inline-flex items-center gap-2 rounded-2xl border border-white/15 px-5 py-3 text-sm text-white/88 hover:bg-white/8"
                    >
                      Consulter toutes les marques
                    </Link>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {brandRail.map((brand, index) => (
                  <Link
                    key={brand.id}
                    to={`/recherche?brand=${encodeURIComponent(brand.name)}`}
                    className="group relative overflow-hidden rounded-[26px] border border-border bg-card p-5 transition-all hover:-translate-y-1 hover:border-[#E8400C]/30 hover:shadow-[0_24px_55px_rgba(15,23,42,0.1)]"
                  >
                    <div
                      className="absolute inset-x-0 top-0 h-24 opacity-90"
                      style={{ background: getBrandAccent(index) }}
                    />
                    <div className="relative">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[22px] border border-white/40 bg-white/80 text-[#E8400C] shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-[#FFB089]">
                          {brand.logoUrl ? (
                            <img src={brand.logoUrl} alt={brand.name} className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-base tracking-[0.14em]" style={{ fontWeight: 700 }}>
                              {getBrandInitials(brand.name)}
                            </span>
                          )}
                        </div>
                        <span className="rounded-full bg-white/85 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[#6B7280] shadow-sm dark:bg-white/10 dark:text-white/60">
                          #{index + 2}
                        </span>
                      </div>

                      <div className="mt-10">
                        <p className="text-lg text-foreground transition-colors group-hover:text-[#E8400C]" style={{ fontWeight: 600 }}>
                          {brand.name}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">/{brand.slug}</p>
                      </div>

                      <div className="mt-5 flex items-end justify-between gap-3">
                        <div>
                          <p className="text-2xl text-foreground" style={{ fontWeight: 700 }}>{brand.productsCount}</p>
                          <p className="text-xs text-muted-foreground">produits disponibles</p>
                        </div>
                        <span className="inline-flex items-center gap-1 text-sm text-[#E8400C]">
                          Ouvrir
                          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
              {brandsError || "Aucune marque n'est disponible pour le moment."}
            </div>
          )}

          <div className="mt-4 md:hidden">
            <Link to="/marques" className="inline-flex items-center gap-1 text-sm text-[#E8400C]">
              Voir toutes les marques <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-20 py-16">
        <h2 className="text-2xl text-center mb-10" style={{ fontWeight: 600 }}>Pourquoi ElectroHome ?</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: Truck, title: "Livraison rapide", desc: "Livraison en 24-48h partout a Bordj Bou Arreridj" },
            { icon: Shield, title: "Garantie etendue", desc: "Jusqu'a 5 ans de garantie sur tous les produits" },
            { icon: Headphones, title: "SAV Premium", desc: "Service client disponible 7j/7" },
            { icon: Award, title: "Conseils experts", desc: "Des conseillers specialises a votre ecoute" },
          ].map((item) => (
            <div key={item.title} className="text-center p-6 rounded-xl bg-card border border-border">
              <div className="w-12 h-12 rounded-xl bg-[#E8400C]/10 dark:bg-[#FF5722]/10 flex items-center justify-center mx-auto mb-4">
                <item.icon className="w-6 h-6 text-[#E8400C] dark:text-[#FF5722]" />
              </div>
              <h3 className="text-sm mb-1" style={{ fontWeight: 600 }}>{item.title}</h3>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {flashProducts.length > 0 && (
        <section className="bg-[#1A1A2E] text-white py-16">
          <div className="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-20">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Timer className="w-5 h-5 text-[#E8400C]" />
                  <span className="text-xs uppercase tracking-widest opacity-70">Ventes Flash</span>
                </div>
                <h2 className="text-2xl" style={{ fontWeight: 600 }}>Offres limitees</h2>
              </div>
              <CountdownTimer />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {flashProducts.map((product) => (
                <div key={product.id} className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                  <img src={product.image} alt={product.name} className="w-24 h-24 rounded-lg object-cover" />
                  <div className="flex-1">
                    <p className="text-xs opacity-60">{product.brand}</p>
                    <p className="text-sm mb-1" style={{ fontWeight: 500 }}>{product.name}</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg text-[#E8400C]" style={{ fontWeight: 700 }}>{formatPrice(product.price)}</span>
                      <span className="text-sm opacity-50 line-through">{formatPrice(product.oldPrice!)}</span>
                    </div>
                    <button
                      onClick={() => handleFlashAddToCart(product)}
                      disabled={typeof product.stock === "number" && product.stock <= 0}
                      className="mt-2 px-3 py-1.5 rounded-lg bg-[#E8400C] text-white text-xs hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {typeof product.stock === "number" && product.stock <= 0 ? "Hors stock" : "Ajouter au panier"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-20 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl" style={{ fontWeight: 600 }}>Nos conseils</h2>
          <Link to="/blog" className="text-sm text-[#E8400C] flex items-center gap-1">
            Tout voir <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {blogLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-xl border border-border overflow-hidden bg-card">
                <Skeleton className="aspect-[16/10] w-full rounded-none" />
                <div className="p-5 space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : blogPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {blogPosts.map((post) => (
              <Link key={post.id} to={`/blog/${post.slug || post.id}`} className="group rounded-xl overflow-hidden bg-card border border-border">
                <div className="aspect-[16/10] overflow-hidden">
                  <img src={post.image} alt={post.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                </div>
                <div className="p-5">
                  <span className="text-xs text-[#0A84FF] dark:text-[#2997FF]" style={{ fontWeight: 500 }}>{post.category}</span>
                  <h3 className="text-sm mt-1 mb-2 group-hover:text-[#E8400C] transition-colors" style={{ fontWeight: 500 }}>
                    {post.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">{formatBlogReadTime(post.readTime)} de lecture</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
            {blogError || "Aucun article de blog n'est disponible pour le moment."}
          </div>
        )}
      </section>

      <section className="bg-[#1A1A2E] text-white">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-20 py-16 text-center">
          <h2 className="text-2xl mb-2" style={{ fontWeight: 600 }}>Recevez nos meilleures offres</h2>
          <p className="text-sm opacity-70 mb-6">Inscrivez-vous a notre newsletter et beneficiez de -10% sur votre premiere commande.</p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" onSubmit={(event) => event.preventDefault()}>
            <input
              type="email"
              placeholder="Votre adresse email"
              className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[#E8400C]"
            />
            <button className="px-6 py-3 rounded-lg bg-[#E8400C] text-white text-sm hover:opacity-90 transition-opacity" style={{ fontWeight: 500 }}>
              S&apos;inscrire
            </button>
          </form>
        </div>
      </section>

      <style>{`
        @keyframes scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-33.333%); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}
