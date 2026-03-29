import { useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { IMAGES } from "../data/store";
import { useAuth } from "../context/AuthContext";
import { apiLogin, apiRegister } from "../api/auth";

// ── Types des formulaires ─────────────────────────────────
interface LoginForm {
  email: string;
  password: string;
}

interface RegisterForm {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

// ── Composant principal ───────────────────────────────────
export function AuthPage() {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  // ── Formulaire Login ──────────────────────────────────
  const {
    register: regLogin,
    handleSubmit: handleLogin,
    setError: setLoginError,
    formState: { errors: loginErrors },
  } = useForm<LoginForm>();

  // ── Formulaire Register ───────────────────────────────
  const {
    register: regRegister,
    handleSubmit: handleRegister,
    setError: setRegisterError,
    watch,
    formState: { errors: registerErrors },
  } = useForm<RegisterForm>();

  // ── Soumission Login ──────────────────────────────────
  const onLogin = handleLogin(async (data) => {
    setIsLoading(true);
    try {
      const res = await apiLogin(data);

      if (res.status === "success" && res.data) {
        login(res.data.user, res.data.token);
        toast.success(`Bienvenue, ${res.data.user.first_name} ! 👋`);
        navigate(res.data.user.is_admin ? "/admin" : "/compte");
      } else {
        // Erreurs de validation ou credentials incorrects
        if (res.errors?.email) {
          setLoginError("email", { message: res.errors.email[0] });
        } else {
          toast.error(res.message || "Identifiants incorrects.");
        }
      }
    } catch {
      toast.error("Impossible de contacter le serveur. Réessayez.");
    } finally {
      setIsLoading(false);
    }
  });

  // ── Soumission Register ───────────────────────────────
  const onRegister = handleRegister(async (data) => {
    setIsLoading(true);
    try {
      const res = await apiRegister(data);

      if (res.status === "success" && res.data) {
        login(res.data.user, res.data.token);
        toast.success("Compte créé avec succès ! Bienvenue 🎉");
        navigate("/compte");
      } else {
        // Afficher les erreurs de validation champ par champ
        if (res.errors) {
          Object.entries(res.errors).forEach(([field, messages]) => {
            setRegisterError(field as keyof RegisterForm, {
              message: messages[0],
            });
          });
        } else {
          toast.error(res.message || "Une erreur est survenue.");
        }
      }
    } catch {
      toast.error("Impossible de contacter le serveur. Réessayez.");
    } finally {
      setIsLoading(false);
    }
  });

  // ── Helpers UI ────────────────────────────────────────
  const inputClass = (hasError?: boolean) =>
    `w-full px-4 py-2.5 rounded-lg border text-sm transition-colors outline-none focus:ring-2 focus:ring-[#E8400C]/30 ${
      hasError
        ? "border-red-500 bg-red-50/5"
        : "border-border bg-card focus:border-[#E8400C]"
    }`;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex">
      {/* ── Côté gauche (visuel) ─────────────────── */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <img
          src={IMAGES.kitchen}
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1A1A2E]/90 to-[#1A1A2E]/40 flex items-center">
          <div className="px-12 max-w-md">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-lg bg-[#E8400C] flex items-center justify-center">
                <span className="text-white text-sm font-bold">EH</span>
              </div>
              <span className="text-white text-lg font-semibold">
                ElectroHome
              </span>
            </div>
            <h2 className="text-white text-3xl font-bold mb-3">
              {tab === "login"
                ? "Content de vous revoir !"
                : "Bienvenue chez ElectroHome"}
            </h2>
            <p className="text-white/70">
              {tab === "login"
                ? "Connectez-vous pour accéder à vos commandes, favoris et bien plus encore."
                : "Créez votre compte pour profiter de nos offres exclusives, suivre vos commandes et gérer vos favoris."}
            </p>

            {/* Avantages */}
            <div className="mt-8 space-y-3">
              {[
                "🚚 Livraison gratuite dès 70 000 DA",
                "🔒 Paiement 100% sécurisé",
                "🔄 Retours gratuits sous 14 jours",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <span className="text-white/90 text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Côté droit (formulaire) ──────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        <div className="w-full max-w-md py-8">
          {/* Logo mobile */}
          <div className="flex lg:hidden items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-lg bg-[#E8400C] flex items-center justify-center">
              <span className="text-white text-xs font-bold">EH</span>
            </div>
            <span className="font-semibold">ElectroHome</span>
          </div>

          {/* Tabs */}
          <div className="flex mb-8 bg-muted rounded-xl p-1">
            <button
              onClick={() => setTab("login")}
              className={`flex-1 py-2.5 rounded-lg text-sm transition-all ${
                tab === "login"
                  ? "bg-card shadow-sm text-foreground font-semibold"
                  : "text-muted-foreground"
              }`}
            >
              Connexion
            </button>
            <button
              onClick={() => setTab("register")}
              className={`flex-1 py-2.5 rounded-lg text-sm transition-all ${
                tab === "register"
                  ? "bg-card shadow-sm text-foreground font-semibold"
                  : "text-muted-foreground"
              }`}
            >
              Créer un compte
            </button>
          </div>

          {/* ────── Formulaire LOGIN ────── */}
          {tab === "login" && (
            <form onSubmit={onLogin} className="space-y-4">
              {/* Email */}
              <div>
                <label className="text-sm mb-1 block font-medium">Email</label>
                <input
                  type="email"
                  placeholder="votre@email.com"
                  className={inputClass(!!loginErrors.email)}
                  {...regLogin("email", {
                    required: "L'email est obligatoire",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Email invalide",
                    },
                  })}
                />
                {loginErrors.email && (
                  <p className="text-red-500 text-xs mt-1">
                    {loginErrors.email.message}
                  </p>
                )}
              </div>

              {/* Mot de passe */}
              <div>
                <label className="text-sm mb-1 block font-medium">
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className={inputClass(!!loginErrors.password)}
                    {...regLogin("password", {
                      required: "Le mot de passe est obligatoire",
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {loginErrors.password && (
                  <p className="text-red-500 text-xs mt-1">
                    {loginErrors.password.message}
                  </p>
                )}
              </div>

              {/* Mot de passe oublié */}
              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-xs text-[#E8400C] hover:underline"
                >
                  Mot de passe oublié ?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[#E8400C] text-white hover:opacity-90 transition-opacity disabled:opacity-60 font-medium"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Connexion...
                  </>
                ) : (
                  "Se connecter"
                )}
              </button>
            </form>
          )}

          {/* ────── Formulaire REGISTER ────── */}
          {tab === "register" && (
            <form onSubmit={onRegister} className="space-y-4">
              {/* Prénom / Nom */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm mb-1 block font-medium">
                    Prénom
                  </label>
                  <input
                    placeholder="Jean"
                    className={inputClass(!!registerErrors.first_name)}
                    {...regRegister("first_name", {
                      required: "Obligatoire",
                      minLength: { value: 2, message: "Min 2 caractères" },
                    })}
                  />
                  {registerErrors.first_name && (
                    <p className="text-red-500 text-xs mt-1">
                      {registerErrors.first_name.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm mb-1 block font-medium">Nom</label>
                  <input
                    placeholder="Dupont"
                    className={inputClass(!!registerErrors.last_name)}
                    {...regRegister("last_name", {
                      required: "Obligatoire",
                      minLength: { value: 2, message: "Min 2 caractères" },
                    })}
                  />
                  {registerErrors.last_name && (
                    <p className="text-red-500 text-xs mt-1">
                      {registerErrors.last_name.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="text-sm mb-1 block font-medium">Email</label>
                <input
                  type="email"
                  placeholder="votre@email.com"
                  className={inputClass(!!registerErrors.email)}
                  {...regRegister("email", {
                    required: "L'email est obligatoire",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Email invalide",
                    },
                  })}
                />
                {registerErrors.email && (
                  <p className="text-red-500 text-xs mt-1">
                    {registerErrors.email.message}
                  </p>
                )}
              </div>

              {/* Mot de passe */}
              <div>
                <label className="text-sm mb-1 block font-medium">
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Min 8 car., 1 maj., 1 chiffre, 1 spécial"
                    className={inputClass(!!registerErrors.password)}
                    {...regRegister("password", {
                      required: "Le mot de passe est obligatoire",
                      minLength: { value: 8, message: "Minimum 8 caractères" },
                      pattern: {
                        value: /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&\-_#])/,
                        message:
                          "Doit contenir 1 maj., 1 chiffre et 1 spécial (@$!%*?&-_#)",
                      },
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {registerErrors.password && (
                  <p className="text-red-500 text-xs mt-1">
                    {registerErrors.password.message}
                  </p>
                )}
              </div>

              {/* Confirmation mot de passe */}
              <div>
                <label className="text-sm mb-1 block font-medium">
                  Confirmer le mot de passe
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={inputClass(!!registerErrors.password_confirmation)}
                  {...regRegister("password_confirmation", {
                    required: "Confirmez votre mot de passe",
                    validate: (val) =>
                      val === watch("password") ||
                      "Les mots de passe ne correspondent pas",
                  })}
                />
                {registerErrors.password_confirmation && (
                  <p className="text-red-500 text-xs mt-1">
                    {registerErrors.password_confirmation.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[#E8400C] text-white hover:opacity-90 transition-opacity disabled:opacity-60 font-medium"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Création en cours...
                  </>
                ) : (
                  "Créer mon compte"
                )}
              </button>

              <p className="text-xs text-muted-foreground text-center">
                En créant un compte, vous acceptez nos{" "}
                <button className="text-[#E8400C] hover:underline">
                  Conditions d'utilisation
                </button>
              </p>
            </form>
          )}

          {/* Séparateur OAuth */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-background text-xs text-muted-foreground">
                ou continuer avec
              </span>
            </div>
          </div>

          {/* Boutons OAuth (non actifs — placeholder) */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => toast.info("OAuth Google bientôt disponible")}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm hover:bg-muted transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </button>
            <button
              type="button"
              onClick={() => toast.info("OAuth Apple bientôt disponible")}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm hover:bg-muted transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              Apple
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
