import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { toast } from "sonner";
import {
  X, Printer, CheckCircle2, Clock, Package,
  RotateCcw, Truck, XCircle, Mail, MapPin, Phone,
  ChevronLeft
} from "lucide-react";
import {
  getOrder,
  updateOrderStatus,
  updateOrderNotes,
  type AdminOrderDetail,
  type OrderStatus,
} from "../../api/Adminorders";

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; icon: any }
> = {
  pending:   { label: "En attente",    color: "#F59E0B", icon: Clock },
  confirmed: { label: "Confirmée",     color: "#3B82F6", icon: CheckCircle2 },
  processing: { label: "En préparation",color: "#8B5CF6", icon: Package },
  shipped:   { label: "Expédiée",      color: "#06B6D4", icon: Truck },
  delivered: { label: "Livrée",        color: "#10B981", icon: CheckCircle2 },
  cancelled: { label: "Annulée",       color: "#EF4444", icon: XCircle },
  returned:  { label: "Retournée",     color: "#6B7280", icon: RotateCcw },
};

function formatPrice(price: number) {
  return price.toLocaleString("fr-DZ") + " DA";
}
function formatShortDate(date: string) {
  return new Date(date).toLocaleDateString("fr-DZ", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
function formatDateTime(date: string) {
  return new Date(date).toLocaleDateString("fr-DZ", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [statusNote, setStatusNote] = useState("");
  const [isChanging, setIsChanging] = useState(false);
  const [localNotes, setLocalNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    async function loadDetail() {
      if (!id) return;
      try {
        setIsLoading(true);
        const data = await getOrder(Number(id));
        setOrder(data);
        setLocalNotes(data.notes ?? "");
      } catch {
        toast.error("Impossible de charger les détails de la commande.");
        navigate("/admin/commandes");
      } finally {
        setIsLoading(false);
      }
    }
    loadDetail();
  }, [id, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const st = STATUS_CONFIG[order.status];
  const StatusIcon = st.icon;

  const handleStatusChange = async (ns: OrderStatus) => {
    setIsChanging(true);
    try {
      const updated = await updateOrderStatus(order.id, ns, statusNote || undefined);
      setStatusNote("");
      setOrder(updated);
      toast.success(`Statut mis à jour : ${STATUS_CONFIG[ns].label}`);
    } catch {
      toast.error("Erreur lors du changement de statut.");
    } finally {
      setIsChanging(false);
    }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      await updateOrderNotes(order.id, localNotes);
      toast.success("Notes enregistrées.");
    } catch {
      toast.error("Erreur lors de la sauvegarde des notes.");
    } finally {
      setSavingNotes(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto" style={{ fontFamily: "'Sora', sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/admin/commandes")}
            className="w-9 h-9 rounded-lg bg-white dark:bg-[#1E1E24] border border-[#E5E7EB] dark:border-white/10 flex items-center justify-center text-[#6B7280] hover:text-[#1A2332] dark:hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl text-[#1A2332] dark:text-white" style={{ fontWeight: 700 }}>
                Commande {order.order_number}
              </h1>
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm"
                style={{
                  fontWeight: 500,
                  backgroundColor: st.color + "15",
                  color: st.color,
                }}
              >
                <StatusIcon className="w-4 h-4" />
                {st.label}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-[#1E1E24] border border-[#E5E7EB] dark:border-white/10 text-[13px] text-[#6B7280] hover:text-[#1A2332] dark:hover:text-white transition-colors"
            style={{ fontWeight: 500 }}
          >
            <Printer className="w-4 h-4" /> Imprimer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Articles */}
          <div className="bg-white dark:bg-[#1E1E24] rounded-2xl border border-[#E5E7EB] dark:border-white/10 p-6">
            <h2 className="text-[15px] text-[#1A2332] dark:text-white mb-4" style={{ fontWeight: 600 }}>
              Articles de la commande ({order.items?.length ?? 0})
            </h2>
            <div className="space-y-3">
              {order.items?.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 bg-[#F9FAFB] dark:bg-white/5 rounded-xl p-4 border border-[#E5E7EB] dark:border-white/5"
                >
                  <div className="w-14 h-14 rounded-lg bg-white dark:bg-white/10 overflow-hidden shrink-0 flex items-center justify-center">
                    <Package className="w-7 h-7 text-[#9CA3AF]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[14px] text-[#1A2332] dark:text-white truncate"
                      style={{ fontWeight: 600 }}
                    >
                      {item.product_name}
                    </p>
                    <p className="text-[12px] text-[#6B7280] mt-0.5">
                      {item.product_brand} · Quantité: {item.quantity}
                    </p>
                  </div>
                  <p
                    className="text-[14px] text-[#1A2332] dark:text-white shrink-0"
                    style={{ fontWeight: 700 }}
                  >
                    {formatPrice(item.subtotal)}
                  </p>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-5 border-t border-[#E5E7EB] dark:border-white/10 space-y-3">
              <div className="flex justify-between text-[14px]">
                <span className="text-[#6B7280]">Sous-total</span>
                <span className="text-[#1A2332] dark:text-white" style={{ fontWeight: 500 }}>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-[14px]">
                <span className="text-[#6B7280]">Frais de livraison</span>
                <span className="text-[#1A2332] dark:text-white" style={{ fontWeight: 500 }}>
                  {order.delivery_cost === 0
                    ? "Gratuite"
                    : formatPrice(order.delivery_cost)}
                </span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-[14px] text-[#10B981]">
                  <span>Remise appliquée</span>
                  <span style={{ fontWeight: 500 }}>- {formatPrice(order.discount_amount)}</span>
                </div>
              )}
              <div
                className="flex justify-between pt-4 mt-2 border-t border-[#E5E7EB] dark:border-white/10 text-lg"
                style={{ fontWeight: 700 }}
              >
                <span className="text-[#1A2332] dark:text-white">Total TTC</span>
                <span className="text-[#FF6B35]">{formatPrice(order.total_ttc)}</span>
              </div>
            </div>
          </div>

          {/* Changer Statut */}
          <div className="bg-white dark:bg-[#1E1E24] rounded-2xl border border-[#E5E7EB] dark:border-white/10 p-6">
            <h2 className="text-[15px] text-[#1A2332] dark:text-white mb-4" style={{ fontWeight: 600 }}>
              Gérer le statut
            </h2>
            {order.next_statuses && order.next_statuses.length > 0 ? (
              <div className="space-y-4">
                <textarea
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="Note de statut optionnelle (visible dans l'historique)..."
                  className="w-full px-4 py-3 rounded-xl bg-[#F9FAFB] dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10 text-[13px] outline-none focus:border-[#FF6B35] text-[#1A2332] dark:text-white resize-none h-20"
                />
                <div className="flex flex-wrap gap-3">
                  {order.next_statuses.map((ns) => {
                    const nsc = STATUS_CONFIG[ns];
                    return (
                      <button
                        key={ns}
                        onClick={() => handleStatusChange(ns)}
                        disabled={isChanging}
                        className="px-5 py-2.5 rounded-xl text-[13px] border transition-all disabled:opacity-50 hover:opacity-90"
                        style={{
                          fontWeight: 600,
                          borderColor: nsc.color + "40",
                          color: nsc.color,
                          backgroundColor: nsc.color + "10",
                        }}
                      >
                        Passer à {nsc.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-[13px] text-[#6B7280]">Le statut de cette commande ne peut plus être modifié.</p>
            )}

            {/* Historique statuts */}
            {order.status_history && order.status_history.length > 0 && (
              <div className="mt-8 pt-6 border-t border-[#E5E7EB] dark:border-white/10">
                <h4
                  className="text-[14px] text-[#1A2332] dark:text-white mb-4"
                  style={{ fontWeight: 600 }}
                >
                  Historique de la commande
                </h4>
                <div className="space-y-4">
                  {order.status_history.map((h, i) => {
                    const hst = STATUS_CONFIG[h.status];
                    return (
                      <div
                        key={i}
                        className="flex items-start gap-4"
                      >
                        <div
                           className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                           style={{ backgroundColor: hst.color + "20", color: hst.color }}
                        >
                          <hst.icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] text-[#1A2332] dark:text-white" style={{ fontWeight: 500 }}>
                            Passée à {hst.label}
                          </p>
                          {h.note && (
                            <p className="text-[13px] text-[#6B7280] mt-1 bg-[#F9FAFB] dark:bg-white/5 p-2 rounded-lg">{h.note}</p>
                          )}
                          <p className="text-[11px] text-[#9CA3AF] mt-1.5">
                            {h.created_at ? formatDateTime(h.created_at) : ""} par {h.created_by?.name ?? "Système"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Client Info */}
          <div className="bg-white dark:bg-[#1E1E24] rounded-2xl border border-[#E5E7EB] dark:border-white/10 p-6">
            <h2 className="text-[15px] text-[#1A2332] dark:text-white mb-4" style={{ fontWeight: 600 }}>
              Informations client
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-[14px] text-[#1A2332] dark:text-white" style={{ fontWeight: 600 }}>
                  {order.client}
                </p>
              </div>
              <div className="space-y-3">
                {order.email && (
                  <div className="flex items-center gap-3 text-[13px] text-[#6B7280]">
                    <div className="w-8 h-8 rounded-lg bg-[#F9FAFB] dark:bg-white/5 flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    {order.email}
                  </div>
                )}
                {order.address?.phone && (
                  <div className="flex items-center gap-3 text-[13px] text-[#6B7280]">
                    <div className="w-8 h-8 rounded-lg bg-[#F9FAFB] dark:bg-white/5 flex items-center justify-center shrink-0">
                      <Phone className="w-4 h-4" />
                    </div>
                    {order.address.phone}
                  </div>
                )}
                {order.address && (
                  <div className="flex items-start gap-3 text-[13px] text-[#6B7280]">
                    <div className="w-8 h-8 rounded-lg bg-[#F9FAFB] dark:bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <span className="leading-relaxed">
                      {order.address.address}<br />
                      {order.address.city}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Options de paiement & expédition */}
          <div className="bg-white dark:bg-[#1E1E24] rounded-2xl border border-[#E5E7EB] dark:border-white/10 p-6">
            <h2 className="text-[15px] text-[#1A2332] dark:text-white mb-4" style={{ fontWeight: 600 }}>
              Détails paiement & livraison
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-[12px] text-[#9CA3AF] mb-1">Date de commande</p>
                <p className="text-[13px] text-[#1A2332] dark:text-white" style={{ fontWeight: 500 }}>
                  {formatDateTime(order.created_at)}
                </p>
              </div>
              <div>
                <p className="text-[12px] text-[#9CA3AF] mb-1">Méthode de livraison</p>
                <p className="text-[13px] text-[#1A2332] dark:text-white" style={{ fontWeight: 500 }}>
                  {order.delivery_method?.label ?? "Non spécifiée"}
                </p>
              </div>
              <div>
                <p className="text-[12px] text-[#9CA3AF] mb-1">Méthode de paiement</p>
                <p className="text-[13px] text-[#1A2332] dark:text-white" style={{ fontWeight: 500 }}>
                  {order.payment_method === "cash_on_delivery" ? "Paiement à la livraison" : order.payment_method}
                </p>
              </div>
              {order.estimated_delivery && (
                <div>
                  <p className="text-[12px] text-[#9CA3AF] mb-1">Livraison estimée</p>
                  <p className="text-[13px] text-[#1A2332] dark:text-white" style={{ fontWeight: 500 }}>
                    {formatShortDate(order.estimated_delivery)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Notes internes */}
          <div className="bg-white dark:bg-[#1E1E24] rounded-2xl border border-[#E5E7EB] dark:border-white/10 p-6">
            <h2 className="text-[15px] text-[#1A2332] dark:text-white mb-4" style={{ fontWeight: 600 }}>
              Notes internes
            </h2>
            <textarea
              rows={4}
              value={localNotes}
              onChange={(e) => setLocalNotes(e.target.value)}
              placeholder="Ajouter une note interne (invisible au client)..."
              className="w-full px-4 py-3 rounded-xl bg-[#F9FAFB] dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10 text-[13px] text-[#1A2332] dark:text-white outline-none focus:border-[#FF6B35] resize-none"
            />
            <button
              onClick={handleSaveNotes}
              disabled={savingNotes}
              className="mt-3 w-full py-2.5 rounded-xl bg-[#F3F4F6] dark:bg-white/10 text-[13px] text-[#6B7280] hover:text-[#1A2332] dark:hover:text-white disabled:opacity-50 transition-colors"
              style={{ fontWeight: 600 }}
            >
              {savingNotes ? "Sauvegarde..." : "Sauvegarder les notes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}