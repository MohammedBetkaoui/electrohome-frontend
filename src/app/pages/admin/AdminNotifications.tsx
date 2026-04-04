import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, ShoppingCart, Users, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  getAdminNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
  deleteAdminNotification,
  deleteAllAdminNotifications,
  type AdminNotification,
  type AdminNotifType,
} from "../../api/adminNotifications";
import { getEchoClient } from "../../lib/echo";

type NotifType = AdminNotifType;
type Notification = AdminNotification;

const TYPE_CFG: Record<NotifType, { label: string; color: string; icon: any }> = {
  order: { label: "Commande", color: "#FF6B35", icon: ShoppingCart },
  client: { label: "Client", color: "#8B5CF6", icon: Users },
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `Il y a ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Il y a ${hrs}h`;
  return `Il y a ${Math.floor(hrs / 24)}j`;
}

export function AdminNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const channelBoundRef = useRef(false);

  const mergeNotifications = (incoming: Notification[]) => {
    if (incoming.length === 0) return;

    setNotifications((prev) => {
      const existingIds = new Set(prev.map((item) => item.id));
      const uniqueIncoming = incoming.filter((item) => !existingIds.has(item.id));
      if (uniqueIncoming.length === 0) return prev;

      return [...uniqueIncoming, ...prev]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 120);
    });
  };

  const fetchNotifications = async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await getAdminNotifications({ limit: 40 });
      const sorted = [...res.data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setNotifications(sorted);
      setUnreadCount(res.meta.unreadCount ?? sorted.filter((n) => !n.read).length);
    } catch {
      if (!silent) {
        toast.error("Impossible de charger les notifications.");
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchNotifications();
      toast.success("Notifications mises a jour.");
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchNotifications();
  }, []);

  useEffect(() => {
    if (channelBoundRef.current) return;

    const echo = getEchoClient();
    if (!echo) {
      const intervalId = window.setInterval(() => {
        void fetchNotifications({ silent: true });
      }, 3000);

      const onVisible = () => {
        if (document.visibilityState === "visible") {
          void fetchNotifications({ silent: true });
        }
      };

      document.addEventListener("visibilitychange", onVisible);

      return () => {
        window.clearInterval(intervalId);
        document.removeEventListener("visibilitychange", onVisible);
      };
    }

    const channel = echo.private("admin.notifications");
    channel.listen(".admin.notification.created", (event: Notification) => {
      mergeNotifications([{ ...event, read: false }]);
      setUnreadCount((prev) => prev + 1);
    });

    channelBoundRef.current = true;

    return () => {
      channel.stopListening(".admin.notification.created");
      echo.leaveChannel("private-admin.notifications");
      channelBoundRef.current = false;
    };
  }, []);

  const filtered = useMemo(() => {
    let list = [...notifications];
    if (typeFilter !== "all") list = list.filter((n) => n.type === typeFilter);
    if (showUnreadOnly) list = list.filter((n) => !n.read);
    return list;
  }, [notifications, typeFilter, showUnreadOnly]);

  const markAllRead = async () => {
    try {
      await markAllAdminNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      toast.error("Impossible de marquer toutes les notifications comme lues.");
    }
  };

  const markRead = async (id: number) => {
    const target = notifications.find((n) => n.id === id);
    if (!target || target.read) return;

    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await markAdminNotificationRead(id);
    } catch {
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: false } : n));
      setUnreadCount((prev) => prev + 1);
      toast.error("Impossible de marquer cette notification comme lue.");
    }
  };

  const removeOne = async (id: number) => {
    const target = notifications.find((n) => n.id === id);
    if (!target) return;

    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (!target.read) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    try {
      await deleteAdminNotification(id);
      toast.success("Notification supprimee.");
    } catch {
      await loadInitial();
      toast.error("Impossible de supprimer la notification.");
    }
  };

  const removeAll = async () => {
    const previous = notifications;

    setNotifications([]);
    setUnreadCount(0);

    try {
      await deleteAllAdminNotifications();
      toast.success("Toutes les notifications ont ete supprimees.");
    } catch {
      setNotifications(previous);
      setUnreadCount(previous.filter((n) => !n.read).length);
      toast.error("Impossible de supprimer toutes les notifications.");
    }
  };

  return (
    <div className="space-y-5" style={{ fontFamily: "'Sora', sans-serif" }}>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-[14px] text-[#1A2332] dark:text-white" style={{ fontWeight: 600 }}>
            {unreadCount > 0 && <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#FF6B35] text-white text-[10px] mr-2" style={{ fontWeight: 600 }}>{unreadCount}</span>}
            non lu{unreadCount !== 1 ? "es" : "e"}
          </h2>
          <button onClick={() => setShowUnreadOnly(!showUnreadOnly)}
            className={`px-3 py-1.5 rounded-lg text-[12px] transition-colors ${showUnreadOnly ? "bg-[#FF6B35] text-white" : "bg-[#F3F4F6] dark:bg-white/5 text-[#6B7280]"}`}
            style={{ fontWeight: 500 }}>
            Non lues uniquement
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void handleManualRefresh()}
            disabled={isRefreshing}
            className="w-9 h-9 rounded-lg border border-[#E5E7EB] dark:border-white/10 flex items-center justify-center text-[#6B7280] hover:text-[#FF6B35] disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-[#F9FAFB] dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10 text-[13px] outline-none text-[#1A2332] dark:text-white">
            <option value="all">Tous les types</option>
            {Object.entries(TYPE_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          {unreadCount > 0 && (
            <button onClick={() => void markAllRead()} className="px-4 py-2 rounded-lg border border-[#E5E7EB] dark:border-white/10 text-[12px] text-[#6B7280] hover:border-[#FF6B35] hover:text-[#FF6B35]" style={{ fontWeight: 500 }}>
              Tout marquer comme lu
            </button>
          )}
          {notifications.length > 0 && (
            <button onClick={() => void removeAll()} className="px-4 py-2 rounded-lg border border-[#E5E7EB] dark:border-white/10 text-[12px] text-[#6B7280] hover:border-[#EF4444] hover:text-[#EF4444]" style={{ fontWeight: 500 }}>
              Tout supprimer
            </button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-[#1E1E24] rounded-xl border border-[#E5E7EB] dark:border-white/10 divide-y divide-[#E5E7EB]/50 dark:divide-white/5">
        {isLoading && <div className="text-center py-12 text-[#9CA3AF] text-[13px]">Chargement des notifications...</div>}
        {filtered.map((n) => {
          const cfg = TYPE_CFG[n.type];
          const Icon = cfg.icon;
          return (
            <div key={n.id} onClick={() => void markRead(n.id)}
              className={`flex items-start gap-3 p-4 cursor-pointer hover:bg-[#F9FAFB] dark:hover:bg-white/5 transition-colors ${!n.read ? "bg-[#FF6B35]/[0.03]" : ""}`}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: cfg.color + "15" }}>
                <Icon className="w-4 h-4" style={{ color: cfg.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  {!n.read && <div className="w-2 h-2 rounded-full bg-[#FF6B35] shrink-0" />}
                  <p className="text-[13px] text-[#1A2332] dark:text-white truncate" style={{ fontWeight: n.read ? 400 : 600 }}>{n.title}</p>
                </div>
                <p className="text-[12px] text-[#6B7280] dark:text-white/50">{n.message}</p>
                <p className="text-[11px] text-[#9CA3AF] mt-1">{timeAgo(n.date)}</p>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full shrink-0" style={{ backgroundColor: cfg.color + "15", color: cfg.color, fontWeight: 500 }}>{cfg.label}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  void removeOne(n.id);
                }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9CA3AF] hover:bg-[#EF4444]/10 hover:text-[#EF4444] transition-colors shrink-0"
                title="Supprimer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}
        {!isLoading && filtered.length === 0 && <div className="text-center py-12 text-[#9CA3AF] text-[13px]">Aucune notification</div>}
      </div>
    </div>
  );
}
