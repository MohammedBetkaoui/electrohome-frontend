import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { ShoppingCart, Heart, User, Sun, Moon, Search, Menu, X, Home, Grid3X3, Package, Shield, LogOut } from "lucide-react";
import { useStore } from "../data/store";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";


export function Header() {
  const { cart, darkMode, toggleDarkMode, searchQuery, setSearchQuery } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    toast.success("Déconnexion réussie");
    navigate("/");
  };

  const initials = user
    ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
    : "??";

  const navLinks = [
    { to: "/", label: "Accueil" },
    { to: "/categorie/refrigerateurs", label: "Catégories" },
    { to: "/marques", label: "Marques" },
    { to: "/promotions", label: "Promos" },
    { to: "/blog", label: "Blog" },
    { to: "/a-propos", label: "À propos" },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/recherche?q=${encodeURIComponent(searchQuery)}`);
    setSearchOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-[1440px] mx-auto px-2 sm:px-4 md:px-8 lg:px-20">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0 ml-0 sm:ml-0">
              <img
                src="/logo.png"
                alt="Logo ElectroHome"
                className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 object-contain drop-shadow-sm transition-all"
                style={{ maxWidth: '100%', height: 'auto' }}
                loading="lazy"
              />
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-6">
              {navLinks.map((l) => (
                <Link key={l.to} to={l.to} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {l.label}
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Search Toggle */}
              <button onClick={() => setSearchOpen(!searchOpen)} className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
                <Search className="w-4.5 h-4.5" />
              </button>
              <button onClick={toggleDarkMode} className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
                {darkMode ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
              </button>
              <Link to="/compte" className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-muted transition-colors hidden sm:flex">
                <Heart className="w-4.5 h-4.5" />
              </Link>
              <Link to="/panier" className="relative w-9 h-9 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
                <ShoppingCart className="w-4.5 h-4.5" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#E8400C] dark:bg-[#FF5722] text-white text-[10px] flex items-center justify-center" style={{ fontWeight: 600 }}>
                    {cartCount}
                  </span>
                )}
              </Link>
              {isAuthenticated ? (
                <div className="hidden sm:flex items-center gap-2">
                  <Link
                    to="/compte"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-muted transition-colors text-sm"
                  >
                    <div className="w-7 h-7 rounded-full bg-[#E8400C] text-white flex items-center justify-center text-xs font-bold">
                      {initials}
                    </div>
                    <span className="font-medium">{user?.first_name}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-red-100 text-red-500 transition-colors"
                    title="Déconnexion"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                  {user?.is_admin && (
                    <Link to="/admin" className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#FF6B35]/30 text-[#FF6B35] text-sm hover:bg-[#FF6B35] hover:text-white transition-colors">
                      <Shield className="w-4 h-4" />
                      Admin
                    </Link>
                  )}
                </div>
              ) : (
                <Link to="/auth" className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:opacity-90 transition-opacity">
                  <User className="w-4 h-4" />
                  Se connecter
                </Link>
              )}
              <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Search Bar */}
          {searchOpen && (
            <form onSubmit={handleSearch} className="pb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un produit..."
                  className="flex-1 px-4 py-2.5 rounded-lg bg-input-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  autoFocus
                />
                <button type="submit" className="px-5 py-2.5 rounded-lg bg-[#E8400C] dark:bg-[#FF5722] text-white text-sm">Rechercher</button>
              </div>
            </form>
          )}
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="lg:hidden border-t border-border bg-card">
            <nav className="p-4 space-y-1">
              {navLinks.map((l) => (
                <Link key={l.to} to={l.to} onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 rounded-lg text-sm hover:bg-muted transition-colors">
                  {l.label}
                </Link>
              ))}
              {isAuthenticated ? (
                <>
                  <Link to="/compte" onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 rounded-lg text-sm text-[#E8400C] font-medium">
                    👤 {user?.full_name}
                  </Link>
                  <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="block w-full text-left px-4 py-2.5 rounded-lg text-sm text-red-500">
                    Déconnexion
                  </button>
                  {user?.is_admin && (
                    <Link to="/admin" onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 rounded-lg text-sm text-[#FF6B35]">
                      🔧 Administration
                    </Link>
                  )}
                </>
              ) : (
                <Link to="/auth" onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 rounded-lg text-sm text-[#E8400C]">
                  Se connecter
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-xl border-t border-border">
        <div className="flex items-center justify-around h-14">
          {[
            { to: "/", icon: Home, label: "Accueil" },
            { to: "/categorie/refrigerateurs", icon: Grid3X3, label: "Catégories" },
            { to: "/recherche?q=", icon: Search, label: "Recherche" },
            { to: "/panier", icon: ShoppingCart, label: "Panier" },
            { to: "/compte", icon: User, label: "Compte" },
          ].map((item) => (
            <Link key={item.to} to={item.to} className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-foreground transition-colors">
              <item.icon className="w-5 h-5" />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
