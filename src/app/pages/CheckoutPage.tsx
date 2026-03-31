import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Check, CreditCard, Loader2, Truck, Package, MapPin } from "lucide-react";
import { toast } from "sonner";
import {
  ApiError,
  getCheckoutAddresses,
  getCheckoutOptions,
  placeOrder,
  previewOrder,
  type CheckoutOptions,
  type OrderCreateResponse,
  type OrderPreview,
  type ShippingAddress,
} from "../api/orders";
import { formatPrice, useStore } from "../data/store";
import { useAuth } from "../context/AuthContext";

const steps = [
  { id: 1, label: "Livraison", icon: Truck },
  { id: 2, label: "Paiement", icon: CreditCard },
  { id: 3, label: "Confirmation", icon: Check },
];

type AddressFormState = {
  first_name: string;
  last_name: string;
  address: string;
  city: string;
  postal_code: string;
  phone: string;
  save: boolean;
};

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

function formatShortDate(date: string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("fr-DZ", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    cart,
    clearCart,
    checkoutPromoCode,
    setCheckoutPromoCode,
  } = useStore();
  const [step, setStep] = useState(1);
  const [checkoutOptions, setCheckoutOptions] = useState<CheckoutOptions | null>(null);
  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
  const [selectedAddressMode, setSelectedAddressMode] = useState<"saved" | "new">("new");
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [deliveryMethodId, setDeliveryMethodId] = useState<number | null>(null);
  const [addressForm, setAddressForm] = useState<AddressFormState>({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    address: "",
    city: "",
    postal_code: "",
    phone: "",
    save: true,
  });
  const [promoInput, setPromoInput] = useState(checkoutPromoCode);
  const [preview, setPreview] = useState<OrderPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [promoLoading, setPromoLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [orderSuccess, setOrderSuccess] = useState<OrderCreateResponse | null>(null);

  const cartItemsPayload = useMemo(
    () =>
      cart.map((item) => ({
        product_id: Number(item.product.id),
        quantity: item.quantity,
      })),
    [cart],
  );

  const fallbackSubtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const selectedDeliveryMethod = checkoutOptions?.delivery_methods.find((method) => method.id === deliveryMethodId) || null;
  const fallbackDelivery = selectedDeliveryMethod?.name === "standard"
    ? fallbackSubtotal >= (checkoutOptions?.delivery_rules.free_threshold || 70000)
      ? 0
      : checkoutOptions?.delivery_rules.standard_fee || 4000
    : selectedDeliveryMethod?.price || 0;
  const subtotal = preview?.subtotal ?? fallbackSubtotal;
  const deliveryCost = preview?.delivery_cost ?? fallbackDelivery;
  const discountAmount = preview?.discount_amount ?? 0;
  const total = preview?.total_ttc ?? subtotal + deliveryCost - discountAmount;

  useEffect(() => {
    if (!user) return;

    setAddressForm((currentState) => ({
      ...currentState,
      first_name: currentState.first_name || user.first_name,
      last_name: currentState.last_name || user.last_name,
    }));
  }, [user]);

  useEffect(() => {
    let ignore = false;

    setPageLoading(true);

    Promise.all([getCheckoutOptions(), getCheckoutAddresses()])
      .then(([options, savedAddresses]) => {
        if (ignore) return;

        setCheckoutOptions(options);
        setAddresses(savedAddresses);

        const defaultDeliveryMethod = options.delivery_methods[0] || null;
        if (defaultDeliveryMethod) {
          setDeliveryMethodId(defaultDeliveryMethod.id);
        }

        if (savedAddresses.length > 0) {
          const defaultAddress = savedAddresses.find((address) => address.is_default) || savedAddresses[0];
          setSelectedAddressMode("saved");
          setSelectedAddressId(defaultAddress.id);
        } else {
          setSelectedAddressMode("new");
        }
      })
      .catch((error) => {
        if (ignore) return;
        toast.error(getErrorMessage(error, "Impossible de charger les informations de commande."));
      })
      .finally(() => {
        if (!ignore) {
          setPageLoading(false);
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
    if (cart.length === 0 || !deliveryMethodId) {
      setPreview(null);
      setPreviewError("");
      return;
    }

    let ignore = false;

    setPreviewLoading(true);
    previewOrder({
      delivery_method_id: deliveryMethodId,
      items: cartItemsPayload,
      promo_code: checkoutPromoCode || undefined,
    })
      .then((nextPreview) => {
        if (ignore) return;
        setPreview(nextPreview);
        setPreviewError("");
      })
      .catch((error) => {
        if (ignore) return;
        setPreview(null);
        setPreviewError(getErrorMessage(error, "Impossible de calculer cette commande."));
      })
      .finally(() => {
        if (!ignore) {
          setPreviewLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [cartItemsPayload, checkoutPromoCode, deliveryMethodId, cart.length]);

  const applyPromo = async () => {
    if (!deliveryMethodId || cart.length === 0) {
      return;
    }

    const normalizedPromoCode = promoInput.trim().toUpperCase();
    setPromoLoading(true);

    try {
      const nextPreview = await previewOrder({
        delivery_method_id: deliveryMethodId,
        items: cartItemsPayload,
        promo_code: normalizedPromoCode || undefined,
      });

      setPreview(nextPreview);
      setCheckoutPromoCode(normalizedPromoCode);
      setPreviewError("");
      toast.success(normalizedPromoCode ? "Code promo appliqué." : "Code promo retiré.");
    } catch (error) {
      setCheckoutPromoCode("");
      setPreview(null);
      setPreviewError(getErrorMessage(error, "Impossible d'appliquer le code promo."));
      toast.error(getErrorMessage(error, "Impossible d'appliquer le code promo."));
    } finally {
      setPromoLoading(false);
    }
  };

  const updateAddressField = (field: keyof AddressFormState, value: string | boolean) => {
    setAddressForm((currentState) => ({
      ...currentState,
      [field]: value,
    }));
    setFieldErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      delete nextErrors[`address.${field}`];
      return nextErrors;
    });
  };

  const validateDeliveryStep = () => {
    const nextErrors: Record<string, string> = {};

    if (!deliveryMethodId) {
      nextErrors.delivery_method_id = "Choisissez une méthode de livraison.";
    }

    if (selectedAddressMode === "saved") {
      if (!selectedAddressId) {
        nextErrors.shipping_address_id = "Choisissez une adresse enregistrée.";
      }
    } else {
      if (!addressForm.first_name.trim()) nextErrors["address.first_name"] = "Le prénom est obligatoire.";
      if (!addressForm.last_name.trim()) nextErrors["address.last_name"] = "Le nom est obligatoire.";
      if (!addressForm.address.trim()) nextErrors["address.address"] = "L'adresse est obligatoire.";
      if (!addressForm.city.trim()) nextErrors["address.city"] = "La ville est obligatoire.";
      if (!addressForm.phone.trim()) nextErrors["address.phone"] = "Le téléphone est obligatoire.";
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const continueToPayment = () => {
    if (previewError) {
      toast.error(previewError);
      return;
    }

    if (!validateDeliveryStep()) {
      return;
    }

    setStep(2);
  };

  const submitOrder = async () => {
    if (!deliveryMethodId || cart.length === 0) {
      return;
    }

    if (!validateDeliveryStep()) {
      setStep(1);
      return;
    }

    setSubmitLoading(true);
    setFieldErrors({});

    try {
      const payload =
        selectedAddressMode === "saved" && selectedAddressId
          ? {
              shipping_address_id: selectedAddressId,
              delivery_method_id: deliveryMethodId,
              items: cartItemsPayload,
              promo_code: checkoutPromoCode || undefined,
              payment_method: "cash_on_delivery" as const,
              notes: notes.trim() || undefined,
            }
          : {
              address: {
                first_name: addressForm.first_name.trim(),
                last_name: addressForm.last_name.trim(),
                address: addressForm.address.trim(),
                city: addressForm.city.trim(),
                phone: addressForm.phone.trim(),
                postal_code: addressForm.postal_code.trim() || undefined,
                save: addressForm.save,
              },
              delivery_method_id: deliveryMethodId,
              items: cartItemsPayload,
              promo_code: checkoutPromoCode || undefined,
              payment_method: "cash_on_delivery" as const,
              notes: notes.trim() || undefined,
            };

      const response = await placeOrder(payload);

      setOrderSuccess(response);
      clearCart();
      setCheckoutPromoCode("");
      setStep(3);
      toast.success("Commande enregistrée avec succès.");
    } catch (error) {
      if (error instanceof ApiError && error.errors) {
        const nextErrors = Object.fromEntries(
          Object.entries(error.errors).map(([key, messages]) => [key, messages[0]]),
        );
        setFieldErrors(nextErrors);

        if (Object.keys(nextErrors).some((key) => key.startsWith("address.") || key === "shipping_address_id")) {
          setStep(1);
        }
      }

      toast.error(getErrorMessage(error, "Impossible de créer la commande."));
    } finally {
      setSubmitLoading(false);
    }
  };

  if (cart.length === 0 && !orderSuccess) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-20 py-20 text-center">
        <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center mb-6">
          <Package className="w-9 h-9 text-muted-foreground" />
        </div>
        <h1 className="text-2xl mb-2" style={{ fontWeight: 700 }}>Votre panier est vide</h1>
        <p className="text-muted-foreground mb-6">Ajoutez des produits avant de passer votre commande.</p>
        <Link to="/panier" className="inline-flex px-6 py-3 rounded-lg bg-[#E8400C] text-white text-sm hover:opacity-90">
          Retour au panier
        </Link>
      </div>
    );
  }

  if (pageLoading) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-20 py-20 flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          Chargement du checkout...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-20 py-8">
      <div className="flex items-center justify-center gap-4 mb-10">
        {steps.map((currentStep, index) => (
          <div key={currentStep.id} className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm transition-colors ${step >= currentStep.id ? "bg-[#E8400C] text-white" : "bg-muted text-muted-foreground"}`}>
              {step > currentStep.id ? <Check className="w-4 h-4" /> : <currentStep.icon className="w-4 h-4" />}
            </div>
            <span className={`text-sm hidden sm:inline ${step >= currentStep.id ? "text-foreground" : "text-muted-foreground"}`} style={{ fontWeight: step === currentStep.id ? 600 : 400 }}>
              {currentStep.label}
            </span>
            {index < steps.length - 1 && <div className={`w-12 md:w-24 h-0.5 ${step > currentStep.id ? "bg-[#E8400C]" : "bg-border"}`} />}
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl" style={{ fontWeight: 600 }}>Informations de livraison</h2>

              {addresses.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setSelectedAddressMode("saved")}
                      className={`px-4 py-2 rounded-lg text-sm border ${selectedAddressMode === "saved" ? "border-[#E8400C] text-[#E8400C] bg-[#E8400C]/5" : "border-border text-muted-foreground"}`}
                    >
                      Mes adresses
                    </button>
                    <button
                      onClick={() => setSelectedAddressMode("new")}
                      className={`px-4 py-2 rounded-lg text-sm border ${selectedAddressMode === "new" ? "border-[#E8400C] text-[#E8400C] bg-[#E8400C]/5" : "border-border text-muted-foreground"}`}
                    >
                      Nouvelle adresse
                    </button>
                  </div>

                  {selectedAddressMode === "saved" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {addresses.map((address) => (
                        <button
                          key={address.id}
                          onClick={() => setSelectedAddressId(address.id)}
                          className={`text-left p-4 rounded-xl border-2 transition-colors ${selectedAddressId === address.id ? "border-[#E8400C] bg-[#E8400C]/5" : "border-border bg-card"}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm" style={{ fontWeight: 600 }}>{address.full_name}</p>
                            {address.is_default && (
                              <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Principale</span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{address.address}</p>
                          <p className="text-sm text-muted-foreground">{address.postal_code ? `${address.postal_code} ` : ""}{address.city}</p>
                          <p className="text-xs text-muted-foreground mt-2">{address.phone}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {selectedAddressMode === "new" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { key: "first_name", label: "Prénom", placeholder: "Jean" },
                    { key: "last_name", label: "Nom", placeholder: "Dupont" },
                    { key: "address", label: "Adresse", placeholder: "Rue des Martyrs, Cité 500 logts", full: true },
                    { key: "postal_code", label: "Code postal", placeholder: "34000" },
                    { key: "city", label: "Ville", placeholder: "Bordj Bou Arréridj" },
                    { key: "phone", label: "Téléphone", placeholder: "06 12 34 56 78", full: true },
                  ].map((field) => (
                    <div key={field.key} className={field.full ? "sm:col-span-2" : ""}>
                      <label className="text-sm mb-1 block">{field.label}</label>
                      <input
                        value={addressForm[field.key as keyof AddressFormState] as string}
                        onChange={(event) => updateAddressField(field.key as keyof AddressFormState, event.target.value)}
                        placeholder={field.placeholder}
                        className={`w-full px-4 py-2.5 rounded-lg border bg-card text-sm ${fieldErrors[`address.${field.key}`] ? "border-destructive" : "border-border"}`}
                      />
                      {fieldErrors[`address.${field.key}`] && (
                        <p className="text-xs text-destructive mt-1">{fieldErrors[`address.${field.key}`]}</p>
                      )}
                    </div>
                  ))}
                  <label className="sm:col-span-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={addressForm.save}
                      onChange={(event) => updateAddressField("save", event.target.checked)}
                      className="accent-[#E8400C]"
                    />
                    Enregistrer cette adresse pour mes prochaines commandes
                  </label>
                </div>
              )}

              {fieldErrors.shipping_address_id && (
                <p className="text-xs text-destructive">{fieldErrors.shipping_address_id}</p>
              )}

              <h3 className="text-sm mt-6" style={{ fontWeight: 600 }}>Mode de livraison</h3>
              <div className="space-y-3">
                {checkoutOptions?.delivery_methods.map((method) => {
                  const isStandardFree =
                    method.name === "standard" &&
                    subtotal >= (checkoutOptions.delivery_rules.free_threshold || 70000);
                  const displayedPrice = isStandardFree ? 0 : method.name === "standard"
                    ? checkoutOptions.delivery_rules.standard_fee
                    : method.price;

                  return (
                    <label key={method.id} className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-colors ${deliveryMethodId === method.id ? "border-[#E8400C] bg-[#E8400C]/5" : "border-border"}`}>
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="delivery"
                          checked={deliveryMethodId === method.id}
                          onChange={() => setDeliveryMethodId(method.id)}
                          className="accent-[#E8400C]"
                        />
                        <div>
                          <p className="text-sm" style={{ fontWeight: 500 }}>{method.label}</p>
                          <p className="text-xs text-muted-foreground">{method.description}</p>
                        </div>
                      </div>
                      <span className="text-sm" style={{ fontWeight: 500 }}>
                        {displayedPrice === 0 ? "Gratuite" : formatPrice(displayedPrice)}
                      </span>
                    </label>
                  );
                })}
              </div>

              {fieldErrors.delivery_method_id && (
                <p className="text-xs text-destructive">{fieldErrors.delivery_method_id}</p>
              )}

              <button onClick={continueToPayment} className="w-full px-6 py-3.5 rounded-lg bg-[#E8400C] text-white hover:opacity-90 transition-opacity mt-4">
                Continuer vers le paiement
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl" style={{ fontWeight: 600 }}>Paiement</h2>
              {checkoutOptions?.payment_methods.map((paymentMethod) => (
                <div key={paymentMethod.value} className="p-4 rounded-xl border-2 border-[#E8400C] bg-[#E8400C]/5">
                  <div className="flex items-center gap-3 mb-2">
                    <input type="radio" checked readOnly className="accent-[#E8400C]" />
                    <span className="text-sm" style={{ fontWeight: 600 }}>{paymentMethod.label}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{paymentMethod.description}</p>
                </div>
              ))}

              <div className="p-4 rounded-xl border border-border bg-card">
                <div className="flex items-center gap-3 mb-3">
                  <MapPin className="w-4 h-4 text-[#E8400C]" />
                  <p className="text-sm" style={{ fontWeight: 600 }}>Adresse de livraison</p>
                </div>
                {selectedAddressMode === "saved"
                  ? (() => {
                      const selectedAddress = addresses.find((address) => address.id === selectedAddressId);
                      return selectedAddress ? (
                        <div className="text-sm text-muted-foreground">
                          <p className="text-foreground" style={{ fontWeight: 500 }}>{selectedAddress.full_name}</p>
                          <p>{selectedAddress.address}</p>
                          <p>{selectedAddress.postal_code ? `${selectedAddress.postal_code} ` : ""}{selectedAddress.city}</p>
                          <p>{selectedAddress.phone}</p>
                        </div>
                      ) : null;
                    })()
                  : (
                    <div className="text-sm text-muted-foreground">
                      <p className="text-foreground" style={{ fontWeight: 500 }}>{addressForm.first_name} {addressForm.last_name}</p>
                      <p>{addressForm.address}</p>
                      <p>{addressForm.postal_code ? `${addressForm.postal_code} ` : ""}{addressForm.city}</p>
                      <p>{addressForm.phone}</p>
                    </div>
                  )}
              </div>

              <div>
                <label className="text-sm mb-1 block">Instructions de livraison</label>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Ex: appeler avant la livraison, étage, repère..."
                  className="w-full min-h-28 px-4 py-3 rounded-lg border border-border bg-card text-sm"
                />
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="px-6 py-3.5 rounded-lg border border-border hover:bg-muted transition-colors">
                  Retour
                </button>
                <button
                  onClick={submitOrder}
                  disabled={submitLoading || !!previewError}
                  className="flex-1 px-6 py-3.5 rounded-lg bg-[#E8400C] text-white hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  {submitLoading ? "Validation..." : `Confirmer la commande — ${formatPrice(total)}`}
                </button>
              </div>
            </div>
          )}

          {step === 3 && orderSuccess && (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto rounded-full bg-[#22C55E]/10 flex items-center justify-center mb-6">
                <Check className="w-10 h-10 text-[#22C55E]" />
              </div>
              <h2 className="text-2xl mb-2" style={{ fontWeight: 700 }}>Commande confirmée</h2>
              <p className="text-muted-foreground mb-2">Votre commande a bien été enregistrée avec paiement à la livraison.</p>
              <p className="text-sm mb-1" style={{ fontWeight: 500 }}>
                N° de commande : <span className="font-mono">{orderSuccess.order_number}</span>
              </p>
              <p className="text-sm mb-1" style={{ fontWeight: 500 }}>
                Total : <span className="font-mono">{formatPrice(orderSuccess.total_ttc)}</span>
              </p>
              <p className="text-sm text-muted-foreground mb-8">
                Livraison estimée : {formatShortDate(orderSuccess.estimated_delivery)}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/compte" className="px-6 py-3 rounded-lg bg-[#E8400C] text-white text-sm hover:opacity-90">
                  Suivre ma commande
                </Link>
                <button onClick={() => navigate("/")} className="px-6 py-3 rounded-lg border border-border text-sm hover:bg-muted">
                  Continuer mes achats
                </button>
              </div>
            </div>
          )}
        </div>

        {step < 3 && (
          <div className="lg:w-80">
            <div className="sticky top-24 p-5 rounded-xl bg-card border border-border space-y-4">
              <h3 className="text-sm" style={{ fontWeight: 600 }}>Votre commande</h3>
              {cart.map((item) => (
                <div key={item.product.id} className="flex gap-3">
                  <img src={item.product.image} alt="" className="w-12 h-12 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs truncate">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                  </div>
                  <span className="text-xs" style={{ fontWeight: 500 }}>{formatPrice(item.product.price * item.quantity)}</span>
                </div>
              ))}

              <div className="flex gap-2">
                <input
                  value={promoInput}
                  onChange={(event) => setPromoInput(event.target.value.toUpperCase())}
                  placeholder="Code promo"
                  className="flex-1 px-3 py-2 rounded-lg border border-border text-sm bg-transparent"
                />
                <button
                  onClick={applyPromo}
                  disabled={promoLoading || previewLoading}
                  className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted disabled:opacity-60"
                >
                  {promoLoading ? "..." : "OK"}
                </button>
              </div>

              <div className="border-t border-border pt-3 space-y-1 text-sm">
                <div className="flex justify-between text-muted-foreground"><span>Sous-total</span><span>{formatPrice(subtotal)}</span></div>
                <div className="flex justify-between text-muted-foreground"><span>Livraison</span><span>{deliveryCost === 0 ? "Gratuite" : formatPrice(deliveryCost)}</span></div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-[#22C55E]"><span>Réduction</span><span>-{formatPrice(discountAmount)}</span></div>
                )}
                <div className="flex justify-between pt-2 border-t border-border" style={{ fontWeight: 600 }}><span>Total</span><span>{previewLoading ? "Calcul..." : formatPrice(total)}</span></div>
              </div>

              {checkoutPromoCode && !previewError && (
                <p className="text-xs text-[#22C55E]">Code appliqué: {checkoutPromoCode}</p>
              )}
              {previewError && (
                <p className="text-xs text-destructive">{previewError}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
