import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Truck, Shield, Headphones, Award, ChevronRight, ArrowRight, Timer } from "lucide-react";
import { toast } from "sonner";
import { BRANDS, IMAGES, formatPrice, useStore } from "../data/store";
import { getCatalogCategories, type CatalogCategory } from "../api/categories";
import { getCatalogProducts } from "../api/products";
import { ProductCard } from "../components/ProductCard";
import { Skeleton } from "../components/ui/skeleton";
import type { Product } from "../data/store";

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

export function HomePage() {
  const { addToCart } = useStore();
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState("");
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");

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

  const flashProducts = featuredProducts.filter((product) => product.oldPrice).slice(0, 3);
  const firstCategorySlug = categories[0]?.slug || "refrigerateurs";

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
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)" }}>
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-20 py-16 md:py-24 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 text-white z-10">
            <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-xs mb-4 backdrop-blur">Nouveau catalogue 2026</span>
            <h1 className="text-3xl md:text-5xl mb-4" style={{ fontWeight: 700, lineHeight: 1.15 }}>
              L&apos;electromenager qui
              <br />
              vous <span className="text-[#E8400C]">ressemble</span>
            </h1>
            <p className="text-white/70 mb-8 max-w-lg">
              Decouvrez notre selection premium d&apos;appareils pour votre maison. Livraison gratuite, garantie et
              conseils d&apos;experts.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/categorie/refrigerateurs" className="px-6 py-3 rounded-lg bg-[#E8400C] text-white text-sm hover:opacity-90 transition-opacity inline-flex items-center gap-2">
                Explorer le catalogue <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/blog" className="px-6 py-3 rounded-lg border border-white/20 text-white text-sm hover:bg-white/10 transition-colors">
                Nos conseils d&apos;experts
              </Link>
            </div>
          </div>
          <div className="flex-1 relative">
            <img src={IMAGES.kitchen} alt="Kitchen" className="w-full max-w-lg rounded-2xl shadow-2xl" />
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

      <section className="border-y border-border py-10">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-20">
          <p className="text-center text-xs text-muted-foreground uppercase tracking-widest mb-6">Nos marques partenaires</p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
            {BRANDS.map((brand) => (
              <Link key={brand} to="/marques" className="text-lg text-muted-foreground hover:text-foreground transition-colors" style={{ fontWeight: 600 }}>
                {brand}
              </Link>
            ))}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { img: IMAGES.blog1, tag: "Guide d'achat", title: "Comment choisir son refrigerateur en 2026", time: "5 min" },
            { img: IMAGES.blog2, tag: "Entretien", title: "10 astuces pour entretenir votre lave-linge", time: "3 min" },
            { img: IMAGES.blog3, tag: "Tendances", title: "Electromenager eco-responsable : le guide complet", time: "7 min" },
          ].map((article) => (
            <Link key={article.title} to="/blog" className="group rounded-xl overflow-hidden bg-card border border-border">
              <div className="aspect-[16/10] overflow-hidden">
                <img src={article.img} alt={article.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
              </div>
              <div className="p-5">
                <span className="text-xs text-[#0A84FF] dark:text-[#2997FF]" style={{ fontWeight: 500 }}>{article.tag}</span>
                <h3 className="text-sm mt-1 mb-2 group-hover:text-[#E8400C] transition-colors" style={{ fontWeight: 500 }}>
                  {article.title}
                </h3>
                <p className="text-xs text-muted-foreground">{article.time} de lecture</p>
              </div>
            </Link>
          ))}
        </div>
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
      `}</style>
    </div>
  );
}
