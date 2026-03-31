import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  AlertTriangle,
  Headphones,
  Loader2,
  Minus,
  Plus,
  RefreshCw,
  RotateCcw,
  Shield,
  ShoppingBag,
  Trash2,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import { ProductCard } from "../components/ProductCard";
import { ApiError, getCheckoutOptions, previewOrder, type CheckoutOptions, type OrderPreview } from "../api/orders";
import { getCatalogProductsByIds } from "../api/products";
import { PRODUCTS, formatPrice, type Product, useStore } from "../data/store";
import { buildOrderItemsPayload, resolveCartItems } from "../lib/cart";

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    const firstError = error.errors ? Object.values(error.errors)[0]?.[0] : undefined;
    return firstError || error.message || fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

export function CartPage() {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    syncCartProducts,
    clearCart,
    checkoutPromoCode,
    setCheckoutPromoCode,
  } = useStore();
  const [checkoutOptions, setCheckoutOptions] = useState<CheckoutOptions | null>(null);
  const [liveProducts, setLiveProducts] = useState<Product[]>([]);
  const [preview, setPreview] = useState<OrderPreview | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");
  const [promoInput, setPromoInput] = useState(checkoutPromoCode);
  const [promoLoading, setPromoLoading] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState("");
  const [catalogSyncReady, setCatalogSyncReady] = useState(false);
  const [inventoryNotice, setInventoryNotice] = useState("");
  const [refreshSeed, setRefreshSeed] = useState(0);

  const cartIdsKey = useMemo(
    () => Array.from(new Set(cart.map((item) => item.product.id))).join(","),
    [cart],
  );

  const resolvedCartItems = useMemo(
    () => resolveCartItems(
      cart,
      catalogSyncReady ? liveProducts : cart.map((item) => item.product),
    ),
    [cart, liveProducts, catalogSyncReady],
  );

  const itemCount = resolvedCartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = resolvedCartItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const savings = resolvedCartItems.reduce((sum, item) => sum + item.lineSavings, 0);
  const invalidItems = resolvedCartItems.filter((item) => !item.isValid);
  const validItems = resolvedCartItems.filter((item) => item.isValid);
  const cartItemsPayload = useMemo(
    () => buildOrderItemsPayload(validItems.map((item) => ({ id: item.id, quantity: item.quantity }))),
    [validItems],
  );

  const standardDeliveryMethod = useMemo(
    () => checkoutOptions?.delivery_methods.find((method) => method.name === "standard") || checkoutOptions?.delivery_methods[0] || null,
    [checkoutOptions],
  );
  const freeShippingThreshold = checkoutOptions?.delivery_rules.free_threshold || 70000;
  const freeShippingProgress = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));
  const amountUntilFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const fallbackDelivery = subtotal >= freeShippingThreshold
    ? 0
    : checkoutOptions?.delivery_rules.standard_fee || 4000;
  const delivery = preview?.delivery_cost ?? fallbackDelivery;
  const discount = preview?.discount_amount ?? 0;
  const total = preview?.total_ttc ?? subtotal + delivery - discount;
  const canCheckout = invalidItems.length === 0 && !summaryError && validItems.length > 0;
  const upsell = PRODUCTS
    .filter((product) => !cart.find((cartItem) => cartItem.product.id === product.id))
    .slice(0, 4);

  useEffect(() => {
    let ignore = false;

    getCheckoutOptions()
      .then((options) => {
        if (!ignore) {
          setCheckoutOptions(options);
        }
      })
      .catch(() => {
        if (!ignore) {
          setCheckoutOptions(null);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    setPromoInput(checkoutPromoCode);
  }, [checkoutPromoCode]);

  useEffect(() => {
    if (!cartIdsKey) {
      setLiveProducts([]);
      setCatalogLoading(false);
      setCatalogSyncReady(false);
      setCatalogError("");
      setInventoryNotice("");
      return;
    }

    let ignore = false;

    setCatalogLoading(true);
    setCatalogSyncReady(false);

    getCatalogProductsByIds(cart.map((item) => item.product.id))
      .then((products) => {
        if (ignore) return;

        const productMap = new Map(products.map((product) => [product.id, product]));
        const quantityAdjusted = cart.some((item) => {
          const liveProduct = productMap.get(item.product.id);
          return typeof liveProduct?.stock === "number" && liveProduct.stock > 0 && item.quantity > liveProduct.stock;
        });
        const priceUpdated = cart.some((item) => {
          const liveProduct = productMap.get(item.product.id);
          return liveProduct && (
            liveProduct.price !== item.product.price
            || liveProduct.oldPrice !== item.product.oldPrice
          );
        });

        const notices = [
          quantityAdjusted ? "Certaines quantites ont ete ajustees selon le stock disponible." : "",
          priceUpdated ? "Les prix du panier ont ete resynchronises avec le catalogue." : "",
        ].filter(Boolean);

        setInventoryNotice(notices.join(" "));
        setLiveProducts(products);
        syncCartProducts(products);
        setCatalogSyncReady(true);
        setCatalogError("");
      })
      .catch((error) => {
        if (ignore) return;
        setCatalogSyncReady(false);
        setCatalogError(getErrorMessage(error, "Synchronisation temps reel indisponible. Vous pouvez quand meme continuer."));
        setLiveProducts([]);
      })
      .finally(() => {
        if (!ignore) {
          setCatalogLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [cartIdsKey, refreshSeed]);

  useEffect(() => {
    if (cart.length === 0 || !standardDeliveryMethod) {
      setSummaryLoading(false);
      setPreview(null);
      setSummaryError("");
      return;
    }

    if (invalidItems.length > 0) {
      setSummaryLoading(false);
      setPreview(null);
      setSummaryError("Mettez a jour votre panier avant de continuer vers la commande.");
      return;
    }

    let ignore = false;

    setSummaryLoading(true);

    previewOrder({
      delivery_method_id: standardDeliveryMethod.id,
      items: cartItemsPayload,
      promo_code: checkoutPromoCode || undefined,
    })
      .then((nextPreview) => {
        if (ignore) return;
        setPreview(nextPreview);
        setSummaryError("");
      })
      .catch((error) => {
        if (ignore) return;
        setPreview(null);
        setSummaryError(getErrorMessage(error, "Impossible de calculer le total du panier."));
      })
      .finally(() => {
        if (!ignore) {
          setSummaryLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [cart.length, cartItemsPayload, checkoutPromoCode, invalidItems.length, standardDeliveryMethod]);

  const applyPromo = async () => {
    if (!standardDeliveryMethod || validItems.length === 0 || invalidItems.length > 0 || catalogLoading) {
      toast.error("Corrigez votre panier avant d'appliquer un code promo.");
      return;
    }

    const normalizedPromoCode = promoInput.trim().toUpperCase();
    setPromoLoading(true);

    try {
      const nextPreview = await previewOrder({
        delivery_method_id: standardDeliveryMethod.id,
        items: cartItemsPayload,
        promo_code: normalizedPromoCode || undefined,
      });

      setPreview(nextPreview);
      setCheckoutPromoCode(normalizedPromoCode);
      setSummaryError("");
      toast.success(normalizedPromoCode ? "Code promo applique." : "Code promo retire.");
    } catch (error) {
      setCheckoutPromoCode("");
      setPreview(null);
      setSummaryError(getErrorMessage(error, "Impossible d'appliquer le code promo."));
      toast.error(getErrorMessage(error, "Impossible d'appliquer le code promo."));
    } finally {
      setPromoLoading(false);
    }
  };

  const handleQuantityChange = (productId: string, nextQuantity: number) => {
    const result = updateQuantity(productId, nextQuantity);

    if (result.reason === "removed") {
      toast.success("Produit retire du panier.");
      return;
    }

    if (result.reason === "out_of_stock") {
      toast.error("Ce produit est actuellement hors stock.");
      return;
    }

    if (result.reason === "max_stock_reached") {
      toast.info(`Quantite maximale disponible : ${result.quantity}.`);
    }
  };

  const handleRemove = (productId: string) => {
    removeFromCart(productId);
    toast.success("Produit retire du panier.");
  };

  const removeInvalidItems = () => {
    invalidItems.forEach((item) => removeFromCart(item.id));
    toast.success("Les articles indisponibles ont ete retires du panier.");
  };

  const refreshCartCatalog = () => {
    setRefreshSeed((current) => current + 1);
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-20 py-24 text-center">
        <div className="w-24 h-24 mx-auto rounded-full bg-muted flex items-center justify-center mb-6">
          <ShoppingBag className="w-10 h-10 text-muted-foreground" />
        </div>
        <h1 className="text-2xl mb-2" style={{ fontWeight: 600 }}>Votre panier est vide</h1>
        <p className="text-muted-foreground mb-6">Decouvrez notre catalogue et trouvez les appareils parfaits pour votre maison.</p>
        <Link to="/categorie/refrigerateurs" className="inline-flex px-6 py-3 rounded-lg bg-[#E8400C] text-white text-sm hover:opacity-90">
          Explorer le catalogue
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-20 py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-8">
        <div>
          <h1 className="text-2xl mb-2" style={{ fontWeight: 600 }}>
            Mon panier ({itemCount} article{itemCount > 1 ? "s" : ""})
          </h1>
          <p className="text-sm text-muted-foreground">
            Vos prix et disponibilites sont verifies a partir du catalogue avant la commande.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={refreshCartCatalog}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm hover:bg-muted"
          >
            {catalogLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Actualiser
          </button>
          <button
            onClick={clearCart}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4" />
            Vider le panier
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-4">
          {inventoryNotice && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
              {inventoryNotice}
            </div>
          )}

          {catalogError && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
              {catalogError}
            </div>
          )}

          {!catalogLoading && invalidItems.length > 0 && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 mt-0.5 text-destructive" />
                  <div>
                    <p className="text-sm text-foreground" style={{ fontWeight: 600 }}>
                      Certains articles demandent votre attention
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Retirez les produits indisponibles ou resynchronisez votre panier avant de passer commande.
                    </p>
                  </div>
                </div>
                <button
                  onClick={removeInvalidItems}
                  className="px-4 py-2 rounded-lg border border-destructive/40 text-sm text-destructive hover:bg-destructive/10"
                >
                  Retirer les articles invalides
                </button>
              </div>
            </div>
          )}

          {resolvedCartItems.map((item) => {
            const maxReached = item.stock !== null && item.stock > 0 && item.quantity >= item.stock;

            return (
              <div key={item.id} className="rounded-[26px] bg-card border border-border p-3.5 sm:p-4">
                <div className="flex gap-3 sm:gap-4">
                  <Link
                    to={`/produit/${item.effectiveProduct.slug ?? item.effectiveProduct.id}`}
                    className="w-24 h-24 sm:w-28 sm:h-28 shrink-0"
                  >
                    <img
                      src={item.effectiveProduct.image}
                      alt={item.effectiveProduct.name}
                      className="w-full h-full rounded-2xl object-cover"
                    />
                  </Link>

                  <div className="flex-1 min-w-0 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">{item.effectiveProduct.brand}</p>
                        <Link
                          to={`/produit/${item.effectiveProduct.slug ?? item.effectiveProduct.id}`}
                          className="block text-sm sm:text-base leading-snug hover:text-[#E8400C]"
                          style={{ fontWeight: 600 }}
                        >
                          <span className="line-clamp-2">{item.effectiveProduct.name}</span>
                        </Link>
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">{item.effectiveProduct.specs}</p>
                      </div>

                      <div className="hidden sm:block text-right shrink-0">
                        <p className="text-sm" style={{ fontWeight: 700 }}>
                          {formatPrice(item.lineTotal)}
                        </p>
                        {item.effectiveProduct.oldPrice && item.effectiveProduct.oldPrice > item.effectiveProduct.price && (
                          <p className="text-xs text-muted-foreground line-through">
                            {formatPrice(item.effectiveProduct.oldPrice * item.quantity)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {item.isMissing && (
                        <span className="inline-flex rounded-full bg-destructive/10 px-2.5 py-1 text-xs text-destructive">
                          Produit retire du catalogue
                        </span>
                      )}
                      {item.isOutOfStock && (
                        <span className="inline-flex rounded-full bg-destructive/10 px-2.5 py-1 text-xs text-destructive">
                          Temporairement hors stock
                        </span>
                      )}
                      {!item.isMissing && !item.isOutOfStock && item.stock !== null && (
                        <span className="inline-flex rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                          Stock disponible : {item.stock}
                        </span>
                      )}
                      {item.lineSavings > 0 && (
                        <span className="inline-flex rounded-full bg-[#22C55E]/10 px-2.5 py-1 text-xs text-[#22C55E]">
                          Economie : {formatPrice(item.lineSavings)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 sm:justify-between">
                      <div className="flex items-center border border-border rounded-2xl w-fit shrink-0">
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          className="w-10 h-10 flex items-center justify-center"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-10 text-center text-sm">{item.quantity}</span>
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          disabled={item.isMissing || item.isOutOfStock || maxReached}
                          className="w-10 h-10 flex items-center justify-center disabled:opacity-40"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex flex-1 items-center justify-end gap-3 sm:gap-4">
                        <div className="text-right">
                          <p className="text-sm sm:hidden" style={{ fontWeight: 700 }}>
                            {formatPrice(item.lineTotal)}
                          </p>
                          <div className="hidden sm:block">
                            <p className="text-xs text-muted-foreground">Prix unitaire</p>
                            <p className="text-sm" style={{ fontWeight: 600 }}>
                              {formatPrice(item.effectiveProduct.price)}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemove(item.id)}
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="lg:w-96">
          <div className="sticky top-24 rounded-[28px] bg-card border border-border p-5 sm:p-6 space-y-5">
            <div>
              <h3 className="mb-2 text-2xl sm:text-xl" style={{ fontWeight: 600 }}>Recapitulatif</h3>
              <p className="hidden sm:block text-sm text-muted-foreground">
                {itemCount} article{itemCount > 1 ? "s" : ""} dans votre panier
              </p>
            </div>

            <div className="hidden md:block rounded-xl bg-muted/60 p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Livraison gratuite</span>
                <span style={{ fontWeight: 600 }}>
                  {amountUntilFreeShipping === 0 ? "Debloquee" : `Encore ${formatPrice(amountUntilFreeShipping)}`}
                </span>
              </div>
              <div className="h-2 rounded-full bg-background overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#E8400C] transition-all"
                  style={{ width: `${freeShippingProgress}%` }}
                />
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sous-total</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Livraison</span>
                <span>{delivery === 0 ? "Gratuite" : formatPrice(delivery)}</span>
              </div>
              {savings > 0 && (
                <div className="flex justify-between text-[#22C55E]">
                  <span>Economies catalogue</span>
                  <span>-{formatPrice(savings)}</span>
                </div>
              )}
              {discount > 0 && (
                <div className="flex justify-between text-[#22C55E]">
                  <span>Reduction promo</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <input
                value={promoInput}
                onChange={(event) => setPromoInput(event.target.value.toUpperCase())}
                placeholder="Code promo"
                className="flex-1 px-3 py-2 rounded-lg border border-border text-sm bg-transparent"
              />
              <button
                onClick={applyPromo}
                disabled={promoLoading || summaryLoading}
                className="px-5 py-2.5 rounded-2xl border border-border text-sm hover:bg-muted disabled:opacity-60"
              >
                {promoLoading ? "..." : checkoutPromoCode ? "Maj" : "OK"}
              </button>
            </div>

            {checkoutPromoCode && !summaryError && (
              <button
                onClick={async () => {
                  setPromoInput("");
                  if (!standardDeliveryMethod || validItems.length === 0 || invalidItems.length > 0 || catalogLoading) {
                    setCheckoutPromoCode("");
                    setPreview(null);
                    return;
                  }

                  setPromoLoading(true);

                  try {
                    const nextPreview = await previewOrder({
                      delivery_method_id: standardDeliveryMethod.id,
                      items: cartItemsPayload,
                    });

                    setCheckoutPromoCode("");
                    setPreview(nextPreview);
                    setSummaryError("");
                    toast.success("Code promo retire.");
                  } catch (error) {
                    setCheckoutPromoCode("");
                    setPreview(null);
                    setSummaryError(getErrorMessage(error, "Impossible de retirer le code promo."));
                    toast.error(getErrorMessage(error, "Impossible de retirer le code promo."));
                  } finally {
                    setPromoLoading(false);
                  }
                }}
                className="text-xs text-[#22C55E] hover:underline"
              >
                Code applique : {checkoutPromoCode}. Retirer
              </button>
            )}

            {summaryError && (
              <p className="text-xs text-destructive">{summaryError}</p>
            )}

            <div className="border-t border-border pt-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total TTC</p>
                <p className="text-2xl sm:text-lg" style={{ fontWeight: 700 }}>
                  {formatPrice(total)}
                </p>
              </div>
            </div>

            <Link
              to="/commande"
              className={`block w-full text-center px-6 py-3.5 rounded-lg bg-[#E8400C] dark:bg-[#FF5722] text-white transition-opacity ${canCheckout ? "hover:opacity-90" : "pointer-events-none opacity-50"}`}
            >
              Proceder au paiement
            </Link>

            {!canCheckout && (
              <p className="text-xs text-muted-foreground">
                Le checkout reste bloque tant que le panier contient des articles invalides ou non synchronises.
              </p>
            )}

            <div className="flex items-center justify-center gap-4 pt-2">
              {[
                { icon: Shield, text: "Paiement a la livraison" },
                { icon: RotateCcw, text: "Retour 30j" },
                { icon: Headphones, text: "SAV 7j/7" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <item.icon className="w-3.5 h-3.5" />
                  {item.text}
                </div>
              ))}
            </div>

            <div className="hidden md:block rounded-xl border border-border p-4 space-y-3">
              {[
                {
                  icon: Truck,
                  title: "Livraison suivie",
                  text: "Estimation basee sur la methode standard et le montant de votre panier.",
                },
                {
                  icon: Shield,
                  title: "Commande securisee",
                  text: "Validation stock et prix avant le passage en caisse.",
                },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3">
                  <item.icon className="w-4 h-4 mt-0.5 text-[#E8400C]" />
                  <div>
                    <p className="text-sm" style={{ fontWeight: 600 }}>{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {upsell.length > 0 && (
        <div className="mt-16">
          <h2 className="text-xl mb-6" style={{ fontWeight: 600 }}>Ces produits pourraient vous interesser</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {upsell.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        </div>
      )}
    </div>
  );
}
