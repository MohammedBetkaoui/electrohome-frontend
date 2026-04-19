export type StoreSettings = {
  shopName: string;
  supportEmail: string;
  phone: string;
  whatsapp: string;
  address: string;
  facebook: string;
  instagram: string;
  tiktok: string;
  youtube: string;
  workingDays: string;
  openingTime: string;
  closingTime: string;
};

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  shopName: "ElectroHome",
  supportEmail: "support@electrohome.dz",
  phone: "+213 35 68 12 34",
  whatsapp: "+213 555 00 00 00",
  address: "Rue Mohamed Boudiaf, Centre-ville, Bordj Bou Arreridj 34000",
  facebook: "https://facebook.com/electrohome.dz",
  instagram: "https://instagram.com/electrohome.dz",
  tiktok: "https://tiktok.com/@electrohome.dz",
  youtube: "https://youtube.com/@electrohome-dz",
  workingDays: "Lundi - Samedi",
  openingTime: "09:00",
  closingTime: "19:00",
};

function normalizeString(value: unknown, fallback: string) {
  return typeof value === "string" ? value : fallback;
}

export function normalizeStoreSettings(settings: Partial<StoreSettings> | null | undefined): StoreSettings {
  return {
    shopName: normalizeString(settings?.shopName, DEFAULT_STORE_SETTINGS.shopName),
    supportEmail: normalizeString(settings?.supportEmail, DEFAULT_STORE_SETTINGS.supportEmail),
    phone: normalizeString(settings?.phone, DEFAULT_STORE_SETTINGS.phone),
    whatsapp: normalizeString(settings?.whatsapp, DEFAULT_STORE_SETTINGS.whatsapp),
    address: normalizeString(settings?.address, DEFAULT_STORE_SETTINGS.address),
    facebook: normalizeString(settings?.facebook, DEFAULT_STORE_SETTINGS.facebook),
    instagram: normalizeString(settings?.instagram, DEFAULT_STORE_SETTINGS.instagram),
    tiktok: normalizeString(settings?.tiktok, DEFAULT_STORE_SETTINGS.tiktok),
    youtube: normalizeString(settings?.youtube, DEFAULT_STORE_SETTINGS.youtube),
    workingDays: normalizeString(settings?.workingDays, DEFAULT_STORE_SETTINGS.workingDays),
    openingTime: normalizeString(settings?.openingTime, DEFAULT_STORE_SETTINGS.openingTime),
    closingTime: normalizeString(settings?.closingTime, DEFAULT_STORE_SETTINGS.closingTime),
  };
}

export function formatPublicHours(settings: StoreSettings) {
  if (!settings.workingDays.trim() && !settings.openingTime && !settings.closingTime) {
    return "Horaires non renseignes";
  }

  return `${settings.workingDays} · ${settings.openingTime} - ${settings.closingTime}`;
}

export function buildWhatsAppHref(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return "#";
  }

  if (/^https?:\/\//i.test(trimmedValue)) {
    return trimmedValue;
  }

  const digits = trimmedValue.replace(/\D/g, "");

  return digits ? `https://wa.me/${digits}` : "#";
}