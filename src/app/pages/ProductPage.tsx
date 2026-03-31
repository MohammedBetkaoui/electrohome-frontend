import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { ChevronRight, Star, Heart, Share2, Truck, Shield, Minus, Plus, ShoppingCart, Zap } from "lucide-react";
import { ProductCard } from "../components/ProductCard";
import { getCatalogProduct, getCatalogProducts } from "../api/products";
import { PRODUCTS, formatPrice, useStore } from "../data/store";
import { Skeleton } from "../components/ui/skeleton";
import type { Product } from "../data/store";

function ProductPageSkeleton() {
  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-20 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 mb-16">
        <div className="space-y-4">
          <Skeleton className="aspect-square w-full rounded-2xl" />
          <div className="flex gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="w-20 h-20 rounded-lg" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function ProductPage() {
  const { slug } = useParams();
  const staticProduct = PRODUCTS.find((product) => product.slug === slug || product.id === slug) || null;
  const { addToCart, favorites, toggleFavorite } = useStore();
  const [remoteProduct, setRemoteProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(!staticProduct);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    setQuantity(1);
    setSelectedImage(0);
  }, [slug]);

  useEffect(() => {
    if (!slug) {
      setRemoteProduct(null);
      setRelatedProducts([]);
      setLoading(false);
      setError("Produit introuvable.");
      return;
    }

    if (staticProduct) {
      setRemoteProduct(null);
      setRelatedProducts(PRODUCTS.filter((product) => product.id !== staticProduct.id).slice(0, 4));
      setLoading(false);
      setError("");
      return;
    }

    let ignore = false;

    setLoading(true);
    setError("");

    getCatalogProduct(slug)
      .then(async (product) => {
        if (ignore) return;

        setRemoteProduct(product);

        try {
          const products = await getCatalogProducts(8);
          if (!ignore) {
            setRelatedProducts(products.filter((item) => item.id !== product.id).slice(0, 4));
          }
        } catch {
          if (!ignore) {
            setRelatedProducts([]);
          }
        }
      })
      .catch((requestError) => {
        if (ignore) return;
        setRemoteProduct(null);
        setRelatedProducts([]);
        setError(requestError instanceof Error ? requestError.message : "Impossible de charger le produit.");
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [slug, staticProduct]);

  const product = staticProduct || remoteProduct;

  if (loading) {
    return <ProductPageSkeleton />;
  }

  if (!product) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-20 py-16">
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <h1 className="text-2xl mb-3" style={{ fontWeight: 700 }}>Produit introuvable</h1>
          <p className="text-sm text-muted-foreground mb-6">{error || "Le produit demande n'est pas disponible."}</p>
          <Link to="/" className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-[#E8400C] text-white text-sm">
            Retour a l'accueil
          </Link>
        </div>
      </div>
    );
  }

  const isFav = favorites.includes(product.id);
  const discount = product.oldPrice ? Math.round((1 - product.price / product.oldPrice) * 100) : 0;
  const productImages = product.images?.length ? product.images : [product.image];
  const currentImage = productImages[selectedImage] || product.image;
  const specsList = product.specs.split(", ").filter(Boolean);
  const displayedRelatedProducts = relatedProducts.filter((item) => item.id !== product.id).slice(0, 4);

  const tabs = [
    { id: "description", label: "Description" },
    { id: "specs", label: "Caracteristiques" },
    { id: "reviews", label: "Avis clients" },
    { id: "qa", label: "Questions/Reponses" },
  ];

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-20 py-6">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6 flex-wrap">
        <Link to="/" className="hover:text-foreground">Accueil</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to={`/categorie/${product.category}`} className="hover:text-foreground capitalize">
          {product.category.replace(/-/g, " ")}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 mb-16">
        <div>
          <div className="aspect-square rounded-2xl overflow-hidden bg-muted mb-4">
            <img src={currentImage} alt={product.name} className="w-full h-full object-cover" />
          </div>
          <div className="flex gap-3 flex-wrap">
            {productImages.map((image, index) => (
              <button
                key={`${image}-${index}`}
                onClick={() => setSelectedImage(index)}
                className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${index === selectedImage ? "border-[#E8400C]" : "border-border"}`}
              >
                <img src={image} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-sm text-[#0A84FF] dark:text-[#2997FF] mb-1" style={{ fontWeight: 500 }}>{product.brand}</p>
            <h1 className="text-2xl md:text-3xl mb-3" style={{ fontWeight: 700 }}>{product.name}</h1>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} className={`w-4 h-4 ${index < Math.round(product.rating) ? "fill-[#FFD60A] text-[#FFD60A]" : "text-border"}`} />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {product.reviewCount > 0 ? `${product.rating} (${product.reviewCount} avis)` : "Aucun avis pour le moment"}
              </span>
            </div>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl text-foreground" style={{ fontWeight: 700 }}>{formatPrice(product.price)}</span>
            {product.oldPrice && (
              <>
                <span className="text-lg text-muted-foreground line-through">{formatPrice(product.oldPrice)}</span>
                <span className="px-2 py-0.5 rounded bg-[#E8400C] text-white text-xs" style={{ fontWeight: 600 }}>
                  -{discount}%
                </span>
              </>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Prix TTC, livraison non incluse</p>

          <div className="flex flex-wrap gap-2">
            {specsList.map((spec) => (
              <span key={spec} className="px-3 py-1.5 rounded-lg bg-muted text-xs font-mono">{spec}</span>
            ))}
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-sm" style={{ fontWeight: 500 }}>Quantite</span>
              <div className="flex items-center border border-border rounded-lg">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 flex items-center justify-center hover:bg-muted">
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center text-sm">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 flex items-center justify-center hover:bg-muted">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  for (let index = 0; index < quantity; index += 1) {
                    addToCart(product);
                  }
                }}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-[#E8400C] dark:bg-[#FF5722] text-white hover:opacity-90 transition-opacity"
              >
                <ShoppingCart className="w-4.5 h-4.5" />
                Ajouter au panier
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg border-2 border-primary text-foreground hover:bg-muted transition-colors">
                <Zap className="w-4.5 h-4.5" />
                Acheter maintenant
              </button>
            </div>
            <div className="flex gap-4">
              <button onClick={() => toggleFavorite(product.id)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                <Heart className={`w-4 h-4 ${isFav ? "fill-[#E8400C] text-[#E8400C]" : ""}`} />
                {isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
              </button>
              <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                <Share2 className="w-4 h-4" /> Partager
              </button>
            </div>
          </div>

          <div className="space-y-3 p-4 rounded-xl bg-muted/50 border border-border">
            <div className="flex items-center gap-3">
              <Truck className="w-5 h-5 text-[#22C55E]" />
              <div>
                <p className="text-sm" style={{ fontWeight: 500 }}>Livraison gratuite</p>
                <p className="text-xs text-muted-foreground">Livraison estimee sous 2 a 4 jours</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-[#0A84FF]" />
              <div>
                <p className="text-sm" style={{ fontWeight: 500 }}>Garantie constructeur</p>
                <p className="text-xs text-muted-foreground">Extension de garantie disponible</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-16">
        <div className="flex border-b border-border mb-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.id ? "border-[#E8400C] text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              style={{ fontWeight: activeTab === tab.id ? 600 : 400 }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="max-w-3xl">
          {activeTab === "description" && (
            <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
              <p>{product.description || `Le produit ${product.name} de ${product.brand} est disponible dans notre catalogue.`}</p>
              {!product.description && (
                <p>Les informations detaillees seront bientot enrichies pour cette fiche produit.</p>
              )}
            </div>
          )}
          {activeTab === "specs" && (
            <table className="w-full text-sm">
              <tbody>
                {[
                  ["Marque", product.brand],
                  ["Modele", product.name],
                  ["Classe energetique", product.energy],
                  ["Specifications", product.specs],
                  ["Garantie", "2 ans constructeur"],
                ].map(([label, value]) => (
                  <tr key={label} className="border-b border-border">
                    <td className="py-3 text-muted-foreground w-48">{label}</td>
                    <td className="py-3">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {activeTab === "reviews" && (
            <div className="p-4 rounded-xl border border-border text-sm text-muted-foreground">
              Les avis clients ne sont pas encore disponibles pour ce produit.
            </div>
          )}
          {activeTab === "qa" && (
            <div className="p-4 rounded-xl border border-border text-sm text-muted-foreground">
              Les questions et reponses seront bientot affichees ici.
            </div>
          )}
        </div>
      </div>

      {displayedRelatedProducts.length > 0 && (
        <div>
          <h2 className="text-xl mb-6" style={{ fontWeight: 600 }}>Vous aimerez aussi</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {displayedRelatedProducts.map((relatedProduct) => (
              <ProductCard key={relatedProduct.id} product={relatedProduct} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
