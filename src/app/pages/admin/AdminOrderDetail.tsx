import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Printer, CheckCircle2, Clock, Package,
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
  const amount = Number.isFinite(price) ? price : 0;
  const normalized = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(amount);
  return normalized.replace(/,/g, " ") + " DA";
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

function formatPaymentMethod(method: string) {
  if (method === "cash_on_delivery") return "Paiement a la livraison";
  return method;
}

async function exportOrderPdf(order: AdminOrderDetail) {
  const doc = new jsPDF();
  const pdfDoc = doc as jsPDF & { lastAutoTable?: { finalY: number } };
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const logoSrc = `${window.location.origin}/logo.png`;

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = logoSrc;

  await new Promise<void>((resolve) => {
    img.onload = () => resolve();
    img.onerror = () => resolve();
  });

  const customerName = order.address?.full_name || order.client;
  const customerPhone = order.address?.phone || order.phone || "Non renseigne";
  const customerAddress = order.address
    ? `${order.address.address}, ${order.address.city}`
    : "Adresse non renseignee";
  const deliveryEstimate = order.estimated_delivery
    ? formatShortDate(order.estimated_delivery)
    : "Non renseignee";
  const statusLabel = STATUS_CONFIG[order.status]?.label ?? order.status;

  doc.setFillColor(30, 30, 40);
  doc.rect(0, 0, pageWidth, 50, "F");

  try {
    doc.addImage(img, "PNG", 14, 8, 32, 32);
  } catch {
    doc.setTextColor(200, 180, 140);
    doc.setFontSize(18);
    doc.text("ElectroHome", 14, 28);
  }

  doc.setTextColor(200, 180, 140);
  doc.setFontSize(20);
  doc.text("FACTURE", pageWidth - 14, 22, { align: "right" });
  doc.setFontSize(10);
  doc.setTextColor(180, 180, 190);
  doc.text(`N° ${order.order_number}`, pageWidth - 14, 30, { align: "right" });
  doc.text(`Date: ${formatDateTime(order.created_at)}`, pageWidth - 14, 37, { align: "right" });

  doc.setDrawColor(200, 180, 140);
  doc.setLineWidth(1.5);
  doc.line(14, 52, pageWidth - 14, 52);

  let y = 62;

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 110);
  doc.text("Emetteur:", margin, y);
  doc.setTextColor(40, 40, 50);
  doc.setFontSize(11);
  doc.text("ElectroHome", margin, y + 7);
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 110);
  doc.text("Bourdj bou arreridj, Algerie", margin, y + 13);
  doc.text("contact@electrohome.dz", margin, y + 19);
  doc.text("Tel: +213 555 000 000", margin, y + 25);

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 110);
  doc.text("Facturer a:", pageWidth / 2 + 10, y);
  doc.setTextColor(40, 40, 50);
  doc.setFontSize(11);
  doc.text(customerName, pageWidth / 2 + 10, y + 7);
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 110);
  doc.text(customerAddress, pageWidth / 2 + 10, y + 13, { maxWidth: 80 });
  doc.text(order.email || "Email non renseigne", pageWidth / 2 + 10, y + 19);
  doc.text(`Tel: ${customerPhone}`, pageWidth / 2 + 10, y + 25);

  y += 38;

  const boxW = (pageWidth - 28 - 15) / 4;
  const boxes = [
    { label: "Commande", value: order.order_number },
    { label: "Statut", value: statusLabel },
    { label: "Paiement", value: formatPaymentMethod(order.payment_method) },
    { label: "Livraison", value: order.delivery_method?.label || "Non specifiee" },
  ];

  boxes.forEach((box, index) => {
    const bx = margin + index * (boxW + 5);
    doc.setFillColor(245, 245, 248);
    doc.roundedRect(bx, y, boxW, 22, 3, 3, "F");
    doc.setFontSize(7);
    doc.setTextColor(140, 140, 150);
    doc.text(box.label.toUpperCase(), bx + 5, y + 8);
    doc.setFontSize(9);
    doc.setTextColor(40, 40, 50);
    doc.text(box.value, bx + 5, y + 16, { maxWidth: boxW - 10 });
  });

  y += 32;

  autoTable(doc, {
    startY: y,
    head: [["Article", "Marque", "Qte", "Prix unitaire", "Total"]],
    body: order.items.map((item) => [
      item.product_name,
      item.product_brand,
      item.quantity.toString(),
      formatPrice(item.unit_price),
      formatPrice(item.subtotal),
    ]),
    theme: "plain",
    headStyles: {
      fillColor: [30, 30, 40],
      textColor: [200, 180, 140],
      fontStyle: "bold",
      fontSize: 9,
      cellPadding: 6,
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 6,
      textColor: [50, 50, 60],
    },
    alternateRowStyles: {
      fillColor: [250, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 65 },
      2: { halign: "center" },
      3: { halign: "right" },
      4: { halign: "right" },
    },
    margin: { left: margin, right: margin },
  });

  y = (pdfDoc.lastAutoTable?.finalY || y) + 10;

  const totalsX = pageWidth - 90;
  doc.setDrawColor(230, 230, 235);
  doc.setLineWidth(0.3);
  doc.line(totalsX, y, pageWidth - margin, y);

  doc.setFontSize(9);
  doc.setTextColor(100, 100, 110);
  doc.text("Sous-total", totalsX, y + 8);
  doc.text(formatPrice(order.subtotal), pageWidth - margin, y + 8, { align: "right" });

  doc.text("Frais de livraison", totalsX, y + 16);
  doc.text(
    order.delivery_cost === 0 ? "Gratuite" : formatPrice(order.delivery_cost),
    pageWidth - margin,
    y + 16,
    { align: "right" },
  );

  if (order.discount_amount > 0) {
    doc.text("Remise", totalsX, y + 24);
    doc.text(`- ${formatPrice(order.discount_amount)}`, pageWidth - margin, y + 24, {
      align: "right",
    });
    doc.line(totalsX, y + 29, pageWidth - margin, y + 29);
  } else {
    doc.line(totalsX, y + 21, pageWidth - margin, y + 21);
  }

  const totalBoxY = order.discount_amount > 0 ? y + 32 : y + 24;
  doc.setFillColor(30, 30, 40);
  doc.roundedRect(totalsX - 4, totalBoxY, pageWidth - totalsX - margin, 16, 3, 3, "F");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text("Total TTC", totalsX + 2, totalBoxY + 10);
  doc.setTextColor(200, 180, 140);
  doc.text(formatPrice(order.total_ttc), pageWidth - 18, totalBoxY + 10, { align: "right" });

  y = totalBoxY + 26;

  doc.setFontSize(8);
  doc.setTextColor(140, 140, 150);
  doc.text(`Livraison estimee: ${deliveryEstimate}`, margin, y);

  if (order.notes) {
    y += 8;
    if (y > pageHeight - 42) {
      doc.addPage();
      y = margin;
    }
    doc.setFontSize(9);
    doc.setTextColor(40, 40, 50);
    doc.text("Note interne:", margin, y);
    doc.setTextColor(100, 100, 110);
    const noteLines = doc.splitTextToSize(order.notes, pageWidth - margin * 2);
    doc.text(noteLines, margin, y + 5);
  }

  const footerY = pageHeight - 20;
  doc.setDrawColor(200, 180, 140);
  doc.setLineWidth(0.5);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 160);
  doc.text("ElectroHome - Votre specialiste en electromenager", pageWidth / 2, footerY, {
    align: "center",
  });
  doc.text("www.electrohome.dz | contact@electrohome.dz | +213 555 000 000", pageWidth / 2, footerY + 6, {
    align: "center",
  });
  doc.text("Merci pour votre confiance !", pageWidth / 2, footerY + 12, { align: "center" });

  doc.save(`facture-${order.order_number}.pdf`);
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
  const [isExportingPdf, setIsExportingPdf] = useState(false);

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

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      await exportOrderPdf(order);
      toast.success("PDF genere avec succes.");
    } catch {
      toast.error("Impossible de generer le PDF.");
    } finally {
      setIsExportingPdf(false);
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
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-[#1E1E24] border border-[#E5E7EB] dark:border-white/10 text-[13px] text-[#6B7280] hover:text-[#1A2332] dark:hover:text-white transition-colors"
            style={{ fontWeight: 500 }}
          >
            <Printer className="w-4 h-4" /> {isExportingPdf ? "Generation..." : "Facture PDF"}
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