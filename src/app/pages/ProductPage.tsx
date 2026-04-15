import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { ChevronRight, Star, Heart, Share2, Truck, Shield, Minus, Plus, ShoppingCart, Zap, ThumbsUp, Flag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ProductCard } from "../components/ProductCard";
import { getCatalogProduct, getCatalogProducts } from "../api/products";
import {
  createMyReview,
  deleteMyReview,
  getMyReviews,
  getProductReviews,
  markReviewHelpful,
  reportReview,
  updateMyReview,
  type MyReview,
  type ProductReview,
  type ProductReviewsMeta,
  type ReviewStatus,
} from "../api/reviews";
import { PRODUCTS, formatPrice, useStore } from "../data/store";
import { useAuth } from "../context/AuthContext";
import { Skeleton } from "../components/ui/skeleton";
import type { Product } from "../data/store";
import { getPromotionDiscountPercent, hasActivePromotion } from "../lib/promotions";

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

const STATUS_LABELS: Record<ReviewStatus, string> = {
  approved: "Approuve",
  pending: "En attente",
  rejected: "Rejete",
  flagged: "Signale",
};

export function ProductPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role?.name === "admin" || user?.is_admin;
  const staticProduct = PRODUCTS.find((product) => product.slug === slug || product.id === slug) || null;
  const { addToCart, favorites, toggleFavorite } = useStore();
  const [remoteProduct, setRemoteProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(!staticProduct);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [selectedImage, setSelectedImage] = useState(0);

  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [reviewsMeta, setReviewsMeta] = useState<ProductReviewsMeta | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewSort, setReviewSort] = useState<"newest" | "oldest" | "rating_desc" | "rating_asc" | "helpful">("newest");

  const [myReview, setMyReview] = useState<MyReview | null>(null);
  const [myReviewLoading, setMyReviewLoading] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewActionLoadingId, setReviewActionLoadingId] = useState<number | null>(null);

  useEffect(() => {
    setQuantity(1);
    setSelectedImage(0);
    setReviewsPage(1);
    setReviewSort("newest");
    setReviews([]);
    setReviewsMeta(null);
    setMyReview(null);
    setReviewRating(5);
    setReviewTitle("");
    setReviewComment("");
    setShowReviewForm(false);
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
  const availableStock = typeof product?.stock === "number" ? Math.max(0, Math.floor(product.stock)) : null;
  const isOutOfStock = availableStock !== null && availableStock <= 0;
  const isAddDisabled = isOutOfStock || isAdmin;
  const reviewProductKey = product?.slug || product?.id || slug || "";
  const reviewProductId = Number(product?.id ?? 0);

  useEffect(() => {
    if (availableStock === null || availableStock <= 0) {
      setQuantity(1);
      return;
    }

    setQuantity((currentQuantity) => Math.min(currentQuantity, availableStock));
  }, [availableStock, product?.id]);

  const syncProductReviews = async (targetPage = reviewsPage) => {
    const result = await getProductReviews(String(reviewProductKey), {
      page: targetPage,
      perPage: 5,
      sort: reviewSort,
    });

    setReviews(result.data);
    setReviewsMeta(result.meta);
  };

  const syncMyReview = async () => {
    if (!user || isAdmin || !Number.isInteger(reviewProductId) || reviewProductId <= 0) {
      setMyReview(null);
      return;
    }

    const result = await getMyReviews({
      productId: reviewProductId,
      perPage: 1,
    });

    const ownReview = result.data[0] || null;
    setMyReview(ownReview);

    if (ownReview) {
      setReviewRating(ownReview.rating);
      setReviewTitle(ownReview.title || "");
      setReviewComment(ownReview.comment || "");
      return;
    }

    setReviewRating(5);
    setReviewTitle("");
    setReviewComment("");
  };

  useEffect(() => {
    if (activeTab !== "reviews") {
      return;
    }

    let ignore = false;

    setReviewsLoading(true);

    syncProductReviews(reviewsPage)
      .catch(() => {
        if (!ignore) {
          setReviews([]);
          setReviewsMeta(null);
          toast.error("Impossible de charger les avis pour ce produit.");
        }
      })
      .finally(() => {
        if (!ignore) {
          setReviewsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [activeTab, reviewProductKey, reviewsPage, reviewSort]);

  useEffect(() => {
    if (activeTab !== "reviews") {
      return;
    }

    let ignore = false;

    if (!user || isAdmin || !Number.isInteger(reviewProductId) || reviewProductId <= 0) {
      setMyReview(null);
      return;
    }

    setMyReviewLoading(true);

    syncMyReview()
      .catch(() => {
        if (!ignore) {
          setMyReview(null);
        }
      })
      .finally(() => {
        if (!ignore) {
          setMyReviewLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [activeTab, reviewProductId, user?.id, isAdmin]);

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
  const hasPromotion = hasActivePromotion(product);
  const discount = getPromotionDiscountPercent(product);
  const productImages = product.images?.length ? product.images : [product.image];
  const currentImage = productImages[selectedImage] || product.image;
  const specsList = product.specs.split(", ").filter(Boolean);
  const displayedRelatedProducts = relatedProducts.filter((item) => item.id !== product.id).slice(0, 4);
  const maxQuantityReached = availableStock !== null && availableStock > 0 && quantity >= availableStock;

  const handleAddToCart = () => {
    const result = addToCart(product, quantity);

    if (result.reason === "out_of_stock") {
      toast.error("Ce produit est actuellement hors stock.");
      return false;
    }

    if (result.reason === "max_stock_reached") {
      toast.info(`Quantite ajustee au stock disponible : ${result.quantity}.`);
      return true;
    }

    toast.success(quantity > 1 ? `${quantity} articles ajoutes au panier.` : "Produit ajoute au panier.");
    return true;
  };

  const handleBuyNow = () => {
    if (handleAddToCart()) {
      navigate("/commande");
    }
  };

  const handleSubmitReview = async () => {
    if (!user) {
      toast.error("Connectez-vous pour laisser un avis.");
      return;
    }

    if (isAdmin) {
      toast.error("Les comptes admin ne peuvent pas laisser d'avis client.");
      return;
    }

    if (!Number.isInteger(reviewProductId) || reviewProductId <= 0) {
      toast.error("Produit invalide pour la publication d'avis.");
      return;
    }

    const cleanComment = reviewComment.trim();
    if (cleanComment.length < 5) {
      toast.error("Le commentaire doit contenir au moins 5 caracteres.");
      return;
    }

    setReviewSubmitting(true);

    try {
      if (myReview) {
        await updateMyReview(myReview.id, {
          rating: reviewRating,
          title: reviewTitle.trim() || undefined,
          comment: cleanComment,
        });
        toast.success("Votre avis a ete mis a jour.");
      } else {
        await createMyReview({
          product_id: reviewProductId,
          rating: reviewRating,
          title: reviewTitle.trim() || undefined,
          comment: cleanComment,
        });
        toast.success("Votre avis a ete envoye pour moderation.");
      }

      setReviewsPage(1);
      await Promise.all([syncProductReviews(1), syncMyReview()]);
    } catch (requestError: any) {
      toast.error(requestError?.message || "Impossible de publier votre avis.");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleDeleteMyReview = async () => {
    if (!myReview) return;

    const confirmed = window.confirm("Voulez-vous supprimer votre avis ?");
    if (!confirmed) return;

    setReviewSubmitting(true);

    try {
      await deleteMyReview(myReview.id);
      toast.success("Votre avis a ete supprime.");
      setReviewsPage(1);
      await Promise.all([syncProductReviews(1), syncMyReview()]);
    } catch (requestError: any) {
      toast.error(requestError?.message || "Impossible de supprimer votre avis.");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleHelpful = async (reviewId: number) => {
    if (!user) {
      toast.error("Connectez-vous pour voter.");
      return;
    }

    setReviewActionLoadingId(reviewId);

    try {
      await markReviewHelpful(reviewId);
      await syncProductReviews(reviewsPage);
    } catch (requestError: any) {
      toast.error(requestError?.message || "Impossible d'enregistrer ce vote.");
    } finally {
      setReviewActionLoadingId(null);
    }
  };

  const handleReport = async (reviewId: number) => {
    if (!user) {
      toast.error("Connectez-vous pour signaler un avis.");
      return;
    }

    setReviewActionLoadingId(reviewId);

    try {
      const result = await reportReview(reviewId);
      if (result.autoFlagged) {
        toast.success("Signalement enregistre. Cet avis sera examine par un administrateur.");
      }
      await syncProductReviews(reviewsPage);
    } catch (requestError: any) {
      toast.error(requestError?.message || "Impossible de signaler cet avis.");
    } finally {
      setReviewActionLoadingId(null);
    }
  };

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
            {hasPromotion && product.oldPrice && (
              <>
                <span className="text-lg text-muted-foreground line-through">{formatPrice(product.oldPrice)}</span>
                <span className="px-2 py-0.5 rounded bg-[#E8400C] text-white text-xs" style={{ fontWeight: 600 }}>
                  -{discount}%
                </span>
              </>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Prix TTC, livraison non incluse</p>

          {availableStock !== null && (
            <div className={`inline-flex rounded-full px-3 py-1 text-xs ${isOutOfStock ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>
              {isOutOfStock ? "Produit hors stock" : `Stock disponible : ${availableStock}`}
            </div>
          )}

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
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={isAddDisabled || maxQuantityReached}
                  className="w-10 h-10 flex items-center justify-center hover:bg-muted disabled:opacity-40"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleAddToCart}
                disabled={isAddDisabled}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-[#E8400C] dark:bg-[#FF5722] text-white hover:opacity-90 transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ShoppingCart className="w-4.5 h-4.5" />
                {isAdmin ? "Achat non autorisé (Admin)" : (isOutOfStock ? "Hors stock" : "Ajouter au panier")}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={isAddDisabled}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg border-2 border-primary text-foreground hover:bg-muted transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Zap className="w-4.5 h-4.5" />
                {isAdmin ? "Mode Administrateur" : "Acheter maintenant"}
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
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl border border-border bg-card">
                  <p className="text-xs text-muted-foreground mb-1">Note moyenne</p>
                  <p className="text-lg" style={{ fontWeight: 700 }}>
                    {(reviewsMeta?.average_rating ?? 0).toFixed(1)} / 5
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-border bg-card">
                  <p className="text-xs text-muted-foreground mb-1">Nombre d'avis</p>
                  <p className="text-lg" style={{ fontWeight: 700 }}>{reviewsMeta?.review_count ?? 0}</p>
                </div>
                <div className="p-4 rounded-xl border border-border bg-card">
                  <p className="text-xs text-muted-foreground mb-1">Avis 5 etoiles</p>
                  <p className="text-lg" style={{ fontWeight: 700 }}>{reviewsMeta?.rating_distribution?.["5"] ?? 0}</p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 rounded-xl border border-border bg-card">
                <p className="text-sm text-muted-foreground">
                  {reviewsMeta?.total ?? 0} avis affiches
                </p>
                <select
                  value={reviewSort}
                  onChange={(e) => {
                    setReviewSort(e.target.value as "newest" | "oldest" | "rating_desc" | "rating_asc" | "helpful");
                    setReviewsPage(1);
                  }}
                  className="px-3 py-2 rounded-lg border border-border bg-card text-sm"
                >
                  <option value="newest">Plus recents</option>
                  <option value="oldest">Plus anciens</option>
                  <option value="rating_desc">Meilleures notes</option>
                  <option value="rating_asc">Notes les plus basses</option>
                  <option value="helpful">Les plus utiles</option>
                </select>
              </div>

              {!isAdmin && (
                <div className="space-y-3">
                  <button
                    onClick={() => setShowReviewForm((prev) => !prev)}
                    aria-expanded={showReviewForm}
                    aria-controls="review-form-panel"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted"
                    style={{ fontWeight: 600 }}
                  >
                    <ChevronRight
                      className={`w-4 h-4 transition-transform duration-300 ${showReviewForm ? "rotate-90" : "rotate-0"}`}
                    />
                    <span>
                      {showReviewForm
                        ? "Fermer la carte de saisie"
                        : myReview
                          ? "Ouvrir la carte de modification"
                          : "Ouvrir la carte de saisie d'avis"}
                    </span>
                  </button>

                  <div
                    id="review-form-panel"
                    aria-hidden={!showReviewForm}
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      showReviewForm
                        ? "max-h-[1200px] opacity-100 translate-y-0"
                        : "max-h-0 opacity-0 -translate-y-1 pointer-events-none"
                    }`}
                  >
                    <div className="mt-1 p-4 rounded-xl border border-border bg-card space-y-4">
                      <h3 className="text-sm" style={{ fontWeight: 600 }}>
                        {myReview ? "Modifier mon avis" : "Laisser un avis"}
                      </h3>

                      {!user && (
                        <p className="text-sm text-muted-foreground">Connectez-vous pour publier un avis.</p>
                      )}

                      {user && myReview && (
                        <div className="text-xs text-muted-foreground">
                          Statut de votre avis: <span style={{ fontWeight: 600 }}>{STATUS_LABELS[myReview.status]}</span>
                        </div>
                      )}

                      {user && myReviewLoading && (
                        <p className="text-sm text-muted-foreground">Chargement de votre avis...</p>
                      )}

                      {user && !myReviewLoading && (
                        <>
                          <div>
                            <label className="text-sm mb-1 block">Note</label>
                            <select
                              value={reviewRating}
                              onChange={(e) => setReviewRating(Number(e.target.value))}
                              className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm"
                            >
                              {[5, 4, 3, 2, 1].map((note) => (
                                <option key={note} value={note}>{note} etoile{note > 1 ? "s" : ""}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="text-sm mb-1 block">Titre</label>
                            <input
                              value={reviewTitle}
                              onChange={(e) => setReviewTitle(e.target.value)}
                              maxLength={120}
                              className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm"
                              placeholder="Resumez votre experience"
                            />
                          </div>

                          <div>
                            <label className="text-sm mb-1 block">Commentaire</label>
                            <textarea
                              value={reviewComment}
                              onChange={(e) => setReviewComment(e.target.value)}
                              rows={4}
                              className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm resize-none"
                              placeholder="Partagez votre avis sur ce produit"
                            />
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={handleSubmitReview}
                              disabled={reviewSubmitting}
                              className="px-4 py-2 rounded-lg bg-[#E8400C] text-white text-sm hover:opacity-90 disabled:opacity-60"
                            >
                              {reviewSubmitting ? "Envoi..." : myReview ? "Mettre a jour" : "Publier"}
                            </button>

                            {myReview && (
                              <button
                                onClick={handleDeleteMyReview}
                                disabled={reviewSubmitting}
                                className="px-4 py-2 rounded-lg border border-destructive text-destructive text-sm hover:bg-destructive/10 disabled:opacity-60 inline-flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" /> Supprimer
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {reviewsLoading ? (
                  <div className="p-4 rounded-xl border border-border text-sm text-muted-foreground">
                    Chargement des avis...
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="p-4 rounded-xl border border-border text-sm text-muted-foreground">
                    Aucun avis approuve pour ce produit pour le moment.
                  </div>
                ) : (
                  reviews.map((review) => (
                    <article key={review.id} className="p-4 rounded-xl border border-border bg-card space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm" style={{ fontWeight: 600 }}>{review.client.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {review.createdAt ? new Date(review.createdAt).toLocaleDateString("fr-DZ", { day: "2-digit", month: "short", year: "numeric" }) : "-"}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, index) => (
                            <Star
                              key={index}
                              className={`w-4 h-4 ${index < review.rating ? "fill-[#FFD60A] text-[#FFD60A]" : "text-border"}`}
                            />
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm" style={{ fontWeight: 600 }}>{review.title || "Avis client"}</p>
                        <p className="text-sm text-muted-foreground mt-1">{review.comment || "-"}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><ThumbsUp className="w-3.5 h-3.5" /> {review.helpful} utile(s)</span>
                        <span className="inline-flex items-center gap-1"><Flag className="w-3.5 h-3.5" /> {review.reported} signalement(s)</span>
                        {review.isVerified && <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">Achat verifie</span>}
                      </div>

                      {user && !isAdmin && review.client.id !== user.id && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleHelpful(review.id)}
                            disabled={reviewActionLoadingId === review.id}
                            className="px-3 py-1.5 rounded-lg border border-border text-xs hover:bg-muted disabled:opacity-60"
                          >
                            Utile
                          </button>
                          <button
                            onClick={() => handleReport(review.id)}
                            disabled={reviewActionLoadingId === review.id}
                            className="px-3 py-1.5 rounded-lg border border-border text-xs hover:bg-muted disabled:opacity-60"
                          >
                            Signaler
                          </button>
                        </div>
                      )}
                    </article>
                  ))
                )}
              </div>

              {(reviewsMeta?.last_page || 1) > 1 && (
                <div className="flex items-center justify-between gap-3 p-4 rounded-xl border border-border bg-card">
                  <button
                    onClick={() => setReviewsPage((prev) => Math.max(1, prev - 1))}
                    disabled={reviewsPage === 1}
                    className="px-3 py-1.5 rounded-lg border border-border text-sm disabled:opacity-40"
                  >
                    Precedent
                  </button>
                  <p className="text-sm text-muted-foreground">
                    Page {reviewsMeta?.current_page || 1} / {reviewsMeta?.last_page || 1}
                  </p>
                  <button
                    onClick={() => setReviewsPage((prev) => Math.min(reviewsMeta?.last_page || 1, prev + 1))}
                    disabled={reviewsPage >= (reviewsMeta?.last_page || 1)}
                    className="px-3 py-1.5 rounded-lg border border-border text-sm disabled:opacity-40"
                  >
                    Suivant
                  </button>
                </div>
              )}
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
