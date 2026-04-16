import { NavLink } from "react-router";
import {
  LayoutDashboard, Package, ShoppingCart, RotateCcw, Users,
  FileText, Settings, ChevronLeft, ChevronRight, LogOut, X,
  BarChart3, Boxes, Star, Grid3X3,
  Bell, Flame
} from "lucide-react";
import { useSidebar } from "./AdminLayout";

const NAV_SECTIONS = [
  {
    label: "Principal",
    items: [
      { to: "/admin", icon: LayoutDashboard, label: "Dashboard", end: true },
      { to: "/admin/analytics", icon: BarChart3, label: "Analytics" },
      { to: "/admin/produits", icon: Package, label: "Produits" },
      { to: "/admin/categories", icon: Grid3X3, label: "Catégories" },
      { to: "/admin/commandes", icon: ShoppingCart, label: "Commandes" },
      { to: "/admin/retours", icon: RotateCcw, label: "Retours" },
    ],
  },
  {
    label: "Commerce",
    items: [
      { to: "/admin/clients", icon: Users, label: "Clients" },
      { to: "/admin/inventaire", icon: Boxes, label: "Inventaire" },
    ],
  },
  {
    label: "Marketing",
    items: [
      { to: "/admin/promotions", icon: Flame, label: "Promotions" },
      { to: "/admin/avis", icon: Star, label: "Avis clients" },
      { to: "/admin/blog", icon: FileText, label: "Blog" },
    ],
  },
  {
    label: "Système",
    items: [
      { to: "/admin/notifications", icon: Bell, label: "Notifications" },
      { to: "/admin/parametres", icon: Settings, label: "Paramètres" },
    ],
  },
];

export function AdminSidebar() {
  const { collapsed, setCollapsed, mobileOpen, setMobileOpen } = useSidebar();

  // On mobile: full-width drawer. On desktop: fixed sidebar.
  const showLabels = mobileOpen || !collapsed;

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-screen bg-[#1A2332] text-white flex flex-col z-50 transition-all duration-300
          ${/* Mobile: slide in/out */""}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          w-[280px]
          ${/* Desktop: always visible, width based on collapsed */""}
          lg:translate-x-0
          ${collapsed ? "lg:w-[72px]" : "lg:w-[260px]"}
          admin-sidebar-hide-scrollbar
        `}
        style={{ fontFamily: "'Sora', sans-serif" }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="ElectroHome"
              className="w-27 h-27 object-contain shrink-0 items-center justify-center"
              loading="lazy"
            />
           
          </div>
          {/* Close button (mobile only) */}
          <button
            onClick={() => setMobileOpen(false)}
            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5 admin-sidebar-hide-scrollbar">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              {showLabels && (
                <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2 px-2">
                  {section.label}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-colors ${
                        isActive
                          ? "bg-[#FF6B35] text-white"
                          : "text-white/60 hover:bg-white/8 hover:text-white"
                      } ${!showLabels ? "justify-center" : ""}`
                    }
                  >
                    <item.icon className="w-[18px] h-[18px] shrink-0" />
                    {showLabels && <span>{item.label}</span>}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-white/10 p-3 space-y-1 shrink-0">
          <NavLink
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] text-white/60 hover:bg-white/8 hover:text-white transition-colors"
          >
            <LogOut className="w-[18px] h-[18px] shrink-0" />
            {showLabels && <span>Retour au site</span>}
          </NavLink>
          {/* Collapse toggle (desktop only) */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] text-white/40 hover:text-white/70 transition-colors w-full"
          >
            {collapsed ? (
              <ChevronRight className="w-[18px] h-[18px]" />
            ) : (
              <>
                <ChevronLeft className="w-[18px] h-[18px]" />
                <span>Réduire</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
