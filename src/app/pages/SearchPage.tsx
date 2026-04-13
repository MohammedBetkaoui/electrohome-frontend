import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router";
import { Search, SlidersHorizontal, RotateCcw } from "lucide-react";
import { getCatalogCategories, type CatalogCategory } from "../api/categories";
import { getCatalogProducts, type CatalogProductsSort } from "../api/products";
import { CATEGORIES } from "../data/store";
import { ProductCard } from "../components/ProductCard";
import { Skeleton } from "../components/ui/skeleton";
import type { Product } from "../data/store";

const QUICK_SEARCHES = ["Samsung", "Refrigerateur", "Climatiseur", "Lave-vaisselle", "Promo"];

const SORT_OPTIONS: Array<{ value: CatalogProductsSort; label:string }> = [
  { value: "relevance", label: "Pertinence" },
  { value: "newest", label: "Nouveautes" },
  { value: "price_asc", label: "Prix croissant" },
  { value: "price_desc", label: "Prix decroissant" },
  { value: "discount_desc", label: "Meilleures promos" },
  { value: "name_asc", label: "Nom (A-Z)" },
];

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <Skeleton key={index} className="h-[330px] rounded-xl" />
      ))}
    </div>
  );
}

export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(params.get("q") || "");
  const [priceDraft, setPriceDraft] = useState({
    min: params.get("minPrice") || "",
    max: params.get("maxPrice") || "",
  });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchError, setSearchError] = useState("");

  const q = (params.get("q") || "").trim();
  const category = params.get("category") || "";
  const brand = params.get("brand") || "";
  const minPrice = params.get("minPrice") || "";
  const maxPrice = params.get("maxPrice") || "";
  const inStock = params.get("inStock") === "1";
  const promo = params.get("promo") === "1";
  const sort = (params.get("sort") as CatalogProductsSort | null) || (q ? "relevance" : "newest");

  const categoryOptions = categories.length > 0
    ? categories.map((item) => ({ slug: item.slug, name: item.name }))
    : CATEGORIES.map((item) => ({ slug: item.slug, name: item.name }));

  const brandOptions = useMemo(() => {
    const options = new Set(products.map((item) => item.brand).filter(Boolean));

    if (brand) {
      options.add(brand);
    }

    return Array.from(options).sort((a, b) => a.localeCompare(b));
  }, [products, brand]);

  const hasAdvancedFilters = Boolean(category || brand || minPrice || maxPrice || inStock || promo);

  const updateParams = (updates: Record<string, string | null>) => {
    setParams((previous) => {
      const next = new URLSearchParams(previous);

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "") {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      });

      if (!next.get("sort")) {
        next.set("sort", next.get("q") ? "relevance" : "newest");
      }

      return next;
    });
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextQuery = searchInput.trim();
    updateParams({
      q: nextQuery || null,
      sort: nextQuery ? "relevance" : "newest",
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

  const clearAdvancedFilters = () => {
    setPriceDraft({ min: "", max: "" });
    updateParams({
      category: null,
      brand: null,
      minPrice: null,
      maxPrice: null,
      inStock: null,
      promo: null,
      sort: q ? "relevance" : "newest",
    });
  };

  useEffect(() => {
    setSearchInput(params.get("q") || "");
    setPriceDraft({
      min: params.get("minPrice") || "",
      max: params.get("maxPrice") || "",
    });
  }, [params]);

  useEffect(() => {
    let ignore = false;

    getCatalogCategories()
      .then((data) => {
        if (!ignore) {
          setCategories(data);
        }
      })
      .catch(() => {
        if (!ignore) {
          setCategories([]);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    const minPriceValue = minPrice.trim() === "" ? undefined : Number(minPrice);
    const maxPriceValue = maxPrice.trim() === "" ? undefined : Number(maxPrice);

    setIsLoading(true);
    setSearchError("");

    getCatalogProducts({
      limit: 120,
      q: q || undefined,
      categorySlug: category || undefined,
      brand: brand || undefined,
      minPrice: typeof minPriceValue === "number" && Number.isFinite(minPriceValue) ? minPriceValue : undefined,
      maxPrice: typeof maxPriceValue === "number" && Number.isFinite(maxPriceValue) ? maxPriceValue : undefined,
      inStock: inStock ? true : undefined,
      hasDiscount: promo ? true : undefined,
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
  }, [q, category, brand, minPrice, maxPrice, inStock, promo, sort]);

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-20 py-8">
      <div className="rounded-2xl border border-border bg-card p-4 md:p-5 mb-6 dark:bg-[#111722] dark:border-white/10">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground dark:text-white/55" />
            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Rechercher par nom, marque, categorie, specification..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring dark:bg-[#0C1420] dark:border-white/15 dark:text-white dark:placeholder:text-white/45 dark:focus:ring-[#FF6B35]/35 dark:focus:border-[#FF6B35]/70"
            />
          </div>
          <button type="submit" className="px-5 py-3 rounded-xl bg-[#E8400C] text-white text-sm transition-colors hover:bg-[#D73A0A] dark:bg-[#FF6B35] dark:hover:bg-[#FF845E]">
            Rechercher
          </button>
        </form>

        <div className="flex flex-wrap gap-2 mt-3">
          {QUICK_SEARCHES.map((term) => (
            <button
              key={term}
              onClick={() => {
                setSearchInput(term);
                updateParams({ q: term, sort: "relevance" });
              }}
              className="px-3 py-1.5 rounded-full border border-border text-xs text-muted-foreground transition-colors hover:text-foreground hover:bg-muted dark:border-white/15 dark:text-white/75 dark:hover:text-white dark:hover:bg-white/10"
            >
              {term}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 md:p-5 mb-6">
        <div className="flex items-center justify-between mb-4 gap-2">
          <button
            onClick={() => setFiltersOpen((value) => !value)}
            className="md:hidden inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm"
          >
            <SlidersHorizontal className="w-4 h-4" /> Filtres
          </button>
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? "Recherche en cours..."
              : `${products.length} resultat${products.length > 1 ? "s" : ""}${q ? ` pour \"${q}\"` : ""}`}
          </p>
          <button
            onClick={clearAdvancedFilters}
            disabled={!hasAdvancedFilters}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-4 h-4" /> Reinitialiser
          </button>
        </div>

        <div className={`${filtersOpen ? "grid" : "hidden"} md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3`}>
          <select
            value={category}
            onChange={(event) => updateParams({ category: event.target.value || null })}
            className="px-3 py-2.5 rounded-lg border border-border bg-background text-sm"
          >
            <option value="">Toutes les categories</option>
            {categoryOptions.map((item) => (
              <option key={item.slug} value={item.slug}>{item.name}</option>
            ))}
          </select>

          <select
            value={brand}
            onChange={(event) => updateParams({ brand: event.target.value || null })}
            className="px-3 py-2.5 rounded-lg border border-border bg-background text-sm"
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
            onChange={(event) => setPriceDraft((prev) => ({ ...prev, min: event.target.value }))}
            placeholder="Prix min"
            className="px-3 py-2.5 rounded-lg border border-border bg-background text-sm"
          />

          <input
            type="number"
            min={0}
            value={priceDraft.max}
            onChange={(event) => setPriceDraft((prev) => ({ ...prev, max: event.target.value }))}
            placeholder="Prix max"
            className="px-3 py-2.5 rounded-lg border border-border bg-background text-sm"
          />

          <select
            value={sort}
            onChange={(event) => updateParams({ sort: event.target.value })}
            className="px-3 py-2.5 rounded-lg border border-border bg-background text-sm"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          <button
            onClick={applyPriceFilters}
            className="px-3 py-2.5 rounded-lg bg-[#E8400C]/10 text-[#E8400C] dark:bg-[#FF5722]/15 dark:text-[#FF5722] text-sm hover:opacity-90"
          >
            Appliquer prix
          </button>
        </div>

        <div className={`${filtersOpen ? "flex" : "hidden"} md:flex items-center gap-4 mt-3 flex-wrap`}>
          <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={inStock}
              onChange={(event) => updateParams({ inStock: event.target.checked ? "1" : null })}
              className="accent-[#E8400C]"
            />
            En stock uniquement
          </label>

          <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={promo}
              onChange={(event) => updateParams({ promo: event.target.checked ? "1" : null })}
              className="accent-[#E8400C]"
            />
            Promotions uniquement
          </label>
        </div>
      </div>

      {searchError ? (
        <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          {searchError}
        </div>
      ) : isLoading ? (
        <ProductGridSkeleton />
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center mb-6">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl mb-2" style={{ fontWeight: 600 }}>Aucun resultat trouve</h2>
          <p className="text-muted-foreground mb-8">
            Affinez votre requete, ajustez les filtres, ou explorez nos categories populaires.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {categoryOptions.slice(0, 6).map((item) => (
              <Link
                key={item.slug}
                to={`/categorie/${item.slug}`}
                className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
