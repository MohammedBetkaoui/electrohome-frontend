import { useState, useEffect } from "react";
import { LayoutDashboard, Package, Heart, MapPin, MessageSquare, Settings, LogOut, ChevronRight } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { PRODUCTS, useStore } from "../data/store";
import { ProductCard } from "../components/ProductCard";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

const sideNav = [
  { id: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { id: "orders", label: "Mes commandes", icon: Package },
  { id: "favorites", label: "Mes favoris", icon: Heart },
  { id: "addresses", label: "Mes adresses", icon: MapPin },
  { id: "reviews", label: "Mes avis", icon: MessageSquare },
  { id: "settings", label: "Paramètres", icon: Settings },
];

export function AccountPage() {
  const [active, setActive] = useState("dashboard");
  const { favorites } = useStore();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  const favProducts = PRODUCTS.filter((p) => favorites.includes(p.id));

  // Redirection si non connecté
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/auth");
    }
  }, [isLoading, isAuthenticated, navigate]);

  const handleLogout = async () => {
    await logout();
    toast.success("Déconnexion réussie");
    navigate("/");
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#E8400C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const initials = `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-20 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
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
            {sideNav.map((n) => (
              <button
                key={n.id}
                onClick={() => setActive(n.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${active === n.id ? "bg-[#E8400C]/10 text-[#E8400C]" : "hover:bg-muted text-muted-foreground"}`}
                style={{ fontWeight: active === n.id ? 500 : 400 }}
              >
                <n.icon className="w-4 h-4" />{n.label}
              </button>
            ))}
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors">
              <LogOut className="w-4 h-4" />Déconnexion
            </button>
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1">
          {active === "dashboard" && (
            <div className="space-y-6">
              <h1 className="text-xl" style={{ fontWeight: 600 }}>Bienvenue, {user.first_name} ! 👋</h1>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-xl bg-card border border-border">
                  <p className="text-xs text-muted-foreground mb-1">Dernière commande</p>
                  <p className="text-sm" style={{ fontWeight: 500 }}>#EH-2026-0847</p>
                  <span className="inline-block mt-2 px-2 py-0.5 rounded text-xs bg-[#22C55E]/10 text-[#22C55E]" style={{ fontWeight: 500 }}>En cours de livraison</span>
                </div>
                <div className="p-5 rounded-xl bg-card border border-border">
                  <p className="text-xs text-muted-foreground mb-1">Points fidélité</p>
                  <p className="text-2xl text-[#E8400C]" style={{ fontWeight: 700 }}>2 450</p>
                  <p className="text-xs text-muted-foreground mt-1">= 3 500 DA de réduction</p>
                </div>
                <div className="p-5 rounded-xl bg-card border border-border">
                  <p className="text-xs text-muted-foreground mb-1">Favoris</p>
                  <p className="text-2xl" style={{ fontWeight: 700 }}>{favorites.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">produits sauvegardés</p>
                </div>
              </div>
            </div>
          )}

          {active === "orders" && (
            <div>
              <h2 className="text-xl mb-6" style={{ fontWeight: 600 }}>Mes commandes</h2>
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
                    {[
                      { id: "#EH-2026-0847", date: "24/03/2026", status: "En cours", total: "189 000 DA", color: "text-[#0A84FF]" },
                      { id: "#EH-2026-0721", date: "15/02/2026", status: "Livré", total: "109 000 DA", color: "text-[#22C55E]" },
                      { id: "#EH-2026-0543", date: "02/01/2026", status: "Livré", total: "312 000 DA", color: "text-[#22C55E]" },
                    ].map((o) => (
                      <tr key={o.id} className="border-b border-border">
                        <td className="py-3 pr-4 font-mono">{o.id}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{o.date}</td>
                        <td className="py-3 pr-4"><span className={o.color} style={{ fontWeight: 500 }}>{o.status}</span></td>
                        <td className="py-3 pr-4" style={{ fontWeight: 500 }}>{o.total}</td>
                        <td className="py-3"><button className="text-[#E8400C] text-xs hover:underline">Détails</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {active === "favorites" && (
            <div>
              <h2 className="text-xl mb-6" style={{ fontWeight: 600 }}>Mes favoris</h2>
              {favProducts.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {favProducts.map((p) => <ProductCard key={p.id} product={p} />)}
                </div>
              ) : (
                <p className="text-muted-foreground">Aucun produit en favoris pour le moment.</p>
              )}
            </div>
          )}

          {active === "addresses" && (
            <div>
              <h2 className="text-xl mb-6" style={{ fontWeight: 600 }}>Mes adresses</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-xl border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs px-2 py-0.5 rounded bg-muted" style={{ fontWeight: 500 }}>Principale</span>
                    <button className="text-xs text-[#E8400C]">Modifier</button>
                  </div>
                  <p className="text-sm" style={{ fontWeight: 500 }}>Jean Dupont</p>
                  <p className="text-sm text-muted-foreground">Rue des Martyrs, Cité 500 logts<br />34000 Bordj Bou Arréridj, Algérie</p>
                </div>
                <button className="p-5 rounded-xl border-2 border-dashed border-border flex items-center justify-center text-sm text-muted-foreground hover:border-[#E8400C] hover:text-[#E8400C] transition-colors">
                  + Ajouter une adresse
                </button>
              </div>
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
                ].map((f) => (
                  <div key={f.label}>
                    <label className="text-sm mb-1 block">{f.label}</label>
                    <input defaultValue={f.value} className="w-full px-4 py-2.5 rounded-lg border border-border bg-card text-sm" />
                  </div>
                ))}
                <button className="px-6 py-2.5 rounded-lg bg-[#E8400C] text-white text-sm hover:opacity-90">Sauvegarder</button>
              </div>
            </div>
          )}

          {active === "reviews" && (
            <div>
              <h2 className="text-xl mb-6" style={{ fontWeight: 600 }}>Mes avis</h2>
              <p className="text-muted-foreground text-sm">Vous n'avez pas encore laissé d'avis.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}