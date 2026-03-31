import { useEffect, useMemo, useState } from "react";
import { LayoutDashboard, Package, Heart, MapPin, MessageSquare, Settings, LogOut, Truck, ReceiptText } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { cancelMyOrder, getCheckoutAddresses, getMyOrder, getMyOrders, type CustomerOrder, type CustomerOrderDetail, type ShippingAddress } from "../api/orders";
import { PRODUCTS, formatPrice, useStore } from "../data/store";
import { ProductCard } from "../components/ProductCard";
import { useAuth } from "../context/AuthContext";

const sideNav = [
  { id: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { id: "orders", label: "Mes commandes", icon: Package },
  { id: "favorites", label: "Mes favoris", icon: Heart },
  { id: "addresses", label: "Mes adresses", icon: MapPin },
  { id: "reviews", label: "Mes avis", icon: MessageSquare },
  { id: "settings", label: "Paramètres", icon: Settings },
] as const;

const orderStatusMap: Record<string, { label: string; className: string }> = {
  pending: { label: "En attente", className: "text-amber-500" },
  confirmed: { label: "Confirmée", className: "text-sky-500" },
  preparing: { label: "En préparation", className: "text-violet-500" },
  shipped: { label: "Expédiée", className: "text-blue-500" },
  delivered: { label: "Livrée", className: "text-emerald-500" },
  cancelled: { label: "Annulée", className: "text-rose-500" },
  returned: { label: "Retournée", className: "text-orange-500" },
};

function formatOrderStatus(status: string) {
  return orderStatusMap[status] || { label: status, className: "text-muted-foreground" };
}

function formatOrderDate(value: string) {
  return new Date(value).toLocaleDateString("fr-DZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function AccountPage() {
  const [active, setActive] = useState<(typeof sideNav)[number]["id"]>("dashboard");
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const { favorites } = useStore();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const favProducts = PRODUCTS.filter((product) => favorites.includes(product.id));

  const latestOrder = orders[0] || null;
  const initials = user ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase() : "";
  const latestOrderStatus = latestOrder ? formatOrderStatus(latestOrder.status) : null;

  const loadOrders = async () => {
    setOrdersLoading(true);

    try {
      const response = await getMyOrders();
      setOrders(response.data);

      if (response.data.length > 0 && !selectedOrderId) {
        setSelectedOrderId(response.data[0].id);
      }
    } catch {
      toast.error("Impossible de charger vos commandes.");
    } finally {
      setOrdersLoading(false);
    }
  };

  const loadAddresses = async () => {
    setAddressesLoading(true);

    try {
      const savedAddresses = await getCheckoutAddresses();
      setAddresses(savedAddresses);
    } catch {
      toast.error("Impossible de charger vos adresses.");
    } finally {
      setAddressesLoading(false);
    }
  };

  const loadOrderDetail = async (orderId: number) => {
    setDetailLoading(true);

    try {
      const detail = await getMyOrder(orderId);
      setSelectedOrder(detail);
      setSelectedOrderId(orderId);
    } catch {
      toast.error("Impossible de charger le détail de cette commande.");
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    void loadOrders();
    void loadAddresses();
  }, []);

  useEffect(() => {
    if (selectedOrderId) {
      void loadOrderDetail(selectedOrderId);
    }
  }, [selectedOrderId]);

  const handleLogout = async () => {
    await logout();
    toast.success("Déconnexion réussie");
    navigate("/");
  };

  const handleCancelOrder = async () => {
    if (!selectedOrder?.can_cancel) {
      return;
    }

    const confirmed = window.confirm("Voulez-vous vraiment annuler cette commande ?");
    if (!confirmed) {
      return;
    }

    setCancelLoading(true);

    try {
      await cancelMyOrder(selectedOrder.id);
      toast.success("Commande annulée.");
      await loadOrders();
      await loadOrderDetail(selectedOrder.id);
    } catch {
      toast.error("Impossible d'annuler cette commande.");
    } finally {
      setCancelLoading(false);
    }
  };

  const orderSummaryCards = useMemo(
    () => [
      {
        label: "Dernière commande",
        value: latestOrder?.order_number || "Aucune",
        helper: latestOrderStatus?.label || "Aucune commande pour le moment",
        helperClassName: latestOrderStatus?.className || "text-muted-foreground",
        icon: ReceiptText,
      },
      {
        label: "Total commandes",
        value: String(orders.length),
        helper: orders.length > 0 ? "Historique synchronisé" : "Aucune commande",
        helperClassName: "text-muted-foreground",
        icon: Package,
      },
      {
        label: "Favoris",
        value: String(favorites.length),
        helper: "produits sauvegardés",
        helperClassName: "text-muted-foreground",
        icon: Heart,
      },
    ],
    [favorites.length, latestOrder, latestOrderStatus?.className, latestOrderStatus?.label, orders.length],
  );

  if (!user) return null;

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-20 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-64 shrink-0">
          <div className="p-4 rounded-xl bg-card border border-border mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#E8400C] text-white flex items-center justify-center text-sm" style={{ fontWeight: 600 }}>
                {initials}
              </div>
              <div>
                <p className="text-sm" style={{ fontWeight: 600 }}>{user.full_name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
          </div>
          <nav className="space-y-1">
            {sideNav.map((item) => (
              <button
                key={item.id}
                onClick={() => setActive(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${active === item.id ? "bg-[#E8400C]/10 text-[#E8400C]" : "hover:bg-muted text-muted-foreground"}`}
                style={{ fontWeight: active === item.id ? 500 : 400 }}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors">
              <LogOut className="w-4 h-4" />
              Déconnexion
            </button>
          </nav>
        </aside>

        <div className="flex-1">
          {active === "dashboard" && (
            <div className="space-y-6">
              <h1 className="text-xl" style={{ fontWeight: 600 }}>Bienvenue, {user.first_name} !</h1>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {orderSummaryCards.map((card) => (
                  <div key={card.label} className="p-5 rounded-xl bg-card border border-border">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs text-muted-foreground">{card.label}</p>
                      <card.icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <p className="text-lg" style={{ fontWeight: 700 }}>{card.value}</p>
                    <p className={`text-xs mt-1 ${card.helperClassName}`}>{card.helper}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {active === "orders" && (
            <div className="space-y-6">
              <h2 className="text-xl" style={{ fontWeight: 600 }}>Mes commandes</h2>

              {ordersLoading ? (
                <p className="text-sm text-muted-foreground">Chargement des commandes...</p>
              ) : orders.length === 0 ? (
                <div className="p-6 rounded-xl border border-border bg-card text-sm text-muted-foreground">
                  Vous n&apos;avez pas encore passé de commande.
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left text-muted-foreground">
                          <th className="py-3 pr-4" style={{ fontWeight: 500 }}>N° Commande</th>
                          <th className="py-3 pr-4" style={{ fontWeight: 500 }}>Date</th>
                          <th className="py-3 pr-4" style={{ fontWeight: 500 }}>Statut</th>
                          <th className="py-3 pr-4" style={{ fontWeight: 500 }}>Total</th>
                          <th className="py-3" style={{ fontWeight: 500 }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => {
                          const status = formatOrderStatus(order.status);
                          return (
                            <tr key={order.id} className="border-b border-border">
                              <td className="py-3 pr-4 font-mono">{order.order_number}</td>
                              <td className="py-3 pr-4 text-muted-foreground">{formatOrderDate(order.created_at)}</td>
                              <td className="py-3 pr-4"><span className={status.className} style={{ fontWeight: 500 }}>{status.label}</span></td>
                              <td className="py-3 pr-4" style={{ fontWeight: 500 }}>{formatPrice(order.total_ttc)}</td>
                              <td className="py-3">
                                <button onClick={() => setSelectedOrderId(order.id)} className="text-[#E8400C] text-xs hover:underline">
                                  Détails
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-6 rounded-xl bg-card border border-border">
                    {detailLoading ? (
                      <p className="text-sm text-muted-foreground">Chargement du détail de la commande...</p>
                    ) : selectedOrder ? (
                      <div className="space-y-6">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Commande sélectionnée</p>
                            <h3 className="text-lg" style={{ fontWeight: 700 }}>{selectedOrder.order_number}</h3>
                            <p className="text-sm text-muted-foreground">Passée le {formatOrderDate(selectedOrder.created_at)}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-3">
                            <span className={`text-sm ${formatOrderStatus(selectedOrder.status).className}`} style={{ fontWeight: 600 }}>
                              {formatOrderStatus(selectedOrder.status).label}
                            </span>
                            {selectedOrder.can_cancel && (
                              <button
                                onClick={handleCancelOrder}
                                disabled={cancelLoading}
                                className="px-4 py-2 rounded-lg border border-destructive text-destructive text-sm hover:bg-destructive/10 disabled:opacity-60"
                              >
                                {cancelLoading ? "Annulation..." : "Annuler la commande"}
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="p-4 rounded-xl border border-border">
                            <p className="text-xs text-muted-foreground mb-1">Paiement</p>
                            <p className="text-sm" style={{ fontWeight: 600 }}>Paiement à la livraison</p>
                            <p className="text-xs text-muted-foreground mt-1">{selectedOrder.payment_status}</p>
                          </div>
                          <div className="p-4 rounded-xl border border-border">
                            <p className="text-xs text-muted-foreground mb-1">Livraison</p>
                            <p className="text-sm" style={{ fontWeight: 600 }}>{selectedOrder.delivery_method?.label || "—"}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Estimée: {selectedOrder.estimated_delivery ? formatOrderDate(selectedOrder.estimated_delivery) : "—"}
                            </p>
                          </div>
                          <div className="p-4 rounded-xl border border-border">
                            <p className="text-xs text-muted-foreground mb-1">Total</p>
                            <p className="text-sm" style={{ fontWeight: 600 }}>{formatPrice(selectedOrder.total_ttc)}</p>
                            <p className="text-xs text-muted-foreground mt-1">Sous-total: {formatPrice(selectedOrder.subtotal)}</p>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm mb-3" style={{ fontWeight: 600 }}>Articles</h4>
                          <div className="space-y-3">
                            {selectedOrder.items.map((item) => (
                              <div key={item.id} className="flex items-center justify-between gap-4 p-4 rounded-xl border border-border">
                                <div>
                                  <p className="text-sm" style={{ fontWeight: 600 }}>{item.product_name}</p>
                                  <p className="text-xs text-muted-foreground">{item.product_brand} · Qté: {item.quantity}</p>
                                </div>
                                <span className="text-sm" style={{ fontWeight: 600 }}>{formatPrice(item.subtotal)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 rounded-xl border border-border">
                            <div className="flex items-center gap-2 mb-3">
                              <MapPin className="w-4 h-4 text-[#E8400C]" />
                              <h4 className="text-sm" style={{ fontWeight: 600 }}>Adresse</h4>
                            </div>
                            {selectedOrder.address ? (
                              <div className="text-sm text-muted-foreground space-y-1">
                                <p className="text-foreground" style={{ fontWeight: 500 }}>{selectedOrder.address.full_name}</p>
                                <p>{selectedOrder.address.address}</p>
                                <p>{selectedOrder.address.postal_code ? `${selectedOrder.address.postal_code} ` : ""}{selectedOrder.address.city}</p>
                                <p>{selectedOrder.address.phone}</p>
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">Adresse indisponible.</p>
                            )}
                          </div>

                          <div className="p-4 rounded-xl border border-border">
                            <div className="flex items-center gap-2 mb-3">
                              <Truck className="w-4 h-4 text-[#E8400C]" />
                              <h4 className="text-sm" style={{ fontWeight: 600 }}>Historique</h4>
                            </div>
                            <div className="space-y-3">
                              {selectedOrder.status_history.map((history, index) => (
                                <div key={`${history.status}-${index}`} className="text-sm">
                                  <p style={{ fontWeight: 600 }}>{formatOrderStatus(history.status).label}</p>
                                  <p className="text-xs text-muted-foreground">{history.note || "Mise à jour du statut"}</p>
                                  {history.created_at && (
                                    <p className="text-[11px] text-muted-foreground mt-1">{formatOrderDate(history.created_at)}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Sélectionnez une commande pour voir le détail.</p>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {active === "favorites" && (
            <div>
              <h2 className="text-xl mb-6" style={{ fontWeight: 600 }}>Mes favoris</h2>
              {favProducts.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {favProducts.map((product) => <ProductCard key={product.id} product={product} />)}
                </div>
              ) : (
                <p className="text-muted-foreground">Aucun produit en favoris pour le moment.</p>
              )}
            </div>
          )}

          {active === "addresses" && (
            <div>
              <h2 className="text-xl mb-6" style={{ fontWeight: 600 }}>Mes adresses</h2>
              {addressesLoading ? (
                <p className="text-sm text-muted-foreground">Chargement des adresses...</p>
              ) : addresses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map((address) => (
                    <div key={address.id} className="p-5 rounded-xl border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs px-2 py-0.5 rounded bg-muted" style={{ fontWeight: 500 }}>
                          {address.is_default ? "Principale" : "Adresse enregistrée"}
                        </span>
                      </div>
                      <p className="text-sm" style={{ fontWeight: 500 }}>{address.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {address.address}
                        <br />
                        {address.postal_code ? `${address.postal_code} ` : ""}{address.city}
                      </p>
                      <p className="text-xs text-muted-foreground mt-3">{address.phone}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-5 rounded-xl border border-border text-sm text-muted-foreground">
                  Aucune adresse enregistrée. Votre première adresse sera créée lors d&apos;une commande.
                </div>
              )}
            </div>
          )}

          {active === "settings" && (
            <div className="max-w-lg space-y-6">
              <h2 className="text-xl" style={{ fontWeight: 600 }}>Paramètres</h2>
              <div className="space-y-4">
                {[
                  { label: "Prénom", value: user.first_name },
                  { label: "Nom", value: user.last_name },
                  { label: "Email", value: user.email },
                ].map((field) => (
                  <div key={field.label}>
                    <label className="text-sm mb-1 block">{field.label}</label>
                    <input defaultValue={field.value} className="w-full px-4 py-2.5 rounded-lg border border-border bg-card text-sm" />
                  </div>
                ))}
                <button className="px-6 py-2.5 rounded-lg bg-[#E8400C] text-white text-sm hover:opacity-90">Sauvegarder</button>
              </div>
            </div>
          )}

          {active === "reviews" && (
            <div>
              <h2 className="text-xl mb-6" style={{ fontWeight: 600 }}>Mes avis</h2>
              <p className="text-muted-foreground text-sm">Vous n&apos;avez pas encore laissé d&apos;avis.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
