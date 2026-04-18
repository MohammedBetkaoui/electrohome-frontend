import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Truck, ShieldCheck, RefreshCw } from "lucide-react";
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
  const location = useLocation();
  const redirectTo = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;

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
        navigate(res.data.user.is_admin ? "/admin" : redirectTo || "/compte");
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
        navigate(redirectTo || "/compte");
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
    <div className="min-h-[calc(100vh-4rem)] flex font-['Inter'] relative bg-[#12121A]">
      {/* Arrière-plan global */}
      <img
        src={IMAGES.kitchen}
        alt="Background"
        className="absolute inset-0 w-full h-full object-cover opacity-[0.15] mix-blend-screen"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#0B0B13]/90 via-[#12121A]/80 to-[#1A1A24]/90 z-0" />

      {/* ── Côté gauche (visuel) ─────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative z-10 flex-col items-center justify-center">
        <div className="px-14 w-full max-w-[550px]">
          <div className="flex items-center gap-3 mb-10">
            <img src="/logo.png" alt="ElectroHome" className="h-12 object-contain drop-shadow-lg brightness-200" />
          </div>
          <h2 className="text-white text-5xl font-extrabold mb-5 tracking-tight leading-[1.1] drop-shadow-md">
            {tab === "login"
              ? "Content de vous revoir !"
              : "Créez votre compte"}
          </h2>
          <p className="text-[#D1D5DB] text-lg leading-relaxed mb-12 max-w-md">
            {tab === "login"
              ? "Connectez-vous pour accéder à vos commandes, vos produits favoris et bien plus encore."
              : "Rejoignez-nous pour profiter d'offres exclusives et accélérer vos achats."}
          </p>

          {/* Avantages */}
          <div className="space-y-4 bg-white/[0.03] backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl block">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#E8400C]/20 to-[#E8400C]/5 flex items-center justify-center shrink-0 border border-[#E8400C]/20 shadow-[0_0_15px_rgba(232,64,12,0.15)]">
                <Truck className="w-6 h-6 text-[#E8400C]" />
              </div>
              <span className="text-white/95 text-[15px] font-medium tracking-wide">Livraison gratuite dès 70 000 DA</span>
            </div>
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#10B981]/20 to-[#10B981]/5 flex items-center justify-center shrink-0 border border-[#10B981]/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                <ShieldCheck className="w-6 h-6 text-[#10B981]" />
              </div>
              <span className="text-white/95 text-[15px] font-medium tracking-wide">Paiement 100% sécurisé</span>
            </div>
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#3B82F6]/20 to-[#3B82F6]/5 flex items-center justify-center shrink-0 border border-[#3B82F6]/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                <RefreshCw className="w-6 h-6 text-[#3B82F6]" />
              </div>
              <span className="text-white/95 text-[15px] font-medium tracking-wide">Retours gratuits sous 14 jours</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Côté droit (formulaire) ──────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 overflow-y-auto relative z-10">
        <div className="w-full max-w-[480px] bg-white dark:bg-[#1A1A24]/80 dark:backdrop-blur-3xl p-8 sm:p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-black/5 dark:border-white/10 relative overflow-hidden">
          {/* subtle glow behind form */}
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#E8400C]/10 rounded-full blur-[100px] pointer-events-none" />
          
          {/* Logo mobile */}
          <div className="flex lg:hidden justify-center items-center mb-8 drop-shadow-sm">
            <img src="/logo.png" alt="ElectroHome" className="h-10 object-contain dark:brightness-200" />
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
          
          </div>

          
          
        </div>
      </div>
    </div>
  );
}
