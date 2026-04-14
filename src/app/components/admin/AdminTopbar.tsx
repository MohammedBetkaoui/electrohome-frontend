import { Bell, Search, Moon, Sun, Menu, ExternalLink } from "lucide-react";
import { Link } from "react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSidebar } from "./AdminLayout";
import { useStore } from "../../data/store";
import { getAdminNotifications, type AdminNotification } from "../../api/adminNotifications";
import { getEchoClient } from "../../lib/echo";
import { ensureAdminNotificationAudioUnlock, playAdminNotificationSound } from "../../lib/adminNotificationAudio";

export function AdminTopbar({ title }: { title: string }) {
  const { darkMode, toggleDarkMode } = useStore();
  const { setMobileOpen } = useSidebar();
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadPreview, setUnreadPreview] = useState<AdminNotification[]>([]);
  const [inventoryUnreadCount, setInventoryUnreadCount] = useState(0);
  const [previewTypeFilter, setPreviewTypeFilter] = useState<"all" | "inventory" | "review">("all");
  const [reviewUnreadCount, setReviewUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const channelBoundRef = useRef(false);
  const notifMenuRef = useRef<HTMLDivElement | null>(null);
  const hasLoadedOnceRef = useRef(false);
  const knownNotificationIdsRef = useRef<Set<number>>(new Set());

  const refreshUnreadCount = async () => {
    try {
      const res = await getAdminNotifications({ limit: 12 });
      const hasNewSinceLastRefresh = hasLoadedOnceRef.current
        ? res.data.some((item) => !knownNotificationIdsRef.current.has(item.id))
        : false;
      const unreadItems = res.data.filter((n) => !n.read);

      setUnreadCount(res.meta.unreadCount ?? 0);
      setUnreadPreview(unreadItems.slice(0, 12));
      setInventoryUnreadCount(unreadItems.filter((n) => n.type === "inventory").length);
      setReviewUnreadCount(unreadItems.filter((n) => n.type === "review").length);
      knownNotificationIdsRef.current = new Set(res.data.map((item) => item.id));
      hasLoadedOnceRef.current = true;

      if (hasNewSinceLastRefresh) {
        playAdminNotificationSound();
      }
    } catch {
      // Keep topbar quiet if API is temporarily unavailable.
    }
  };

  useEffect(() => {
    ensureAdminNotificationAudioUnlock();
    void refreshUnreadCount();

    const intervalId = window.setInterval(() => {
      void refreshUnreadCount();
    }, 3000);

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void refreshUnreadCount();
      }
    };

    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  useEffect(() => {
    if (channelBoundRef.current) return;

    const echo = getEchoClient();
    if (!echo) return;

    const channel = echo.private("admin.notifications");
    channel.listen(".admin.notification.created", (_event: AdminNotification) => {
      if (knownNotificationIdsRef.current.has(_event.id)) return;

      knownNotificationIdsRef.current.add(_event.id);
      setUnreadCount((prev) => prev + 1);
      if (_event.type === "inventory") {
        setInventoryUnreadCount((prev) => prev + 1);
      }
      if (_event.type === "review") {
        setReviewUnreadCount((prev) => prev + 1);
      }
      setUnreadPreview((prev) => [
        { ..._event, read: false },
        ...prev.filter((n) => n.id !== _event.id),
      ].slice(0, 12));
      playAdminNotificationSound();
    });

    channelBoundRef.current = true;

    return () => {
      channel.stopListening(".admin.notification.created");
      echo.leaveChannel("private-admin.notifications");
      channelBoundRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!notifOpen) return;

    const onMouseDown = (event: MouseEvent) => {
      if (!notifMenuRef.current) return;
      if (!notifMenuRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    };

    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [notifOpen]);

  const previewItems = useMemo(() => {
    if (previewTypeFilter === "inventory") {
      return unreadPreview.filter((item) => item.type === "inventory").slice(0, 5);
    }

    if (previewTypeFilter === "review") {
      return unreadPreview.filter((item) => item.type === "review").slice(0, 5);
    }

    return unreadPreview.slice(0, 5);
  }, [previewTypeFilter, unreadPreview]);

  const notificationsPageLink = previewTypeFilter === "inventory"
    ? "/admin/notifications?type=inventory"
    : previewTypeFilter === "review"
      ? "/admin/notifications?type=review"
      : "/admin/notifications";

  const getNotificationTarget = (item: AdminNotification) => {
    if (item.type === "inventory") {
      return "/admin/notifications?type=inventory";
    }

    if (item.type === "review") {
      const reviewId = Number(item.payload?.review_id ?? 0);
      return reviewId > 0 ? `/admin/avis?focus=${reviewId}` : "/admin/notifications?type=review";
    }

    return "/admin/notifications";
  };

  return (
    <header
      className="h-16 bg-white dark:bg-[#1E1E24] border-b border-[#E5E7EB] dark:border-white/10 flex items-center justify-between px-4 lg:px-6 shrink-0"
      style={{ fontFamily: "'Sora', sans-serif" }}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="w-9 h-9 rounded-lg bg-[#F3F4F6] dark:bg-white/10 flex items-center justify-center text-[#6B7280] dark:text-white/60 hover:text-[#1A2332] dark:hover:text-white transition-colors lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-[16px] lg:text-[18px] text-[#1A2332] dark:text-white" style={{ fontWeight: 600 }}>
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-2 lg:gap-3">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Rechercher..."
            className="pl-9 pr-4 py-2 rounded-lg bg-[#F3F4F6] dark:bg-white/10 text-[13px] w-56 outline-none text-[#1A2332] dark:text-white placeholder:text-[#9CA3AF]"
          />
        </div>
        <Link
          to="/"
          className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#E5E7EB] dark:border-white/10 text-[12px] text-[#6B7280] hover:border-[#FF6B35] hover:text-[#FF6B35] transition-colors"
          style={{ fontWeight: 500 }}
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Voir le site
        </Link>
        <button
          onClick={toggleDarkMode}
          className="w-9 h-9 rounded-lg bg-[#F3F4F6] dark:bg-white/10 flex items-center justify-center text-[#6B7280] dark:text-white/60 hover:text-[#1A2332] dark:hover:text-white transition-colors"
          title={darkMode ? "Passer en mode clair" : "Passer en mode sombre"}
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <div className="relative" ref={notifMenuRef}>
          <button
            onClick={() => {
              setNotifOpen((prev) => !prev);
              void refreshUnreadCount();
            }}
            className="w-9 h-9 rounded-lg bg-[#F3F4F6] dark:bg-white/10 flex items-center justify-center text-[#6B7280] dark:text-white/60 hover:text-[#1A2332] dark:hover:text-white transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[#FF6B35] text-[9px] text-white flex items-center justify-center">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-[320px] rounded-xl border border-[#E5E7EB] dark:border-white/10 bg-white dark:bg-[#1E1E24] shadow-xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-[#E5E7EB] dark:border-white/10">
                <p className="text-[13px] text-[#1A2332] dark:text-white" style={{ fontWeight: 600 }}>
                  Notifications non lues
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    onClick={() => setPreviewTypeFilter("all")}
                    className={`px-2.5 py-1 rounded-md text-[11px] transition-colors ${
                      previewTypeFilter === "all"
                        ? "bg-[#FF6B35] text-white"
                        : "bg-[#F3F4F6] dark:bg-white/5 text-[#6B7280] dark:text-white/60"
                    }`}
                    style={{ fontWeight: 600 }}
                  >
                    Toutes ({unreadCount})
                  </button>
                  <button
                    onClick={() => setPreviewTypeFilter("inventory")}
                    className={`px-2.5 py-1 rounded-md text-[11px] transition-colors ${
                      previewTypeFilter === "inventory"
                        ? "bg-[#F59E0B] text-white"
                        : "bg-[#F3F4F6] dark:bg-white/5 text-[#6B7280] dark:text-white/60"
                    }`}
                    style={{ fontWeight: 600 }}
                  >
                    Inventaire ({inventoryUnreadCount})
                  </button>
                  <button
                    onClick={() => setPreviewTypeFilter("review")}
                    className={`px-2.5 py-1 rounded-md text-[11px] transition-colors ${
                      previewTypeFilter === "review"
                        ? "bg-[#0EA5E9] text-white"
                        : "bg-[#F3F4F6] dark:bg-white/5 text-[#6B7280] dark:text-white/60"
                    }`}
                    style={{ fontWeight: 600 }}
                  >
                    Avis ({reviewUnreadCount})
                  </button>
                </div>
              </div>

              <div className="max-h-[280px] overflow-y-auto">
                {previewItems.length === 0 ? (
                  <div className="px-4 py-6 text-[12px] text-[#9CA3AF] text-center">
                    {previewTypeFilter === "inventory"
                      ? "Aucune alerte inventaire non lue"
                      : previewTypeFilter === "review"
                        ? "Aucun avis en attente/non lu"
                        : "Aucune notification non lue"}
                  </div>
                ) : (
                  previewItems.map((item) => (
                    <Link
                      key={item.id}
                      to={getNotificationTarget(item)}
                      onClick={() => setNotifOpen(false)}
                      className="block px-4 py-3 border-b border-[#E5E7EB]/60 dark:border-white/5 hover:bg-[#F9FAFB] dark:hover:bg-white/5 transition-colors"
                    >
                      <p className="text-[12px] text-[#1A2332] dark:text-white line-clamp-1" style={{ fontWeight: 600 }}>
                        {item.title}
                      </p>
                      <p className="text-[11px] text-[#6B7280] dark:text-white/50 line-clamp-2 mt-0.5">
                        {item.message}
                      </p>
                    </Link>
                  ))
                )}
              </div>

              <div className="px-4 py-3 bg-[#F9FAFB] dark:bg-white/5">
                <Link
                  to={notificationsPageLink}
                  onClick={() => setNotifOpen(false)}
                  className="text-[12px] text-[#FF6B35] hover:underline"
                  style={{ fontWeight: 600 }}
                >
                  {previewTypeFilter === "inventory"
                    ? "Voir les alertes inventaire"
                    : previewTypeFilter === "review"
                      ? "Voir les notifications avis"
                      : "Voir la page des notifications"}
                </Link>
              </div>
            </div>
          )}
        </div>
        <div className="w-9 h-9 rounded-lg bg-[#FF6B35] flex items-center justify-center text-white text-[13px]" style={{ fontWeight: 600 }}>
          AK
        </div>
      </div>
    </header>
  );
}
