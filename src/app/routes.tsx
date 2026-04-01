import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { HomePage } from "./pages/HomePage";
import { CategoryPage } from "./pages/CategoryPage";
import { ProductPage } from "./pages/ProductPage";
import { CartPage } from "./pages/CartPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { AccountPage } from "./pages/AccountPage";
import { SearchPage } from "./pages/SearchPage";
import { BrandsPage } from "./pages/BrandsPage";
import { PromotionsPage } from "./pages/PromotionsPage";
import { BlogPage } from "./pages/BlogPage";
import { AboutPage } from "./pages/AboutPage";
import { ContactPage } from "./pages/ContactPage";
import { FaqPage } from "./pages/FaqPage";
import { AuthPage } from "./pages/AuthPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { AdminLayout } from "./components/admin/AdminLayout";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminProducts } from "./pages/admin/AdminProducts";
import { AdminProductForm } from "./pages/admin/AdminProductForm";
import { AdminOrders } from "./pages/admin/AdminOrders";
import { AdminOrderDetail } from "./pages/admin/AdminOrderDetail";
import { AdminClients } from "./pages/admin/AdminClients";
import { AdminReturns } from "./pages/admin/AdminReturns";
import { AdminMarketing } from "./pages/admin/AdminMarketing";
import { AdminBlog } from "./pages/admin/AdminBlog";
import { AdminSupport } from "./pages/admin/AdminSupport";
import { AdminSettings } from "./pages/admin/AdminSettings";
import { AdminAnalytics } from "./pages/admin/AdminAnalytics";
import { AdminInvoices } from "./pages/admin/AdminInvoices";
import { AdminInventory } from "./pages/admin/AdminInventory";
import { AdminReviews } from "./pages/admin/AdminReviews";
import { AdminDeliveries } from "./pages/admin/AdminDeliveries";
import { AdminCategories } from "./pages/admin/AdminCategories";
import { AdminReports } from "./pages/admin/AdminReports";
import { AdminRoles } from "./pages/admin/AdminRoles";
import { AdminLogs } from "./pages/admin/AdminLogs";
import { AdminSuppliers } from "./pages/admin/AdminSuppliers";
import { AdminImportExport } from "./pages/admin/AdminImportExport";
import { AdminNotifications } from "./pages/admin/AdminNotifications";
import { AdminPromotions } from "./pages/admin/AdminPromotions";

// ── Guards ──────────────────────────────────────────────────
import { GuestGuard } from "./components/guards/GuestGuard";
import { AuthGuard } from "./components/guards/AuthGuard";
import { AdminGuard } from "./components/guards/AdminGuard";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: HomePage },
      { path: "categorie/:slug", Component: CategoryPage },
      { path: "produit/:slug", Component: ProductPage },
      { path: "panier", Component: CartPage },
      {
        path: "commande",
        element: (
          <AuthGuard>
            <CheckoutPage />
          </AuthGuard>
        ),
      },
      { path: "recherche", Component: SearchPage },
      { path: "marques", Component: BrandsPage },
      { path: "promotions", Component: PromotionsPage },
      { path: "blog", Component: BlogPage },
      { path: "blog/:slug", Component: BlogPage },
      { path: "a-propos", Component: AboutPage },
      { path: "contact", Component: ContactPage },
      { path: "faq", Component: FaqPage },

      // ── Route protégée : compte (connecté uniquement) ───────
      {
        path: "compte",
        element: (
          <AuthGuard>
            <AccountPage />
          </AuthGuard>
        ),
      },

      // ── Route invité : auth (non connecté uniquement) ────────
      {
        path: "auth",
        element: (
          <GuestGuard>
            <AuthPage />
          </GuestGuard>
        ),
      },

      { path: "*", Component: NotFoundPage },
    ],
  },

  // ── Routes admin (connecté ET rôle admin uniquement) ─────────
  {
    path: "/admin",
    element: (
      <AdminGuard>
        <AdminLayout />
      </AdminGuard>
    ),
    children: [
      { index: true, Component: AdminDashboard },
      { path: "analytics", Component: AdminAnalytics },
      { path: "produits", Component: AdminProducts },
      { path: "produits/nouveau", Component: AdminProductForm },
      { path: "produits/modifier/:id", Component: AdminProductForm },
      { path: "categories", Component: AdminCategories },
      { path: "commandes", Component: AdminOrders },
      { path: "commandes/:id", Component: AdminOrderDetail },
      { path: "retours", Component: AdminReturns },
      { path: "clients", Component: AdminClients },
      { path: "factures", Component: AdminInvoices },
      { path: "livraisons", Component: AdminDeliveries },
      { path: "inventaire", Component: AdminInventory },
      { path: "fournisseurs", Component: AdminSuppliers },
      { path: "marketing", Component: AdminMarketing },
      { path: "promotions", Component: AdminPromotions },
      { path: "avis", Component: AdminReviews },
      { path: "blog", Component: AdminBlog },
      { path: "support", Component: AdminSupport },
      { path: "notifications", Component: AdminNotifications },
      { path: "roles", Component: AdminRoles },
      { path: "rapports", Component: AdminReports },
      { path: "logs", Component: AdminLogs },
      { path: "import-export", Component: AdminImportExport },
      { path: "parametres", Component: AdminSettings },
    ],
  },
]);
