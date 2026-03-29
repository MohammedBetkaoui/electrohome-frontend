// ─────────────────────────────────────────────────────────
// components/guards/GuestGuard.tsx
// Redirige les utilisateurs DÉJÀ connectés vers /compte
// Usage : entourer la page /auth
// ─────────────────────────────────────────────────────────
import { Navigate } from "react-router";
import { useAuth } from "../../context/AuthContext";

interface Props {
  children: React.ReactNode;
}

/**
 * GuestGuard — Accessible seulement si NON connecté.
 * Un utilisateur déjà authentifié est redirigé vers /compte.
 */
export function GuestGuard({ children }: Props) {
  const { isAuthenticated, isLoading } = useAuth();

  // Attendre que l'état auth soit résolu (restauration token)
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#E8400C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Déjà connecté → redirection vers le compte
  if (isAuthenticated) {
    return <Navigate to="/compte" replace />;
  }

  return <>{children}</>;
}
