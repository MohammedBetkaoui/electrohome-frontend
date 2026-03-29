// ─────────────────────────────────────────────────────────
// components/guards/AdminGuard.tsx
// Accessible seulement si connecté ET role === "admin"
// Usage : entourer toutes les pages /admin
// ─────────────────────────────────────────────────────────
import { Navigate } from "react-router";
import { useAuth } from "../../context/AuthContext";

interface Props {
  children: React.ReactNode;
}

/**
 * AdminGuard — Accessible seulement si connecté ET is_admin === true.
 *
 * Cas possibles :
 *   1. Chargement en cours → spinner
 *   2. Non connecté       → /auth
 *   3. Connecté mais pas admin → / (page d'accueil) avec message
 *   4. Admin confirmé     → accès accordé
 */
export function AdminGuard({ children }: Props) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#E8400C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Non connecté → page de connexion
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Connecté mais pas admin → page d'accueil
  if (!user?.is_admin) {
    return <Navigate to="/" replace />;
  }

  // Admin confirmé → accès
  return <>{children}</>;
}
