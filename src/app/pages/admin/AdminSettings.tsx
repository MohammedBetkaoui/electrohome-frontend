import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Facebook,
  Globe,
  Instagram,
  LogOut,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  RotateCcw,
  Save,
  ShieldCheck,
  Store,
  User,
  Youtube,
  type LucideIcon,
} from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { apiChangeMyPassword, apiUpdateMe } from "../../api/auth";
import {
  DEFAULT_STORE_SETTINGS,
  formatPublicHours,
  type StoreSettings,
} from "../../lib/storeSettings";
import { getAdminStoreSettings, updateAdminStoreSettings } from "../../api/storeSettings";
import { useAuth } from "../../context/AuthContext";
import { useStoreSettings } from "../../context/StoreSettingsContext";

type FieldProps = {
  label: string;
  icon: LucideIcon;
  hint?: string;
  children: ReactNode;
};

type AdminProfileForm = {
  first_name: string;
  last_name: string;
  email: string;
};

type AdminPasswordForm = {
  email: string;
  current_password: string;
  password: string;
  password_confirmation: string;
};

function formatSavedAt(value: string | null) {
  if (!value) return "Jamais enregistre";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Jamais enregistre";

  return date.toLocaleString("fr-DZ", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatLink(value: string) {
  return value.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

function formatAdminMemberSince(value?: string | null) {
  if (!value) return "Date non disponible";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date non disponible";

  return date.toLocaleDateString("fr-DZ", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function SectionCard({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-[#E5E7EB] bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#1E1E24] sm:p-6">
      <div className="mb-5 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(255,107,53,0.14),rgba(59,130,246,0.12))]">
          <Icon className="h-5 w-5 text-[#FF6B35]" />
        </div>
        <div>
          <h2 className="text-[16px] text-[#1A2332] dark:text-white" style={{ fontWeight: 700 }}>
            {title}
          </h2>
          <p className="mt-1 text-[13px] text-[#6B7280] dark:text-white/55">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function Field({ label, icon: Icon, hint, children }: FieldProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-[12px] text-[#6B7280] dark:text-white/55" style={{ fontWeight: 600 }}>
        <Icon className="h-3.5 w-3.5 text-[#FF6B35]" />
        <span>{label}</span>
      </div>
      {children}
      {hint ? <p className="text-[11px] text-[#9CA3AF]">{hint}</p> : null}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="w-full rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-[13px] text-[#1A2332] outline-none transition-colors placeholder:text-[#9CA3AF] focus:border-[#FF6B35] dark:border-white/10 dark:bg-white/5 dark:text-white"
    />
  );
}

function TextArea({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      rows={3}
      className="w-full resize-none rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-[13px] text-[#1A2332] outline-none transition-colors placeholder:text-[#9CA3AF] focus:border-[#FF6B35] dark:border-white/10 dark:bg-white/5 dark:text-white"
    />
  );
}

export function AdminSettings() {
  const navigate = useNavigate();
  const { user, token, syncUser, logout } = useAuth();
  const { settings: sharedSettings, updatedAt: sharedUpdatedAt, setResolvedSettings } = useStoreSettings();
  const [settings, setSettings] = useState<StoreSettings>(sharedSettings);
  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify(sharedSettings));
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(sharedUpdatedAt);
  const [isSaving, setIsSaving] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [adminProfile, setAdminProfile] = useState<AdminProfileForm>({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    email: user?.email || "",
  });
  const [adminSnapshot, setAdminSnapshot] = useState(() => JSON.stringify({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    email: user?.email || "",
  }));
  const [isSavingAdmin, setIsSavingAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState<AdminPasswordForm>({
    email: user?.email || "",
    current_password: "",
    password: "",
    password_confirmation: "",
  });
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const nextProfile = {
      first_name: user?.first_name || "",
      last_name: user?.last_name || "",
      email: user?.email || "",
    };

    setAdminProfile(nextProfile);
    setAdminSnapshot(JSON.stringify(nextProfile));
  }, [user?.first_name, user?.last_name, user?.email]);

  useEffect(() => {
    setAdminPassword((current) => ({
      ...current,
      email: user?.email || "",
    }));
  }, [user?.email]);

  useEffect(() => {
    let isMounted = true;

    setIsBootstrapping(true);

    getAdminStoreSettings()
      .then((resolved) => {
        if (!isMounted) {
          return;
        }

        setSettings(resolved.settings);
        setSavedSnapshot(JSON.stringify(resolved.settings));
        setLastSavedAt(resolved.updatedAt);
        setResolvedSettings(resolved);
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }

        toast.error(error instanceof Error ? error.message : "Impossible de charger les parametres de la boutique.");
      })
      .finally(() => {
        if (isMounted) {
          setIsBootstrapping(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [setResolvedSettings]);

  const isDirty = useMemo(() => JSON.stringify(settings) !== savedSnapshot, [savedSnapshot, settings]);
  const isAdminDirty = useMemo(() => JSON.stringify(adminProfile) !== adminSnapshot, [adminProfile, adminSnapshot]);

  const filledFields = useMemo(
    () => Object.values(settings).filter((value) => value.trim().length > 0).length,
    [settings],
  );

  const configuredSocials = useMemo(
    () => [settings.facebook, settings.instagram, settings.tiktok, settings.youtube].filter((value) => value.trim().length > 0).length,
    [settings.facebook, settings.instagram, settings.tiktok, settings.youtube],
  );

  const previewHours = useMemo(() => formatPublicHours(settings), [settings]);

  const socialPreviewItems = useMemo(
    () => [
      {
        label: "Facebook",
        value: settings.facebook,
        icon: Facebook,
        color: "#1877F2",
      },
      {
        label: "Instagram",
        value: settings.instagram,
        icon: Instagram,
        color: "#E1306C",
      },
      {
        label: "TikTok",
        value: settings.tiktok,
        icon: Globe,
        color: "#111827",
      },
      {
        label: "YouTube",
        value: settings.youtube,
        icon: Youtube,
        color: "#FF0000",
      },
    ].filter((item) => item.value.trim().length > 0),
    [settings.facebook, settings.instagram, settings.tiktok, settings.youtube],
  );

  const updateField = <Key extends keyof StoreSettings>(field: Key, value: StoreSettings[Key]) => {
    setSettings((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateAdminField = <Key extends keyof AdminProfileForm>(field: Key, value: AdminProfileForm[Key]) => {
    setAdminProfile((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateAdminPasswordField = <Key extends keyof AdminPasswordForm>(field: Key, value: AdminPasswordForm[Key]) => {
    setAdminPassword((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSaveAdminProfile = async () => {
    if (!token) {
      toast.error("Session administrateur introuvable.");
      return;
    }

    try {
      setIsSavingAdmin(true);

      const response = await apiUpdateMe(token, {
        first_name: adminProfile.first_name.trim(),
        last_name: adminProfile.last_name.trim(),
        email: adminProfile.email.trim(),
      });

      if (response.status !== "success" || !response.data?.user) {
        const firstError = response.errors ? Object.values(response.errors)[0]?.[0] : null;
        throw new Error(firstError || response.message || "Impossible de mettre a jour le profil administrateur.");
      }

      const nextProfile = {
        first_name: response.data.user.first_name,
        last_name: response.data.user.last_name,
        email: response.data.user.email,
      };

      syncUser(response.data.user);
      setAdminProfile(nextProfile);
      setAdminSnapshot(JSON.stringify(nextProfile));
      toast.success("Informations administrateur mises a jour.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Impossible de mettre a jour le profil administrateur."));
    } finally {
      setIsSavingAdmin(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const resolved = await updateAdminStoreSettings(settings);

      setSettings(resolved.settings);
      setLastSavedAt(resolved.updatedAt);
      setSavedSnapshot(JSON.stringify(resolved.settings));
      setResolvedSettings(resolved);

      toast.success("Parametres sauvegardes avec succes.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible de sauvegarder les parametres.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAdminPassword = async () => {
    if (!token) {
      toast.error("Session administrateur introuvable.");
      return;
    }

    try {
      setIsSavingPassword(true);

      const response = await apiChangeMyPassword(token, {
        email: adminPassword.email.trim(),
        current_password: adminPassword.current_password,
        password: adminPassword.password,
        password_confirmation: adminPassword.password_confirmation,
      });

      if (response.status !== "success") {
        const firstError = response.errors ? Object.values(response.errors)[0]?.[0] : null;
        throw new Error(firstError || response.message || "Impossible de mettre a jour le mot de passe.");
      }

      setAdminPassword((current) => ({
        ...current,
        current_password: "",
        password: "",
        password_confirmation: "",
      }));
      toast.success("Mot de passe administrateur mis a jour.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Impossible de mettre a jour le mot de passe."));
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleResetDefaults = () => {
    setSettings(DEFAULT_STORE_SETTINGS);
    toast.message("Valeurs par defaut rechargees.");
  };

  const handleAdminLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      navigate("/auth", { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="space-y-5" style={{ fontFamily: "'Sora', sans-serif" }}>
      <section className="relative overflow-hidden rounded-[32px] border border-[#E5E7EB] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#1E1E24]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,107,53,0.18),transparent_32%),radial-gradient(circle_at_left,rgba(59,130,246,0.12),transparent_30%)]" />
        <div className="relative flex flex-col gap-6 p-6 sm:p-8 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#FFE2D5] bg-[#FFF4EF] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[#FF6B35] dark:border-[#FF6B35]/20 dark:bg-[#FF6B35]/10" style={{ fontWeight: 700 }}>
              <Store className="h-3.5 w-3.5" />
              Parametres boutique
            </div>
            <h1 className="mt-4 text-[28px] leading-tight text-[#1A2332] dark:text-white sm:text-[32px]" style={{ fontWeight: 800 }}>
              Configurez la vitrine de contact de votre boutique
            </h1>
            <p className="mt-3 max-w-xl text-[14px] text-[#6B7280] dark:text-white/60">
              Renseignez les informations essentielles visibles dans le footer, la page contact et les communications de support.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {[
                "Espace admin",
                "Securite sensible",
                "Informations boutique",
                "Reseaux sociaux",
                "Horaires d'ouverture",
              ].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-[#E5E7EB] bg-white/80 px-3 py-1.5 text-[12px] text-[#1A2332] shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white/75"
                  style={{ fontWeight: 600 }}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 xl:min-w-[360px]">
            {[
              {
                label: "Champs completes",
                value: `${filledFields}/12`,
                tone: "#FF6B35",
              },
              {
                label: "Reseaux actifs",
                value: configuredSocials.toString(),
                tone: "#3B82F6",
              },
              {
                label: "WhatsApp",
                value: settings.whatsapp.trim() ? "Configure" : "Vide",
                tone: "#10B981",
              },
              {
                label: "Derniere sauvegarde",
                value: formatSavedAt(lastSavedAt),
                tone: "#8B5CF6",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-[#E5E7EB] bg-white/85 p-4 backdrop-blur dark:border-white/10 dark:bg-white/5"
              >
                <p className="text-[11px] uppercase tracking-[0.14em] text-[#9CA3AF]">{item.label}</p>
                <p className="mt-2 text-[16px] text-[#1A2332] dark:text-white" style={{ fontWeight: 700, color: item.tone }}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[32px] border border-[#F3D5B5] bg-[linear-gradient(135deg,#FFF8F3_0%,#FFFFFF_45%,#FFF1E8_100%)] p-6 shadow-[0_24px_80px_rgba(146,64,14,0.10)] dark:border-[#FF6B35]/20 dark:bg-[linear-gradient(160deg,#241A16_0%,#1E1E24_55%,#2B1E17_100%)] sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,107,53,0.18),transparent_28%),radial-gradient(circle_at_left,rgba(245,158,11,0.12),transparent_26%)]" />
        <div className="relative space-y-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#FFD8BF] bg-white/80 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[#C2410C] dark:border-[#FF6B35]/25 dark:bg-white/5 dark:text-[#FFB188]" style={{ fontWeight: 700 }}>
                <ShieldCheck className="h-3.5 w-3.5" />
                Espace administrateur
              </div>
              <h2 className="mt-4 text-[26px] leading-tight text-[#1A2332] dark:text-white" style={{ fontWeight: 800 }}>
                Gestion du compte admin et de la securite d'acces
              </h2>
              <p className="mt-3 max-w-2xl text-[14px] text-[#6B7280] dark:text-white/60">
                Cette zone est volontairement separee des parametres boutique. Elle concentre les informations du compte admin et les actions de securite les plus sensibles.
              </p>
            </div>

            <div className="rounded-[24px] border border-[#F8C9A6] bg-white/75 p-4 shadow-sm dark:border-[#FF6B35]/20 dark:bg-white/5 xl:max-w-[380px]">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FFF1E8] dark:bg-[#FF6B35]/10">
                  <AlertTriangle className="h-5 w-5 text-[#C2410C] dark:text-[#FFB188]" />
                </div>
                <div>
                  <p className="text-[13px] uppercase tracking-[0.16em] text-[#C2410C] dark:text-[#FFB188]" style={{ fontWeight: 800 }}>
                    Section sensible
                  </p>
                  <p className="mt-2 text-[13px] leading-6 text-[#6B7280] dark:text-white/60">
                    Utilisez cette zone uniquement pour les modifications de compte admin. Toute erreur d'email ou de mot de passe peut impacter l'acces au back-office.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <SectionCard
              title="Informations de l'administrateur"
              description="Mettez a jour l'identite du compte admin utilise dans le back-office et les zones connectees."
              icon={ShieldCheck}
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Prenom" icon={User}>
                  <TextInput
                    value={adminProfile.first_name}
                    onChange={(value) => updateAdminField("first_name", value)}
                    placeholder="Prenom admin"
                  />
                </Field>
                <Field label="Nom" icon={User}>
                  <TextInput
                    value={adminProfile.last_name}
                    onChange={(value) => updateAdminField("last_name", value)}
                    placeholder="Nom admin"
                  />
                </Field>
                <div className="md:col-span-2">
                  <Field label="Email administrateur" icon={Mail}>
                    <TextInput
                      type="email"
                      value={adminProfile.email}
                      onChange={(value) => updateAdminField("email", value)}
                      placeholder="admin@electrohome.dz"
                    />
                  </Field>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
                {[
                  { label: "Role", value: user?.role?.name || "Administrateur" },
                  { label: "Compte", value: user?.is_admin ? "Admin actif" : "Compte connecte" },
                  { label: "Depuis", value: formatAdminMemberSince(user?.created_at) },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] p-4 dark:border-white/10 dark:bg-white/5">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-[#9CA3AF]">{item.label}</p>
                    <p className="mt-2 text-[13px] text-[#1A2332] dark:text-white" style={{ fontWeight: 700 }}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E5E7EB] bg-white p-4 dark:border-white/10 dark:bg-white/5">
                <div>
                  <div className="inline-flex items-center gap-2 text-[13px] text-[#1A2332] dark:text-white" style={{ fontWeight: 700 }}>
                    {isAdminDirty ? (
                      <>
                        <ArrowUpRight className="h-4 w-4 text-[#FF6B35]" />
                        Modifications du profil en attente
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-[#10B981]" />
                        Profil administrateur a jour
                      </>
                    )}
                  </div>
                  <p className="mt-1 text-[12px] text-[#6B7280] dark:text-white/55">
                    Les modifications sont appliquees au compte actuellement connecte.
                  </p>
                </div>

                <button
                  onClick={handleSaveAdminProfile}
                  disabled={isSavingAdmin || !isAdminDirty}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#111827] px-4 py-2.5 text-[13px] text-white transition-colors hover:bg-[#0B1220] disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ fontWeight: 700 }}
                >
                  <Save className="h-4 w-4" />
                  {isSavingAdmin ? "Mise a jour..." : "Mettre a jour l'admin"}
                </button>
              </div>
            </SectionCard>

            <SectionCard
              title="Changement de mot de passe"
              description="Confirmez l'email du compte, saisissez le mot de passe actuel puis definez un nouveau mot de passe fort."
              icon={ShieldCheck}
            >
              <div className="rounded-2xl border border-[#FDE4D0] bg-[#FFF8F3] p-4 dark:border-[#FF6B35]/20 dark:bg-[#FF6B35]/10">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-4.5 w-4.5 text-[#C2410C] dark:text-[#FFB188]" />
                  <div>
                    <p className="text-[12px] uppercase tracking-[0.16em] text-[#C2410C] dark:text-[#FFB188]" style={{ fontWeight: 800 }}>
                      Remarque sensible
                    </p>
                    <p className="mt-2 text-[12px] leading-6 text-[#9A3412] dark:text-white/70">
                      Cette operation est sensible. L'email doit correspondre au compte admin connecte, et le nouveau mot de passe doit contenir au moins 8 caracteres, une majuscule, un chiffre et un caractere special.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Field label="Email de verification" icon={Mail} hint="Doit correspondre exactement a l'email du compte connecte.">
                    <TextInput
                      type="email"
                      value={adminPassword.email}
                      onChange={(value) => updateAdminPasswordField("email", value)}
                      placeholder="admin@electrohome.dz"
                    />
                  </Field>
                </div>
                <div className="md:col-span-2">
                  <Field label="Mot de passe actuel" icon={ShieldCheck}>
                    <TextInput
                      type="password"
                      value={adminPassword.current_password}
                      onChange={(value) => updateAdminPasswordField("current_password", value)}
                      placeholder="Mot de passe actuel"
                    />
                  </Field>
                </div>
                <Field label="Nouveau mot de passe" icon={ShieldCheck}>
                  <TextInput
                    type="password"
                    value={adminPassword.password}
                    onChange={(value) => updateAdminPasswordField("password", value)}
                    placeholder="Nouveau mot de passe"
                  />
                </Field>
                <Field label="Confirmation" icon={ShieldCheck}>
                  <TextInput
                    type="password"
                    value={adminPassword.password_confirmation}
                    onChange={(value) => updateAdminPasswordField("password_confirmation", value)}
                    placeholder="Confirmer le mot de passe"
                  />
                </Field>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E5E7EB] bg-white p-4 dark:border-white/10 dark:bg-white/5">
                <div>
                  <div className="inline-flex items-center gap-2 text-[13px] text-[#1A2332] dark:text-white" style={{ fontWeight: 700 }}>
                    <ShieldCheck className="h-4 w-4 text-[#3B82F6]" />
                    Mise a jour securisee du mot de passe
                  </div>
                  <p className="mt-1 text-[12px] text-[#6B7280] dark:text-white/55">
                    Le mot de passe n'est jamais affiche et la validation se fait cote serveur avant enregistrement. Les autres sessions actives seront fermees automatiquement apres validation.
                  </p>
                </div>

                <button
                  onClick={handleSaveAdminPassword}
                  disabled={isSavingPassword}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#B45309] px-4 py-2.5 text-[13px] text-white transition-colors hover:bg-[#92400E] disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ fontWeight: 700 }}
                >
                  <Save className="h-4 w-4" />
                  {isSavingPassword ? "Mise a jour..." : "Changer le mot de passe"}
                </button>
              </div>
            </SectionCard>
          </div>

          <div className="rounded-[28px] border border-[#E5E7EB] bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#1E1E24]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 text-[13px] text-[#1A2332] dark:text-white" style={{ fontWeight: 700 }}>
                  <LogOut className="h-4 w-4 text-[#C2410C]" />
                  Deconnexion de cette session admin
                </div>
                <p className="mt-1 max-w-2xl text-[12px] text-[#6B7280] dark:text-white/55">
                  Cette action ferme uniquement la session admin actuelle sur cet appareil. Elle n'affecte pas les autres sessions sauf lors d'un changement de mot de passe.
                </p>
              </div>

              <button
                onClick={handleAdminLogout}
                disabled={isLoggingOut}
                className="inline-flex items-center gap-2 rounded-2xl border border-[#FCA5A5] bg-[#FFF1F2] px-4 py-2.5 text-[13px] text-[#B91C1C] transition-colors hover:bg-[#FFE4E6] disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#7F1D1D] dark:bg-[#3A1114] dark:text-[#FCA5A5]"
                style={{ fontWeight: 700 }}
              >
                <LogOut className="h-4 w-4" />
                {isLoggingOut ? "Deconnexion..." : "Se deconnecter"}
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_370px]">
        <div className="space-y-5">
          <section className="sticky top-4 z-10 rounded-[28px] border border-[#E5E7EB] bg-white/95 p-4 shadow-[0_20px_45px_rgba(15,23,42,0.06)] backdrop-blur dark:border-white/10 dark:bg-[#1E1E24]/95">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 text-[13px] text-[#1A2332] dark:text-white" style={{ fontWeight: 700 }}>
                  {isBootstrapping ? (
                    <>
                      <Clock className="h-4 w-4 text-[#3B82F6]" />
                      Synchronisation avec le backend...
                    </>
                  ) : isDirty ? (
                    <>
                      <ArrowUpRight className="h-4 w-4 text-[#FF6B35]" />
                      Modifications en attente
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-[#10B981]" />
                      Configuration a jour
                    </>
                  )}
                </div>
                <p className="mt-1 text-[12px] text-[#6B7280] dark:text-white/55">
                  {isBootstrapping
                    ? "Chargement des parametres en cours..."
                    : `Derniere sauvegarde: ${formatSavedAt(lastSavedAt)}`}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleResetDefaults}
                  className="inline-flex items-center gap-2 rounded-2xl border border-[#E5E7EB] px-4 py-2.5 text-[13px] text-[#6B7280] transition-colors hover:border-[#FF6B35] hover:text-[#FF6B35] dark:border-white/10 dark:text-white/65"
                  style={{ fontWeight: 600 }}
                >
                  <RotateCcw className="h-4 w-4" />
                  Valeurs par defaut
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || isBootstrapping || !isDirty}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#FF6B35] px-4 py-2.5 text-[13px] text-white transition-colors hover:bg-[#E55A2B] disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ fontWeight: 700 }}
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? "Sauvegarde..." : "Enregistrer"}
                </button>
              </div>
            </div>
          </section>

          <SectionCard
            title="Informations boutique"
            description="Les coordonnees principales qui servent a identifier clairement la boutique sur les canaux publics."
            icon={Store}
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Nom du magasin" icon={Store}>
                <TextInput
                  value={settings.shopName}
                  onChange={(value) => updateField("shopName", value)}
                  placeholder="Ex: ElectroHome"
                />
              </Field>
              <Field label="Email support" icon={Mail}>
                <TextInput
                  type="email"
                  value={settings.supportEmail}
                  onChange={(value) => updateField("supportEmail", value)}
                  placeholder="support@electrohome.dz"
                />
              </Field>
              <Field label="Telephone" icon={Phone}>
                <TextInput
                  value={settings.phone}
                  onChange={(value) => updateField("phone", value)}
                  placeholder="+213 ..."
                />
              </Field>
              <Field label="WhatsApp" icon={MessageCircle} hint="Numero ou lien direct de contact rapide.">
                <TextInput
                  value={settings.whatsapp}
                  onChange={(value) => updateField("whatsapp", value)}
                  placeholder="+213 555 ..."
                />
              </Field>
              <div className="md:col-span-2">
                <Field label="Adresse" icon={MapPin}>
                  <TextArea
                    value={settings.address}
                    onChange={(value) => updateField("address", value)}
                    placeholder="Adresse complete de la boutique"
                  />
                </Field>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Reseaux sociaux"
            description="Les liens affichables dans le footer, la page contact et les futurs points d'entree marketing."
            icon={Globe}
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Facebook" icon={Facebook}>
                <TextInput
                  value={settings.facebook}
                  onChange={(value) => updateField("facebook", value)}
                  placeholder="https://facebook.com/..."
                />
              </Field>
              <Field label="Instagram" icon={Instagram}>
                <TextInput
                  value={settings.instagram}
                  onChange={(value) => updateField("instagram", value)}
                  placeholder="https://instagram.com/..."
                />
              </Field>
              <Field label="TikTok" icon={Globe}>
                <TextInput
                  value={settings.tiktok}
                  onChange={(value) => updateField("tiktok", value)}
                  placeholder="https://tiktok.com/@..."
                />
              </Field>
              <Field label="YouTube" icon={Youtube}>
                <TextInput
                  value={settings.youtube}
                  onChange={(value) => updateField("youtube", value)}
                  placeholder="https://youtube.com/@..."
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard
            title="Horaires d'ouverture"
            description="Les informations d'accueil qui rassurent le client et structurent clairement la disponibilite de l'equipe."
            icon={Clock}
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1.2fr)_180px_180px]">
              <Field label="Jours ouvres" icon={Clock} hint="Ex: Lundi - Samedi ou Tous les jours sauf vendredi.">
                <TextInput
                  value={settings.workingDays}
                  onChange={(value) => updateField("workingDays", value)}
                  placeholder="Lundi - Samedi"
                />
              </Field>
              <Field label="Ouverture" icon={Clock}>
                <TextInput
                  type="time"
                  value={settings.openingTime}
                  onChange={(value) => updateField("openingTime", value)}
                />
              </Field>
              <Field label="Fermeture" icon={Clock}>
                <TextInput
                  type="time"
                  value={settings.closingTime}
                  onChange={(value) => updateField("closingTime", value)}
                />
              </Field>
            </div>
          </SectionCard>
        </div>

        <aside className="space-y-5">
          <section className="overflow-hidden rounded-[28px] border border-[#E5E7EB] bg-[linear-gradient(160deg,#111827_0%,#172033_58%,#1F3B5A_100%)] p-5 text-white shadow-[0_24px_70px_rgba(15,23,42,0.14)] dark:border-white/10">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-white/70" style={{ fontWeight: 700 }}>
              Apercu footer
            </div>

            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FF6B35] text-white">
                <Store className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[18px]" style={{ fontWeight: 800 }}>
                  {settings.shopName || "Nom du magasin"}
                </p>
                <p className="text-[12px] text-white/65">Presence de contact et reseaux visibles</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3">
              {[
                { icon: Mail, label: "Support", value: settings.supportEmail || "Email non renseigne" },
                { icon: Phone, label: "Telephone", value: settings.phone || "Telephone non renseigne" },
                { icon: MessageCircle, label: "WhatsApp", value: settings.whatsapp || "WhatsApp non renseigne" },
                { icon: Clock, label: "Horaires", value: previewHours },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-white/45">
                    <item.icon className="h-3.5 w-3.5" />
                    {item.label}
                  </div>
                  <p className="mt-2 text-[13px] text-white/92" style={{ fontWeight: 600 }}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {socialPreviewItems.length > 0 ? (
                socialPreviewItems.map((item) => (
                  <span
                    key={item.label}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px]"
                    style={{ fontWeight: 700 }}
                  >
                    <item.icon className="h-3.5 w-3.5" style={{ color: item.color }} />
                    {item.label}
                  </span>
                ))
              ) : (
                <p className="text-[12px] text-white/55">Aucun reseau social configure pour le moment.</p>
              )}
            </div>
          </section>

          <section className="rounded-[28px] border border-[#E5E7EB] bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#1E1E24]">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FF6B35]/10">
                <Mail className="h-5 w-5 text-[#FF6B35]" />
              </div>
              <div>
                <h3 className="text-[15px] text-[#1A2332] dark:text-white" style={{ fontWeight: 700 }}>
                  Bloc contact public
                </h3>
                <p className="text-[12px] text-[#6B7280] dark:text-white/55">Projection de ce qui peut alimenter la page contact.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {[
                { icon: Phone, title: "Telephone", info: settings.phone || "A renseigner" },
                { icon: Mail, title: "Email", info: settings.supportEmail || "A renseigner" },
                { icon: MapPin, title: "Adresse", info: settings.address || "A renseigner" },
                { icon: Clock, title: "Horaires", info: previewHours },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] p-4 dark:border-white/10 dark:bg-white/5">
                  <item.icon className="h-4.5 w-4.5 text-[#FF6B35]" />
                  <p className="mt-3 text-[12px] text-[#1A2332] dark:text-white" style={{ fontWeight: 700 }}>
                    {item.title}
                  </p>
                  <p className="mt-1 text-[12px] leading-6 text-[#6B7280] dark:text-white/60">{item.info}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-[#E5E7EB] bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#1E1E24]">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#3B82F6]/10">
                <ArrowUpRight className="h-5 w-5 text-[#3B82F6]" />
              </div>
              <div>
                <h3 className="text-[15px] text-[#1A2332] dark:text-white" style={{ fontWeight: 700 }}>
                  Liens sociaux detectes
                </h3>
                <p className="text-[12px] text-[#6B7280] dark:text-white/55">Controle visuel rapide avant branchement public.</p>
              </div>
            </div>

            <div className="space-y-3">
              {socialPreviewItems.length > 0 ? (
                socialPreviewItems.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-[#E5E7EB] p-3 dark:border-white/10"
                  >
                    <div className="flex items-center gap-2 text-[12px] text-[#1A2332] dark:text-white" style={{ fontWeight: 700 }}>
                      <item.icon className="h-4 w-4" style={{ color: item.color }} />
                      {item.label}
                    </div>
                    <p className="mt-2 truncate text-[12px] text-[#6B7280] dark:text-white/60">{formatLink(item.value)}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-[#D1D5DB] p-4 text-[12px] text-[#9CA3AF] dark:border-white/10 dark:text-white/45">
                  Ajoutez au moins un reseau social pour enrichir le footer et la page contact.
                </div>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
