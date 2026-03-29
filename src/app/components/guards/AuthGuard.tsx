// ─────────────────────────────────────────────────────────
// components/guards/AuthGuard.tsx
// Accessible seulement si connecté ET pas admin
// Usage : entourer /compte et toutes les pages utilisateur
// ─────────────────────────────────────────────────────────
import { Navigate, useLocation } from "react-router";
import { useAuth } from "../../context/AuthContext";

interface Props {
  children: React.ReactNode;
}

/**
 * AuthGuard — Accessible seulement si connecté ET role !== admin.
 *
 * Cas :
 *   1. Chargement → spinner
 *   2. Non connecté → /auth (avec URL de retour)
 *   3. Connecté mais admin → /admin (interface dédiée)
 *   4. Connecté utilisateur normal → accès accordé
 */
export function AuthGuard({ children }: Props) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#E8400C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Non connecté → page de connexion avec URL de retour
  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Admin → interface dédiée /admin (pas accès au compte client)
  if (user?.is_admin) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}

