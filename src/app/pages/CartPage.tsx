import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Minus, Plus, Trash2, ShoppingBag, Shield, RotateCcw, Headphones } from "lucide-react";
import { toast } from "sonner";
import { ProductCard } from "../components/ProductCard";
import { ApiError, getCheckoutOptions, previewOrder, type CheckoutOptions, type OrderPreview } from "../api/orders";
import { PRODUCTS, formatPrice, useStore } from "../data/store";

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
    checkoutPromoCode,
    setCheckoutPromoCode,
  } = useStore();
  const [checkoutOptions, setCheckoutOptions] = useState<CheckoutOptions | null>(null);
  const [preview, setPreview] = useState<OrderPreview | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");
  const [promoInput, setPromoInput] = useState(checkoutPromoCode);
  const [promoLoading, setPromoLoading] = useState(false);

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const standardDeliveryMethod = useMemo(
    () => checkoutOptions?.delivery_methods.find((method) => method.name === "standard") || checkoutOptions?.delivery_methods[0] || null,
    [checkoutOptions],
  );
  const fallbackDelivery = subtotal >= (checkoutOptions?.delivery_rules.free_threshold || 70000)
    ? 0
    : checkoutOptions?.delivery_rules.standard_fee || 4000;
  const delivery = preview?.delivery_cost ?? fallbackDelivery;
  const discount = preview?.discount_amount ?? 0;
  const total = preview?.total_ttc ?? subtotal + delivery - discount;
  const upsell = PRODUCTS.filter((product) => !cart.find((cartItem) => cartItem.product.id === product.id)).slice(0, 4);
  const cartItemsPayload = useMemo(
    () =>
      cart.map((item) => ({
        product_id: Number(item.product.id),
        quantity: item.quantity,
      })),
    [cart],
  );

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
    if (cart.length === 0 || !standardDeliveryMethod) {
      setPreview(null);
      setSummaryError("");
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
  }, [cartItemsPayload, checkoutPromoCode, standardDeliveryMethod]);

  const applyPromo = async () => {
    if (!standardDeliveryMethod || cart.length === 0) {
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
      toast.success(normalizedPromoCode ? "Code promo appliqué." : "Code promo retiré.");
    } catch (error) {
      setCheckoutPromoCode("");
      setPreview(null);
      setSummaryError(getErrorMessage(error, "Impossible d'appliquer le code promo."));
      toast.error(getErrorMessage(error, "Impossible d'appliquer le code promo."));
    } finally {
      setPromoLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-20 py-24 text-center">
        <div className="w-24 h-24 mx-auto rounded-full bg-muted flex items-center justify-center mb-6">
          <ShoppingBag className="w-10 h-10 text-muted-foreground" />
        </div>
        <h1 className="text-2xl mb-2" style={{ fontWeight: 600 }}>Votre panier est vide</h1>
        <p className="text-muted-foreground mb-6">Découvrez notre catalogue et trouvez les appareils parfaits pour votre maison.</p>
        <Link to="/categorie/refrigerateurs" className="inline-flex px-6 py-3 rounded-lg bg-[#E8400C] text-white text-sm hover:opacity-90">
          Explorer le catalogue
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-20 py-8">
      <h1 className="text-2xl mb-8" style={{ fontWeight: 600 }}>Mon panier ({cart.length} article{cart.length > 1 ? "s" : ""})</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-4">
          {cart.map((item) => (
            <div key={item.product.id} className="flex gap-4 p-4 rounded-xl bg-card border border-border">
              <img src={item.product.image} alt={item.product.name} className="w-24 h-24 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">{item.product.brand}</p>
                <h3 className="text-sm truncate" style={{ fontWeight: 500 }}>{item.product.name}</h3>
                <p className="text-xs text-muted-foreground font-mono">{item.product.specs}</p>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center border border-border rounded-lg">
                    <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center">
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm" style={{ fontWeight: 600 }}>{formatPrice(item.product.price * item.quantity)}</span>
                    <button onClick={() => removeFromCart(item.product.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:w-96">
          <div className="sticky top-24 p-6 rounded-xl bg-card border border-border space-y-4">
            <h3 style={{ fontWeight: 600 }}>Récapitulatif</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Sous-total</span><span>{formatPrice(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Livraison</span><span>{delivery === 0 ? "Gratuite" : formatPrice(delivery)}</span></div>
              {discount > 0 && (
                <div className="flex justify-between text-[#22C55E]">
                  <span>Réduction</span>
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
                className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted disabled:opacity-60"
              >
                {promoLoading ? "..." : "OK"}
              </button>
            </div>
            {checkoutPromoCode && !summaryError && (
              <p className="text-xs text-[#22C55E]">Code appliqué: {checkoutPromoCode}</p>
            )}
            {summaryError && (
              <p className="text-xs text-destructive">{summaryError}</p>
            )}
            <div className="border-t border-border pt-4 flex justify-between" style={{ fontWeight: 600 }}>
              <span>Total TTC</span>
              <span>{summaryLoading ? "Calcul..." : formatPrice(total)}</span>
            </div>
            <Link
              to="/commande"
              className={`block w-full text-center px-6 py-3.5 rounded-lg bg-[#E8400C] dark:bg-[#FF5722] text-white transition-opacity ${summaryError ? "pointer-events-none opacity-50" : "hover:opacity-90"}`}
            >
              Procéder à la commande
            </Link>
            <div className="flex items-center justify-center gap-4 pt-2">
              {[
                { icon: Shield, text: "Paiement à la livraison" },
                { icon: RotateCcw, text: "Retour 30j" },
                { icon: Headphones, text: "SAV 7j/7" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <item.icon className="w-3.5 h-3.5" />
                  {item.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {upsell.length > 0 && (
        <div className="mt-16">
          <h2 className="text-xl mb-6" style={{ fontWeight: 600 }}>Ces produits pourraient vous intéresser</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {upsell.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        </div>
      )}
    </div>
  );
}
