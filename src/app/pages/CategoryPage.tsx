import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router";
import { ChevronRight, SlidersHorizontal, X } from "lucide-react";
import { getCatalogCategories, type CatalogCategory } from "../api/categories";
import { getCatalogProducts } from "../api/products";
import { ProductCard } from "../components/ProductCard";
import { Skeleton } from "../components/ui/skeleton";
import { IMAGES } from "../data/store";
import type { Product } from "../data/store";

function formatSlugAsLabel(slug?: string) {
  if (!slug) return "Catégorie";
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function CategoryPageSkeleton() {
  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-20 py-6">
      <Skeleton className="h-5 w-60 mb-6" />
      <Skeleton className="h-48 md:h-64 rounded-2xl mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-[360px] rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function CategoryPage() {
  const { slug } = useParams();
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortBy, setSortBy] = useState("popularity");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);

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
    if (!slug) {
      setProducts([]);
      setError("Catégorie introuvable.");
      setIsLoading(false);
      return;
    }

    let ignore = false;

    setIsLoading(true);
    setError("");
    setSelectedBrands([]);

    getCatalogProducts(undefined, slug)
      .then((items) => {
        if (ignore) return;
        setProducts(items);
      })
      .catch((requestError) => {
        if (ignore) return;
        setProducts([]);
        setError(requestError instanceof Error ? requestError.message : "Impossible de charger les produits de cette catégorie.");
      })
      .finally(() => {
        if (!ignore) {
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [slug]);

  const category = useMemo(
    () => categories.find((item) => item.slug === slug) || null,
    [categories, slug],
  );

  const availableBrands = useMemo(
    () => Array.from(new Set(products.map((product) => product.brand).filter(Boolean))).sort(),
    [products],
  );

  const sortedProducts = useMemo(() => {
    const list = [...products];

    switch (sortBy) {
      case "price-asc":
        return list.sort((a, b) => a.price - b.price);
      case "price-desc":
        return list.sort((a, b) => b.price - a.price);
      case "newest":
        return list.sort((a, b) => Number(b.id) - Number(a.id));
      case "rating":
        return list.sort((a, b) => b.rating - a.rating);
      default:
        return list.sort((a, b) => b.reviewCount - a.reviewCount);
    }
  }, [products, sortBy]);

  const displayProducts = selectedBrands.length > 0
    ? sortedProducts.filter((product) => selectedBrands.includes(product.brand))
    : sortedProducts;

  const categoryTitle = category?.name || formatSlugAsLabel(slug);
  const categoryCount = category?.count ?? products.length;
  const categoryImage = category?.image || products[0]?.image || IMAGES.store;

  const toggleBrand = (b: string) => setSelectedBrands((prev) => prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]);

  if (isLoading) {
    return <CategoryPageSkeleton />;
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-20 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link to="/" className="hover:text-foreground">Accueil</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground">{categoryTitle}</span>
      </nav>

      {/* Category Hero */}
      <div className="relative h-48 md:h-64 rounded-2xl overflow-hidden mb-8">
        <img src={categoryImage} alt={categoryTitle} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent flex items-center">
          <div className="px-8">
            <h1 className="text-white text-3xl mb-1" style={{ fontWeight: 700 }}>{categoryTitle}</h1>
            <p className="text-white/70 text-sm">{categoryCount} produits</p>
          </div>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Sidebar Filters - Desktop */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-24 space-y-6">
            <div>
              <h3 className="text-sm mb-3" style={{ fontWeight: 600 }}>Prix</h3>
              <input type="range" min="0" max="2000" className="w-full accent-[#E8400C]" />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0 DA</span><span>300 000 DA</span>
              </div>
            </div>
            <div>
              <h3 className="text-sm mb-3" style={{ fontWeight: 600 }}>Marques</h3>
              <div className="space-y-2">
                {availableBrands.map((b) => (
                  <label key={b} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={selectedBrands.includes(b)} onChange={() => toggleBrand(b)} className="rounded accent-[#E8400C]" />
                    {b}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm mb-3" style={{ fontWeight: 600 }}>Classe énergétique</h3>
              <div className="flex flex-wrap gap-2">
                {["A+++", "A++", "A+", "A", "B"].map((e) => (
                  <button key={e} className="px-3 py-1.5 rounded-lg border border-border text-xs hover:bg-muted transition-colors">{e}</button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm mb-3" style={{ fontWeight: 600 }}>Disponibilité</h3>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" className="rounded accent-[#E8400C]" />
                En stock uniquement
              </label>
            </div>
          </div>
        </aside>

        {/* Products */}
        <div className="flex-1">
          {/* Sort & Filter Bar */}
          <div className="flex items-center justify-between mb-6 gap-4">
            <p className="text-sm text-muted-foreground">
              Affichage de <span className="text-foreground" style={{ fontWeight: 500 }}>{displayProducts.length}</span> sur {categoryCount} produits
            </p>
            <div className="flex items-center gap-3">
              <button onClick={() => setFiltersOpen(true)} className="lg:hidden flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm">
                <SlidersHorizontal className="w-4 h-4" /> Filtres
              </button>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 rounded-lg border border-border text-sm bg-card"
              >
                <option value="popularity">Popularité</option>
                <option value="price-asc">Prix croissant</option>
                <option value="price-desc">Prix décroissant</option>
                <option value="newest">Nouveautés</option>
                <option value="rating">Meilleures notes</option>
              </select>
            </div>
          </div>

          {error ? (
            <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
              {error}
            </div>
          ) : displayProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
              Aucun produit disponible pour cette catégorie.
            </div>
          )}

          {/* Pagination */}
          {displayProducts.length > 0 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} className={`w-10 h-10 rounded-lg text-sm transition-colors ${n === 1 ? "bg-[#E8400C] text-white" : "border border-border hover:bg-muted"}`}>
                  {n}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {filtersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setFiltersOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-card p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 style={{ fontWeight: 600 }}>Filtres</h3>
              <button onClick={() => setFiltersOpen(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-6">
              <div>
                <h4 className="text-sm mb-3" style={{ fontWeight: 600 }}>Marques</h4>
                {availableBrands.map((b) => (
                  <label key={b} className="flex items-center gap-2 text-sm cursor-pointer py-1">
                    <input type="checkbox" checked={selectedBrands.includes(b)} onChange={() => toggleBrand(b)} className="accent-[#E8400C]" />
                    {b}
                  </label>
                ))}
              </div>
            </div>
            <button onClick={() => setFiltersOpen(false)} className="w-full mt-8 px-4 py-3 rounded-lg bg-[#E8400C] text-white text-sm">
              Appliquer les filtres
            </button>
          </div>
        </div>
      )}
    </div>
  );
}