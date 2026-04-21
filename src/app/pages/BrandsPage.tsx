import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { ArrowRight, ChevronRight, Package, ShieldCheck, Sparkles, Star } from "lucide-react";
import { getCatalogBrands, type CatalogBrand } from "../api/brands";
import { getCatalogProducts } from "../api/products";
import { Skeleton } from "../components/ui/skeleton";
import { IMAGES, formatPrice } from "../data/store";
import type { Product } from "../data/store";

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
    "linear-gradient(135deg, rgba(232,64,12,0.16), rgba(255,232,214,0.7))",
    "linear-gradient(135deg, rgba(37,99,235,0.14), rgba(219,234,254,0.7))",
    "linear-gradient(135deg, rgba(5,150,105,0.12), rgba(209,250,229,0.7))",
    "linear-gradient(135deg, rgba(147,51,234,0.12), rgba(243,232,255,0.7))",
    "linear-gradient(135deg, rgba(217,119,6,0.16), rgba(254,243,199,0.7))",
    "linear-gradient(135deg, rgba(190,24,93,0.12), rgba(251,207,232,0.7))",
  ];

  return accents[index % accents.length];
}

function BrandsGridSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-56 w-full rounded-[28px]" />
      ))}
    </div>
  );
}

export function BrandsPage() {
  const [brands, setBrands] = useState<CatalogBrand[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(true);
  const [brandsError, setBrandsError] = useState("");
  const [spotlightProducts, setSpotlightProducts] = useState<Product[]>([]);
  const [spotlightLoading, setSpotlightLoading] = useState(false);

  useEffect(() => {
    let ignore = false;

    setBrandsLoading(true);

    getCatalogBrands()
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

  const spotlightBrand = useMemo(() => brands[0] || null, [brands]);
  const featuredBrands = brands.slice(1, 4);

  useEffect(() => {
    let ignore = false;

    if (!spotlightBrand) {
      setSpotlightProducts([]);
      return () => {
        ignore = true;
      };
    }

    setSpotlightLoading(true);

    getCatalogProducts({ brand: spotlightBrand.name, limit: 3 })
      .then((items) => {
        if (ignore) return;
        setSpotlightProducts(items);
      })
      .catch(() => {
        if (ignore) return;
        setSpotlightProducts([]);
      })
      .finally(() => {
        if (!ignore) {
          setSpotlightLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [spotlightBrand]);

  const spotlightImage = spotlightProducts[0]?.image || IMAGES.store;
  const totalProducts = brands.reduce((sum, brand) => sum + brand.productsCount, 0);

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-20 py-8 md:py-10">
      <section className="relative overflow-hidden rounded-[34px] border border-[#E5E7EB] bg-[radial-gradient(circle_at_top_left,rgba(232,64,12,0.2),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(248,193,92,0.12),transparent_22%),linear-gradient(135deg,#101828_0%,#182132_48%,#0F172A_100%)] px-6 py-10 text-white shadow-[0_40px_100px_rgba(15,23,42,0.18)] md:px-10 md:py-12 dark:border-white/10">
        <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-[#E8400C]/12 blur-3xl" />
        <div className="absolute bottom-0 left-10 h-28 w-28 rounded-full bg-[#F8C15C]/14 blur-2xl" />

        <div className="relative grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-white/78">
              <Sparkles className="h-3.5 w-3.5 text-[#FFB089]" />
              Espace marques
            </div>
            <h1 className="mt-4 max-w-3xl text-3xl leading-tight md:text-5xl" style={{ fontWeight: 700 }}>
              Un espace dedie aux marques, concu pour une presentation claire et officielle.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/68 md:text-base">
              Les logos, les volumes de produits et la marque mise en avant sont alimentes par le catalogue afin d'assurer une presentation structuree et conforme aux donnees disponibles.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to={spotlightBrand ? `/recherche?brand=${encodeURIComponent(spotlightBrand.name)}` : "/recherche"}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#E8400C] px-5 py-3 text-sm text-white shadow-[0_18px_35px_rgba(232,64,12,0.28)] hover:bg-[#D63A0A]"
                style={{ fontWeight: 600 }}
              >
                Explorer les collections
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/promotions"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/15 px-5 py-3 text-sm text-white/88 hover:bg-white/8"
              >
                Voir les offres du moment
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            {[
              { label: "Marques actives", value: brandsLoading ? "..." : brands.length, icon: ShieldCheck },
              { label: "Produits relies", value: brandsLoading ? "..." : totalProducts, icon: Package },
              { label: "Marque leader", value: spotlightBrand?.name || "...", icon: Star },
            ].map((item) => (
              <div key={item.label} className="rounded-[24px] border border-white/10 bg-white/8 p-4 backdrop-blur">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                  <item.icon className="h-4.5 w-4.5 text-[#FFB089]" />
                </div>
                <p className="text-[22px] text-white" style={{ fontWeight: 700 }}>{item.value}</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-white/45">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {brands.length > 0 ? (
          <div className="relative mt-8 overflow-hidden rounded-[28px] border border-white/10 bg-white/6 p-4 backdrop-blur">
            <div className="flex gap-3 overflow-x-auto pb-1">
              {brands.slice(0, 8).map((brand, index) => (
                <Link
                  key={brand.id}
                  to={`/recherche?brand=${encodeURIComponent(brand.name)}`}
                  className="min-w-[180px] rounded-[22px] border border-white/10 bg-white/7 p-4 transition-colors hover:bg-white/12"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/12">
                      {brand.logoUrl ? (
                        <img src={brand.logoUrl} alt={brand.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-sm tracking-[0.14em]" style={{ fontWeight: 700 }}>
                          {getBrandInitials(brand.name)}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm text-white" style={{ fontWeight: 600 }}>{brand.name}</p>
                      <p className="text-xs text-white/48">{brand.productsCount} produits</p>
                    </div>
                  </div>
                  <p className="mt-3 text-[10px] uppercase tracking-[0.22em] text-white/40">Selection #{index + 1}</p>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <section className="mt-8 grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="relative overflow-hidden rounded-[30px] border border-border bg-card shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
          <img src={spotlightImage} alt={spotlightBrand?.name || "Marque a la une"} className="h-[360px] w-full object-cover md:h-[460px]" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/88 via-black/55 to-black/10" />

          <div className="absolute inset-0 flex items-center">
            <div className="w-full px-6 md:px-10">
              {spotlightBrand ? (
                <div className="max-w-xl text-white">
                  <p className="text-[11px] uppercase tracking-[0.3em] text-white/45">Marque a la une</p>
                  <div className="mt-4 flex items-center gap-4">
                    <div className="flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-[22px] border border-white/10 bg-white/10">
                      {spotlightBrand.logoUrl ? (
                        <img src={spotlightBrand.logoUrl} alt={spotlightBrand.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-lg tracking-[0.14em]" style={{ fontWeight: 700 }}>
                          {getBrandInitials(spotlightBrand.name)}
                        </span>
                      )}
                    </div>
                    <div>
                      <h2 className="text-3xl md:text-4xl" style={{ fontWeight: 700 }}>{spotlightBrand.name}</h2>
                      <p className="mt-1 text-sm text-white/68">{spotlightBrand.productsCount} produits actuellement en ligne.</p>
                    </div>
                  </div>

                  <p className="mt-5 text-sm leading-6 text-white/72">
                    Cette mise en avant est determinee automatiquement a partir de la presence de la marque dans le catalogue et de la disponibilite de ses produits.
                  </p>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      to={`/recherche?brand=${encodeURIComponent(spotlightBrand.name)}`}
                      className="inline-flex items-center gap-2 rounded-2xl bg-[#E8400C] px-5 py-3 text-sm text-white hover:bg-[#D63A0A]"
                      style={{ fontWeight: 600 }}
                    >
                      Voir la collection <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                      to="/recherche"
                      className="inline-flex items-center gap-2 rounded-2xl border border-white/20 px-5 py-3 text-sm text-white/88 hover:bg-white/8"
                    >
                      Retour au catalogue
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="max-w-md text-white">
                  <h2 className="text-3xl" style={{ fontWeight: 700 }}>La marque principale sera affichee ici.</h2>
                  <p className="mt-3 text-sm text-white/68">
                    L'ajout de marques associees a des produits actifs permet d'alimenter automatiquement cette section.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-[30px] border border-border bg-card p-6 shadow-[0_24px_70px_rgba(15,23,42,0.05)]">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Vue d'ensemble</p>
                <h3 className="mt-2 text-2xl" style={{ fontWeight: 600 }}>Marques principales</h3>
              </div>
              <Link to="/recherche" className="hidden text-sm text-[#E8400C] md:inline-flex md:items-center md:gap-1">
                Ouvrir le catalogue <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-5 space-y-3">
              {(featuredBrands.length > 0 ? featuredBrands : brands.slice(0, 3)).map((brand, index) => (
                <Link
                  key={brand.id}
                  to={`/recherche?brand=${encodeURIComponent(brand.name)}`}
                  className="group relative block overflow-hidden rounded-[24px] border border-border p-4 transition-all hover:-translate-y-0.5 hover:border-[#E8400C]/30 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
                >
                  <div className="absolute inset-x-0 top-0 h-20 opacity-90" style={{ background: getBrandAccent(index) }} />
                  <div className="relative flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[22px] border border-white/50 bg-white/85 text-[#E8400C] shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-[#FFB089]">
                        {brand.logoUrl ? (
                          <img src={brand.logoUrl} alt={brand.name} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-base tracking-[0.14em]" style={{ fontWeight: 700 }}>
                            {getBrandInitials(brand.name)}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 pt-6">
                        <p className="truncate text-lg text-foreground transition-colors group-hover:text-[#E8400C]" style={{ fontWeight: 600 }}>
                          {brand.name}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">/{brand.slug}</p>
                      </div>
                    </div>
                    <div className="pt-6 text-right">
                      <p className="text-2xl text-foreground" style={{ fontWeight: 700 }}>{brand.productsCount}</p>
                      <p className="text-xs text-muted-foreground">produits</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[30px] border border-border bg-card p-6 shadow-[0_24px_70px_rgba(15,23,42,0.05)]">
            <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Produits lies</p>
            <h3 className="mt-2 text-2xl" style={{ fontWeight: 600 }}>Selection de la marque vedette</h3>

            <div className="mt-5 grid gap-3">
              {spotlightLoading
                ? Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton key={index} className="h-24 rounded-[22px]" />
                  ))
                : spotlightProducts.length > 0
                  ? spotlightProducts.map((product) => (
                      <Link
                        key={product.id}
                        to={`/produit/${product.slug}`}
                        className="group flex items-center gap-4 rounded-[24px] border border-border p-3 transition-all hover:-translate-y-0.5 hover:border-[#E8400C]/30 hover:shadow-[0_18px_40px_rgba(15,23,42,0.06)]"
                      >
                        <img src={product.image} alt={product.name} className="h-20 w-20 rounded-[18px] object-cover" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{product.brand}</p>
                          <p className="mt-1 truncate text-sm text-foreground group-hover:text-[#E8400C]" style={{ fontWeight: 600 }}>
                            {product.name}
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-sm text-[#E8400C]" style={{ fontWeight: 700 }}>
                              {formatPrice(product.price)}
                            </span>
                            {product.oldPrice ? (
                              <span className="text-xs text-muted-foreground line-through">
                                {formatPrice(product.oldPrice)}
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 shrink-0 text-[#E8400C] transition-transform group-hover:translate-x-1" />
                      </Link>
                    ))
                  : (
                    <div className="rounded-[24px] border border-dashed border-border p-5 text-sm text-muted-foreground">
                      Aucun produit n'est disponible pour cette marque pour le moment.
                    </div>
                  )}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Repertoire</p>
            <h2 className="mt-2 text-2xl md:text-3xl" style={{ fontWeight: 600 }}>Toutes les marques du catalogue</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Cette grille permet de consulter l'ensemble des marques referencees et d'acceder directement a leurs collections respectives.
            </p>
          </div>
        </div>

        {brandsLoading ? (
          <BrandsGridSkeleton />
        ) : brands.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {brands.map((brand, index) => (
              <Link
                key={brand.id}
                to={`/recherche?brand=${encodeURIComponent(brand.name)}`}
                className="group relative overflow-hidden rounded-[30px] border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-[#E8400C]/30 hover:shadow-[0_28px_60px_rgba(15,23,42,0.08)]"
              >
                <div className="absolute inset-x-0 top-0 h-28 opacity-90" style={{ background: getBrandAccent(index) }} />
                <div className="relative flex h-full flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-[24px] border border-white/60 bg-white/85 text-[#E8400C] shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-[#FFB089]">
                      {brand.logoUrl ? (
                        <img src={brand.logoUrl} alt={brand.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-lg tracking-[0.16em]" style={{ fontWeight: 700 }}>
                          {getBrandInitials(brand.name)}
                        </span>
                      )}
                    </div>
                    <span className="rounded-full bg-white/85 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[#6B7280] shadow-sm dark:bg-white/10 dark:text-white/60">
                      Collection
                    </span>
                  </div>

                  <div className="mt-14">
                    <h3 className="text-2xl text-foreground transition-colors group-hover:text-[#E8400C]" style={{ fontWeight: 600 }}>
                      {brand.name}
                    </h3>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">/{brand.slug}</p>
                  </div>

                  <div className="mt-6 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-3xl text-foreground" style={{ fontWeight: 700 }}>{brand.productsCount}</p>
                      <p className="text-xs text-muted-foreground">produits disponibles</p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-sm text-[#E8400C]">
                      Explorer
                      <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-[28px] border border-border bg-card p-6 text-sm text-muted-foreground">
            {brandsError || "Aucune marque n'est disponible pour le moment."}
          </div>
        )}
      </section>
    </div>
  );
}
