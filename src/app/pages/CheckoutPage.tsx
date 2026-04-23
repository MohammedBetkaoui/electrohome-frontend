import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { AlertTriangle, Check, CreditCard, Loader2, Truck, Package, MapPin } from "lucide-react";
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
  type WilayaOption,
} from "../api/orders";
import { getCatalogProductsByIds } from "../api/products";
import { formatPrice, type Product, useStore } from "../data/store";
import { buildOrderItemsPayload, resolveCartItems } from "../lib/cart";
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
  wilaya_id: number | null;
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
    syncCartProducts,
    checkoutPromoCode,
    setCheckoutPromoCode,
  } = useStore();
  const [step, setStep] = useState(1);
  const [checkoutOptions, setCheckoutOptions] = useState<CheckoutOptions | null>(null);
  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
  const [selectedAddressMode, setSelectedAddressMode] = useState<"saved" | "new">("new");
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [deliveryMethodId, setDeliveryMethodId] = useState<number | null>(null);
  const [deliveryType, setDeliveryType] = useState<"home" | "agency">("home");
  const [addressForm, setAddressForm] = useState<AddressFormState>({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    address: "",
    city: "",
    postal_code: "",
    phone: "",
    wilaya_id: null,
    save: true,
  });
  const [promoInput, setPromoInput] = useState(checkoutPromoCode);
  const [preview, setPreview] = useState<OrderPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [promoLoading, setPromoLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [catalogError, setCatalogError] = useState("");
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogSyncReady, setCatalogSyncReady] = useState(false);
  const [inventoryNotice, setInventoryNotice] = useState("");
  const [liveProducts, setLiveProducts] = useState<Product[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [orderSuccess, setOrderSuccess] = useState<OrderCreateResponse | null>(null);

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
  const invalidItems = resolvedCartItems.filter((item) => !item.isValid);
  const validItems = resolvedCartItems.filter((item) => item.isValid);
  const cartItemsPayload = useMemo(
    () => buildOrderItemsPayload(validItems.map((item) => ({ id: item.id, quantity: item.quantity }))),
    [validItems],
  );

  const fallbackSubtotal = resolvedCartItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const selectedDeliveryMethod = checkoutOptions?.delivery_methods.find((method) => method.id === deliveryMethodId) || null;

  // Wilaya active: déterminée depuis l'adresse enregistrée ou le formulaire
  const activeWilayaId: number | null = useMemo(() => {
    if (selectedAddressMode === "saved" && selectedAddressId) {
      const addr = addresses.find((a) => a.id === selectedAddressId);
      return addr?.wilaya_id ?? null;
    }
    return addressForm.wilaya_id;
  }, [selectedAddressMode, selectedAddressId, addresses, addressForm.wilaya_id]);

  const activeWilaya: WilayaOption | null = useMemo(() => {
    if (!activeWilayaId || !checkoutOptions?.wilayas) return null;
    return checkoutOptions.wilayas.find((w) => w.id === activeWilayaId) ?? null;
  }, [activeWilayaId, checkoutOptions]);

  const fallbackDelivery = useMemo(() => {
    if (activeWilaya) {
      const basePrice = deliveryType === "agency"
        ? activeWilaya.delivery_price_agency
        : activeWilaya.delivery_price;
      // Supplément poids fallback depuis weight_pricings
      const totalWeight = resolvedCartItems.reduce(
        (sum, item) => sum + ((item.effectiveProduct as any).weight_kg ?? 0) * item.quantity,
        0,
      );
      const weightPricings = checkoutOptions?.weight_pricings ?? [];
      let weightSurcharge = 0;
      if (totalWeight > 0 && weightPricings.length > 0) {
        const tier = weightPricings
          .filter((t) => t.max_weight_kg >= totalWeight)
          .sort((a, b) => a.max_weight_kg - b.max_weight_kg)[0]
          ?? weightPricings.sort((a, b) => b.max_weight_kg - a.max_weight_kg)[0];
        if (tier) weightSurcharge = tier.price;
      }
      return basePrice + weightSurcharge;
    }
    if (selectedDeliveryMethod?.name === "standard") {
      return fallbackSubtotal >= (checkoutOptions?.delivery_rules.free_threshold || 70000)
        ? 0
        : checkoutOptions?.delivery_rules.standard_fee || 4000;
    }
    return selectedDeliveryMethod?.price || 0;
  }, [activeWilaya, deliveryType, selectedDeliveryMethod, fallbackSubtotal, checkoutOptions, resolvedCartItems]);
  const subtotal = preview?.subtotal ?? fallbackSubtotal;
  const deliveryCost = preview?.delivery_cost ?? fallbackDelivery;
  const discountAmount = preview?.discount_amount ?? 0;
  const total = preview?.total_ttc ?? subtotal + deliveryCost - discountAmount;
  const canContinueToPayment =
    invalidItems.length === 0
    && !previewError
    && cartItemsPayload.length > 0;
  const canSubmitOrder =
    !submitLoading
    && !previewError
    && invalidItems.length === 0
    && cartItemsPayload.length > 0;

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
          quantityAdjusted ? "Certaines quantites du panier ont ete ajustees selon le stock disponible." : "",
          priceUpdated ? "Les prix ont ete resynchronises avec le catalogue." : "",
        ].filter(Boolean);

        setInventoryNotice(notices.join(" "));
        setLiveProducts(products);
        syncCartProducts(products);
        setCatalogSyncReady(true);
        setCatalogError("");
      })
      .catch((error) => {
        if (ignore) return;
        setLiveProducts([]);
        setInventoryNotice("");
        setCatalogSyncReady(false);
        setCatalogError(getErrorMessage(error, "Synchronisation temps reel indisponible. La commande sera reverifiee au moment de la validation."));
      })
      .finally(() => {
        if (!ignore) {
          setCatalogLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [cartIdsKey]);

  useEffect(() => {
    setPromoInput(checkoutPromoCode);
  }, [checkoutPromoCode]);

  useEffect(() => {
    if (cart.length === 0) {
      setPreviewLoading(false);
      setPreview(null);
      setPreviewError("");
      return;
    }

    if (invalidItems.length > 0) {
      setPreviewLoading(false);
      setPreview(null);
      setPreviewError("Votre panier doit etre corrige avant la confirmation de commande.");
      return;
    }

    let ignore = false;

    setPreviewLoading(true);
    previewOrder({
      delivery_method_id: deliveryMethodId,
      items: cartItemsPayload,
      promo_code: checkoutPromoCode || undefined,
      wilaya_id: activeWilayaId ?? undefined,
      delivery_type: deliveryType,
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
  }, [cartItemsPayload, checkoutPromoCode, deliveryMethodId, deliveryType, cart.length, invalidItems.length, activeWilayaId]); // eslint-disable-line react-hooks/exhaustive-deps

  const applyPromo = async () => {
    if (cart.length === 0 || invalidItems.length > 0) {
      toast.error("Corrigez votre panier avant d'appliquer un code promo.");
      return;
    }

    const normalizedPromoCode = promoInput.trim().toUpperCase();
    setPromoLoading(true);

    try {
      const nextPreview = await previewOrder({
        delivery_method_id: deliveryMethodId,
        items: cartItemsPayload,
        promo_code: normalizedPromoCode || undefined,
        wilaya_id: activeWilayaId ?? undefined,
        delivery_type: deliveryType,
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

  const removePromo = async () => {
    setPromoInput("");

    if (cart.length === 0 || invalidItems.length > 0) {
      setCheckoutPromoCode("");
      setPreview(null);
      return;
    }

    setPromoLoading(true);

    try {
      const nextPreview = await previewOrder({
        delivery_method_id: deliveryMethodId,
        items: cartItemsPayload,
        wilaya_id: activeWilayaId ?? undefined,
        delivery_type: deliveryType,
      });

      setCheckoutPromoCode("");
      setPreview(nextPreview);
      setPreviewError("");
      toast.success("Code promo retire.");
    } catch (error) {
      setCheckoutPromoCode("");
      setPreview(null);
      setPreviewError(getErrorMessage(error, "Impossible de retirer le code promo."));
      toast.error(getErrorMessage(error, "Impossible de retirer le code promo."));
    } finally {
      setPromoLoading(false);
    }
  };

  const updateAddressField = (field: keyof AddressFormState, value: string | boolean | number | null) => {
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
    if (invalidItems.length > 0) {
      toast.error("Votre panier contient des articles indisponibles ou non verifies.");
      return;
    }

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
    if (cart.length === 0 || invalidItems.length > 0) {
      toast.error("Votre panier doit etre corrige avant la commande.");
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
              wilaya_id: activeWilayaId ?? undefined,
              delivery_type: deliveryType,
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
                wilaya_id: addressForm.wilaya_id ?? undefined,
                save: addressForm.save,
              },
              delivery_method_id: deliveryMethodId,
              items: cartItemsPayload,
              promo_code: checkoutPromoCode || undefined,
              wilaya_id: addressForm.wilaya_id ?? undefined,
              delivery_type: deliveryType,
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

              {(inventoryNotice || catalogError || invalidItems.length > 0) && (
                <div className="space-y-3">
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

                  {invalidItems.length > 0 && (
                    <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 mt-0.5 text-destructive" />
                        <div>
                          <p className="text-sm" style={{ fontWeight: 600 }}>Panier a corriger</p>
                          <p className="text-sm text-muted-foreground">
                            Retirez ou corrigez les articles indisponibles depuis le panier avant de continuer.
                          </p>
                          <Link to="/panier" className="inline-flex mt-3 text-sm text-[#E8400C] hover:underline">
                            Retour au panier
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

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
                          {address.wilaya_name && (
                            <p className="text-xs text-[#E8400C] mt-1 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />{address.wilaya_name}
                            </p>
                          )}
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

                  {/* Wilaya selector */}
                  {checkoutOptions && checkoutOptions.wilayas.length > 0 && (
                    <div className="sm:col-span-2">
                      <label className="text-sm mb-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#E8400C]" /> Wilaya (région)
                      </label>
                      <select
                        value={addressForm.wilaya_id ?? ""}
                        onChange={(event) => updateAddressField("wilaya_id", event.target.value ? parseInt(event.target.value) : null)}
                        className="w-full px-4 py-2.5 rounded-lg border border-border bg-card text-sm"
                      >
                        <option value="">— Sélectionnez votre wilaya —</option>
                        {checkoutOptions.wilayas.map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.name} — {w.delivery_price.toLocaleString("fr-DZ")} DA
                          </option>
                        ))}
                      </select>
                      {addressForm.wilaya_id && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Domicile : {checkoutOptions.wilayas.find((w) => w.id === addressForm.wilaya_id)?.delivery_price.toLocaleString("fr-DZ")} DA
                          {" · "}
                          Bureau agence : {checkoutOptions.wilayas.find((w) => w.id === addressForm.wilaya_id)?.delivery_price_agency.toLocaleString("fr-DZ")} DA
                        </p>
                      )}
                    </div>
                  )}

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

              {activeWilaya && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Type de livraison</p>
                  <div className="grid grid-cols-2 gap-3">
                    <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${deliveryType === "home" ? "border-[#E8400C] bg-[#E8400C]/5" : "border-border"}`}>
                      <input
                        type="radio"
                        checked={deliveryType === "home"}
                        onChange={() => setDeliveryType("home")}
                        className="accent-[#E8400C]"
                      />
                      <div>
                        <p className="text-sm font-medium">À domicile</p>
                        <p className="text-xs text-muted-foreground">{activeWilaya.delivery_price.toLocaleString("fr-DZ")} DA</p>
                      </div>
                    </label>
                    <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${deliveryType === "agency" ? "border-[#E8400C] bg-[#E8400C]/5" : "border-border"}`}>
                      <input
                        type="radio"
                        checked={deliveryType === "agency"}
                        onChange={() => setDeliveryType("agency")}
                        className="accent-[#E8400C]"
                      />
                      <div>
                        <p className="text-sm font-medium">Bureau agence</p>
                        <p className="text-xs text-muted-foreground">{activeWilaya.delivery_price_agency.toLocaleString("fr-DZ")} DA</p>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              <button
                disabled={!canContinueToPayment}
                className="w-full px-6 py-3.5 rounded-lg bg-[#E8400C] text-white hover:opacity-90 transition-opacity mt-4 disabled:cursor-not-allowed disabled:opacity-60"
              >
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
                          {selectedAddress.wilaya_name && (
                            <p className="text-[#E8400C] flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3" />{selectedAddress.wilaya_name}
                            </p>
                          )}
                          <p>{selectedAddress.phone}</p>
                        </div>
                      ) : null;
                    })()
                  : (
                    <div className="text-sm text-muted-foreground">
                      <p className="text-foreground" style={{ fontWeight: 500 }}>{addressForm.first_name} {addressForm.last_name}</p>
                      <p>{addressForm.address}</p>
                      <p>{addressForm.postal_code ? `${addressForm.postal_code} ` : ""}{addressForm.city}</p>
                      {activeWilaya && (
                        <p className="text-[#E8400C] flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />{activeWilaya.name}
                        </p>
                      )}
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
                  disabled={!canSubmitOrder}
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
              {resolvedCartItems.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <img src={item.effectiveProduct.image} alt="" className="w-12 h-12 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs truncate">{item.effectiveProduct.name}</p>
                    <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                    {!item.isValid && (
                      <p className="text-[11px] text-destructive">Article a corriger dans le panier</p>
                    )}
                  </div>
                  <span className="text-xs" style={{ fontWeight: 500 }}>{formatPrice(item.lineTotal)}</span>
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
                <div className="flex justify-between text-muted-foreground">
                  <span>Livraison{activeWilaya ? ` (${activeWilaya.name})` : ""}{activeWilaya ? ` · ${deliveryType === "agency" ? "Bureau agence" : "Domicile"}` : ""}</span>
                  <span>{deliveryCost === 0 ? "Gratuite" : formatPrice(deliveryCost)}</span>
                </div>
                {preview?.weight_surcharge != null && preview.weight_surcharge > 0 && (
                  <div className="flex justify-between text-muted-foreground text-xs">
                    <span>dont frais poids</span>
                    <span>+{formatPrice(preview.weight_surcharge)}</span>
                  </div>
                )}
                {preview?.total_weight_kg != null && preview.total_weight_kg > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Poids total : {preview.total_weight_kg.toFixed(1)} kg
                  </p>
                )}
                {discountAmount > 0 && (
                  <div className="flex justify-between text-[#22C55E]"><span>Réduction</span><span>-{formatPrice(discountAmount)}</span></div>
                )}
                <div className="flex justify-between pt-2 border-t border-border" style={{ fontWeight: 600 }}><span>Total</span><span>{formatPrice(total)}</span></div>
              </div>

              {checkoutPromoCode && !previewError && (
                <button
                  onClick={removePromo}
                  className="text-xs text-[#22C55E] hover:underline"
                >
                  Code applique : {checkoutPromoCode}. Retirer
                </button>
              )}
              {catalogLoading && (
                <p className="text-xs text-muted-foreground">Verification du panier en cours...</p>
              )}
              {previewLoading && (
                <p className="text-xs text-muted-foreground">Mise a jour du total en cours...</p>
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
