import { Outlet, useLocation } from "react-router";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopbar } from "./AdminTopbar";

// ─── Sidebar Context ───
interface SidebarContextType {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType>(null!);
export const useSidebar = () => useContext(SidebarContext);

function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile drawer on route change
  const { pathname } = useLocation();
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close mobile drawer on resize to desktop
  useEffect(() => {
    const handler = () => {
      if (window.innerWidth >= 1024) setMobileOpen(false);
    };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed, mobileOpen, setMobileOpen }}>
      {children}
    </SidebarContext.Provider>
  );
}

// ─── Titles ───
const TITLES: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/analytics": "Analytics",
  "/admin/produits": "Gestion des Produits",
  "/admin/categories": "Catégories",
  "/admin/commandes": "Gestion des Commandes",
  "/admin/retours": "Gestion des Retours",
  "/admin/clients": "Gestion des Clients",
  "/admin/inventaire": "Inventaire & Stock",
  "/admin/fournisseurs": "Fournisseurs",
  "/admin/promotions": "Promotions",
  "/admin/avis": "Avis Clients",
  "/admin/blog": "Blog",
  "/admin/support": "Support",
  "/admin/notifications": "Centre de Notifications",
  "/admin/rapports": "Rapports",
  "/admin/parametres": "Paramètres",
};

function AdminLayoutInner() {
  const { pathname } = useLocation();
  const { collapsed } = useSidebar();
  const title = TITLES[pathname] || "Administration";

  // Desktop: margin adapts to sidebar width. Mobile: no margin (sidebar is overlay)
  const desktopMargin = collapsed ? "lg:ml-[72px]" : "lg:ml-[260px]";

  return (
    <div className="min-h-screen bg-[#F3F4F6] dark:bg-[#111114]">
      <AdminSidebar />
      <div className={`ml-0 ${desktopMargin} flex flex-col min-h-screen transition-all duration-300`}>
        <AdminTopbar title={title} />
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function AdminLayout() {
  return (
    <SidebarProvider>
      <AdminLayoutInner />
    </SidebarProvider>
  );
}