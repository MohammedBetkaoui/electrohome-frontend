import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { BadgePercent, Search, SlidersHorizontal, Tag, X, RotateCcw, Sparkles } from "lucide-react";
import { getCatalogBrands, type CatalogBrand } from "../api/brands";
import { getCatalogCategories, type CatalogCategory } from "../api/categories";
import { getCatalogProducts, type CatalogProductsSort } from "../api/products";
import { CATEGORIES, useStore } from "../data/store";
import { ProductCard } from "../components/ProductCard";
import { Skeleton } from "../components/ui/skeleton";
import type { Product } from "../data/store";

const SORT_OPTIONS: Array<{ value: CatalogProductsSort; label: string }> = [
  { value: "relevance", label: "Pertinence" },
  { value: "newest", label: "Plus recents" },
  { value: "price_asc", label: "Prix croissant" },
  { value: "price_desc", label: "Prix decroissant" },
  { value: "discount_desc", label: "Meilleures promotions" },
  { value: "name_asc", label: "Nom (A-Z)" },
];

const VALID_SORTS = new Set<CatalogProductsSort>(SORT_OPTIONS.map((option) => option.value));
const PROMOTION_SEARCH_TERMS = new Set([
  "promo",
  "promos",
  "promotion",
  "promotions",
  "remise",
  "remises",
  "solde",
  "soldes",
]);

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <Skeleton key={index} className="h-[330px] rounded-2xl" />
      ))}
    </div>
  );
}

function SearchFiltersSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-6">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-11 rounded-xl" />
      ))}
    </div>
  );
}

function parsePositiveNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function normalizeKeyword(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function isPromotionKeyword(value: string) {
  return PROMOTION_SEARCH_TERMS.has(normalizeKeyword(value));
}

function getDefaultSort(query: string, promoOnly = false) {
  if (promoOnly) {
    return "discount_desc";
  }

  return query.trim() ? "relevance" : "newest";
}

export function SearchPage() {
  const { searchQuery, setSearchQuery } = useStore();
  const [params, setParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(params.get("q") || searchQuery || "");
  const [priceDraft, setPriceDraft] = useState({
    min: params.get("minPrice") || "",
    max: params.get("maxPrice") || "",
  });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [brands, setBrands] = useState<CatalogBrand[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [searchError, setSearchError] = useState("");

  const q = (params.get("q") || "").trim();
  const category = params.get("category") || "";
  const brand = params.get("brand") || "";
  const minPrice = params.get("minPrice") || "";
  const maxPrice = params.get("maxPrice") || "";
  const inStock = params.get("inStock") === "1";
  const promo = params.get("promo") === "1";
  const promotionKeyword = !promo && isPromotionKeyword(q);
  const effectiveQuery = promotionKeyword ? "" : q;
  const effectivePromo = promo || promotionKeyword;
  const rawSort = params.get("sort") as CatalogProductsSort | null;
  const sort = rawSort && VALID_SORTS.has(rawSort) ? rawSort : getDefaultSort(effectiveQuery, effectivePromo);

  const categoryOptions = categories.length > 0
    ? categories.map((item) => ({ slug: item.slug, name: item.name }))
    : CATEGORIES.map((item) => ({ slug: item.slug, name: item.name }));

  const brandOptions = useMemo(() => {
    const names = new Set(brands.map((item) => item.name).filter(Boolean));

    products.forEach((item) => {
      if (item.brand) {
        names.add(item.brand);
      }
    });

    if (brand) {
      names.add(brand);
    }

    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [brands, products, brand]);

  const quickSearches = useMemo(() => {
    const suggestions = [
      ...brands.slice(0, 3).map((item) => item.name),
      ...categoryOptions.slice(0, 2).map((item) => item.name),
      "Promo",
    ];

    return Array.from(new Set(suggestions)).slice(0, 6);
  }, [brands, categoryOptions]);

  const hasAdvancedFilters = Boolean(category || brand || minPrice || maxPrice || inStock || effectivePromo);
  const hasAnyCriteria = Boolean(effectiveQuery || hasAdvancedFilters);

  const resultsLabel = useMemo(() => {
    const fragments: string[] = [];

    if (effectiveQuery) {
      fragments.push(`pour "${effectiveQuery}"`);
    }

    if (brand) {
      fragments.push(`marque ${brand}`);
    }

    if (category) {
      const selectedCategory = categoryOptions.find((item) => item.slug === category)?.name || category;
      fragments.push(`categorie ${selectedCategory}`);
    }

    if (effectivePromo) {
      fragments.push("en promotion");
    }

    if (inStock) {
      fragments.push("en stock");
    }

    return fragments.join(" · ");
  }, [effectiveQuery, brand, category, categoryOptions, effectivePromo, inStock]);

  const activeFilterChips = useMemo(() => {
    const chips: Array<{ key: string; label: string; clear: Record<string, string | null> }> = [];

    if (effectiveQuery) {
      chips.push({ key: "q", label: `Recherche: ${effectiveQuery}`, clear: { q: null, sort: getDefaultSort("") } });
    }

    if (category) {
      const selectedCategory = categoryOptions.find((item) => item.slug === category)?.name || category;
      chips.push({ key: "category", label: selectedCategory, clear: { category: null } });
    }

    if (brand) {
      chips.push({ key: "brand", label: brand, clear: { brand: null } });
    }

    if (minPrice) {
      chips.push({ key: "minPrice", label: `Min ${minPrice} DA`, clear: { minPrice: null } });
    }

    if (maxPrice) {
      chips.push({ key: "maxPrice", label: `Max ${maxPrice} DA`, clear: { maxPrice: null } });
    }

    if (inStock) {
      chips.push({ key: "inStock", label: "En stock", clear: { inStock: null } });
    }

    if (effectivePromo) {
      chips.push({ key: "promo", label: "Promotions", clear: { promo: null } });
    }

    return chips;
  }, [effectiveQuery, category, brand, minPrice, maxPrice, inStock, effectivePromo, categoryOptions]);

  const updateParams = (updates: Record<string, string | null>) => {
    setParams((previous) => {
      const next = new URLSearchParams(previous);

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value.trim?.() === "" || value === "") {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      });

      const nextQuery = (next.get("q") || "").trim();
      const nextPromo = next.get("promo") === "1" || isPromotionKeyword(nextQuery);
      const nextSort = next.get("sort") as CatalogProductsSort | null;

      if (!nextSort || !VALID_SORTS.has(nextSort)) {
        next.set("sort", getDefaultSort(nextPromo ? "" : nextQuery, nextPromo));
      }

      return next;
    });
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextQuery = searchInput.trim();
    setSearchQuery(nextQuery);

    if (isPromotionKeyword(nextQuery)) {
      updateParams({
        q: null,
        promo: "1",
        sort: "discount_desc",
      });
      return;
    }

    updateParams({
      q: nextQuery || null,
      promo: null,
      sort: getDefaultSort(nextQuery),
    });
  };

  const applyPriceFilters = () => {
    const nextMin = priceDraft.min.trim();
    const nextMax = priceDraft.max.trim();

    updateParams({
      minPrice: nextMin || null,
      maxPrice: nextMax || null,
    });
  };

  const clearAllFilters = () => {
    setPriceDraft({ min: "", max: "" });
    setSearchInput("");
    setSearchQuery("");
    setParams(new URLSearchParams());
  };

  useEffect(() => {
    setSearchInput(params.get("q") || "");
    setPriceDraft({
      min: params.get("minPrice") || "",
      max: params.get("maxPrice") || "",
    });
    setSearchQuery(params.get("q") || "");
  }, [params, setSearchQuery]);

  useEffect(() => {
    if (!promotionKeyword) {
      return;
    }

    updateParams({
      q: null,
      promo: "1",
      sort: "discount_desc",
    });
  }, [promotionKeyword]);

  useEffect(() => {
    let ignore = false;

    setCatalogLoading(true);

    Promise.all([
      getCatalogCategories().catch(() => [] as CatalogCategory[]),
      getCatalogBrands().catch(() => [] as CatalogBrand[]),
    ])
      .then(([categoriesData, brandsData]) => {
        if (ignore) return;
        setCategories(categoriesData);
        setBrands(brandsData);
      })
      .finally(() => {
        if (!ignore) {
          setCatalogLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    const minPriceValue = minPrice.trim() === "" ? undefined : parsePositiveNumber(minPrice);
    const maxPriceValue = maxPrice.trim() === "" ? undefined : parsePositiveNumber(maxPrice);

    setIsLoading(true);
    setSearchError("");

    getCatalogProducts({
      limit: 120,
      q: effectiveQuery || undefined,
      categorySlug: category || undefined,
      brand: brand || undefined,
      minPrice: minPriceValue,
      maxPrice: maxPriceValue,
      inStock: inStock ? true : undefined,
      hasDiscount: effectivePromo ? true : undefined,
      sort,
    })
      .then((data) => {
        if (ignore) return;
        setProducts(data);
      })
      .catch((error) => {
        if (ignore) return;
        setProducts([]);
        setSearchError(error instanceof Error ? error.message : "Impossible de charger les resultats de recherche.");
      })
      .finally(() => {
        if (!ignore) {
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [effectiveQuery, category, brand, minPrice, maxPrice, inStock, effectivePromo, sort]);

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-20 py-8">
      <section className="relative overflow-hidden rounded-[30px] border border-border bg-[radial-gradient(circle_at_top_left,rgba(232,64,12,0.12),transparent_28%),linear-gradient(135deg,#FFFFFF_0%,#FFF8F4_55%,#F8FAFC_100%)] p-5 shadow-[0_24px_70px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_left,rgba(255,107,53,0.12),transparent_28%),linear-gradient(135deg,#101722_0%,#141C28_55%,#0F172A_100%)] md:p-6">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-[#FED7AA] bg-[#FFF7ED] px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-[#C2410C] dark:border-white/10 dark:bg-white/5 dark:text-[#FFB089]">
              <Sparkles className="h-3.5 w-3.5" />
              Recherche catalogue
            </p>
            <h1 className="mt-3 text-2xl md:text-3xl" style={{ fontWeight: 700 }}>
              Recherchez les produits selon vos besoins, vos criteres et vos marques.
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground dark:text-white/65">
              La recherche est connectee a l'ensemble du catalogue, aux categories, aux pages marques et aux promotions pour offrir un parcours coherent dans toute la boutique.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { label: "Marques", value: catalogLoading ? "..." : brandOptions.length, icon: Tag },
              { label: "Categories", value: catalogLoading ? "..." : categoryOptions.length, icon: SlidersHorizontal },
              { label: "Resultats", value: isLoading ? "..." : products.length, icon: Search },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-border bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                <item.icon className="h-4 w-4 text-[#E8400C]" />
                <p className="mt-2 text-lg text-foreground dark:text-white" style={{ fontWeight: 700 }}>{item.value}</p>
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground dark:text-white/55" />
            <input
              type="text"
              value={searchInput}
              onChange={(event) => {
                setSearchInput(event.target.value);
                setSearchQuery(event.target.value);
              }}
              placeholder="Rechercher par nom, marque, categorie, reference ou specification..."
              className="w-full rounded-2xl border border-border bg-background py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring dark:border-white/15 dark:bg-[#0C1420] dark:text-white dark:placeholder:text-white/45 dark:focus:ring-[#FF6B35]/35 dark:focus:border-[#FF6B35]/70"
            />
          </div>
          <button
            type="submit"
            className="rounded-2xl bg-[#E8400C] px-6 py-3 text-sm text-white transition-colors hover:bg-[#D73A0A] dark:bg-[#FF6B35] dark:hover:bg-[#FF845E]"
            style={{ fontWeight: 600 }}
          >
            Lancer la recherche
          </button>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          {quickSearches.map((term) => (
            <button
              key={term}
              onClick={() => {
                setSearchInput(term);
                setSearchQuery(term);
                if (isPromotionKeyword(term)) {
                  updateParams({ q: null, promo: "1", sort: "discount_desc" });
                  return;
                }

                updateParams({ q: term, promo: null, sort: "relevance" });
              }}
              className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground dark:border-white/15 dark:text-white/75 dark:hover:bg-white/10 dark:hover:text-white"
            >
              {term}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-[28px] border border-border bg-card p-4 shadow-[0_18px_50px_rgba(15,23,42,0.04)] dark:border-white/10 dark:bg-[#111722] md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">
              {isLoading
                ? "Recherche en cours..."
                : `${products.length} resultat${products.length > 1 ? "s" : ""}${resultsLabel ? ` ${resultsLabel}` : ""}`}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {hasAnyCriteria
                ? "Les resultats se mettent a jour selon les criteres selectionnes."
                : "Utilisez la recherche ou les filtres pour explorer l'ensemble du catalogue."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFiltersOpen((value) => !value)}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm md:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filtres
            </button>
            <button
              onClick={clearAllFilters}
              disabled={!hasAnyCriteria}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RotateCcw className="h-4 w-4" />
              Reinitialiser
            </button>
          </div>
        </div>

        {activeFilterChips.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {activeFilterChips.map((chip) => (
              <button
                key={chip.key}
                onClick={() => updateParams(chip.clear)}
                className="inline-flex items-center gap-2 rounded-full border border-[#FED7AA] bg-[#FFF7ED] px-3 py-1.5 text-xs text-[#C2410C] transition-colors hover:bg-[#FFEDD5] dark:border-white/10 dark:bg-white/5 dark:text-[#FFB089] dark:hover:bg-white/10"
              >
                {chip.label}
                <X className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>
        ) : null}

        <div className="mt-5">
          {catalogLoading ? (
            <SearchFiltersSkeleton />
          ) : (
            <div className={`${filtersOpen ? "grid" : "hidden"} grid-cols-1 gap-3 md:grid lg:grid-cols-6`}>
              <select
                value={category}
                onChange={(event) => updateParams({ category: event.target.value || null })}
                className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
              >
                <option value="">Toutes les categories</option>
                {categoryOptions.map((item) => (
                  <option key={item.slug} value={item.slug}>{item.name}</option>
                ))}
              </select>

              <select
                value={brand}
                onChange={(event) => updateParams({ brand: event.target.value || null })}
                className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
              >
                <option value="">Toutes les marques</option>
                {brandOptions.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>

              <input
                type="number"
                min={0}
                value={priceDraft.min}
                onChange={(event) => setPriceDraft((previous) => ({ ...previous, min: event.target.value }))}
                placeholder="Prix minimum"
                className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
              />

              <input
                type="number"
                min={0}
                value={priceDraft.max}
                onChange={(event) => setPriceDraft((previous) => ({ ...previous, max: event.target.value }))}
                placeholder="Prix maximum"
                className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
              />

              <select
                value={sort}
                onChange={(event) => updateParams({ sort: event.target.value })}
                className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>

              <button
                onClick={applyPriceFilters}
                className="rounded-xl bg-[#E8400C]/10 px-3 py-2.5 text-sm text-[#E8400C] hover:opacity-90 dark:bg-[#FF5722]/15 dark:text-[#FF5722]"
              >
                Appliquer les prix
              </button>
            </div>
          )}
        </div>

        <div className={`${filtersOpen ? "flex" : "hidden"} mt-4 flex-wrap items-center gap-4 md:flex`}>
          <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={inStock}
              onChange={(event) => updateParams({ inStock: event.target.checked ? "1" : null })}
              className="accent-[#E8400C]"
            />
            Produits disponibles uniquement
          </label>

          <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={promo}
              onChange={(event) => updateParams({ promo: event.target.checked ? "1" : null })}
              className="accent-[#E8400C]"
            />
            Produits en promotion
          </label>
        </div>
      </section>

      <section className="mt-6">
        {searchError ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
            {searchError}
          </div>
        ) : isLoading ? (
          <ProductGridSkeleton />
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="rounded-[28px] border border-border bg-card px-6 py-14 text-center shadow-[0_18px_50px_rgba(15,23,42,0.04)]">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl text-foreground" style={{ fontWeight: 600 }}>
              Aucun resultat n'a ete trouve
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Modifiez votre requete, ajustez les filtres ou consultez une categorie ou une marque referencee pour poursuivre votre recherche.
            </p>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-border bg-background p-5 text-left">
                <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">
                  <Tag className="h-3.5 w-3.5" />
                  Marques recommandees
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {brandOptions.slice(0, 6).map((item) => (
                    <button
                      key={item}
                      onClick={() => updateParams({ brand: item, q: null, sort: "newest" })}
                      className="rounded-full border border-border px-3 py-2 text-sm transition-colors hover:bg-muted"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-background p-5 text-left">
                <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">
                  <BadgePercent className="h-3.5 w-3.5" />
                  Categories populaires
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {categoryOptions.slice(0, 6).map((item) => (
                    <Link
                      key={item.slug}
                      to={`/categorie/${item.slug}`}
                      className="rounded-full border border-border px-3 py-2 text-sm transition-colors hover:bg-muted"
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
