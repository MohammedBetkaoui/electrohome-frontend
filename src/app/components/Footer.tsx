import { Link } from "react-router";
import { Facebook, Globe, Instagram, Mail, MapPin, Phone, Youtube } from "lucide-react";
import { useStoreSettings } from "../context/StoreSettingsContext";
import { formatPublicHours } from "../lib/storeSettings";

export function Footer() {
  const { settings } = useStoreSettings();
  const socialLinks = [
    { label: "Facebook", href: settings.facebook, icon: Facebook },
    { label: "Instagram", href: settings.instagram, icon: Instagram },
    { label: "TikTok", href: settings.tiktok, icon: Globe },
    { label: "YouTube", href: settings.youtube, icon: Youtube },
  ].filter((item) => item.href.trim().length > 0);

  return (
    <footer className="bg-[#1A1A2E] text-white mt-16 pb-16 lg:pb-0">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-20 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#E8400C] flex items-center justify-center">
                <span className="text-white text-xs" style={{ fontWeight: 700 }}>EH</span>
              </div>
              <span style={{ fontWeight: 600 }}>{settings.shopName}</span>
            </div>
            <p className="text-sm opacity-70 mb-4">Votre expert en électroménager depuis 2015. Qualité, service et conseils personnalisés.</p>
            <div className="space-y-2 text-sm opacity-70 mb-4">
              <p className="flex items-center gap-2"><Mail className="w-4 h-4" /> {settings.supportEmail}</p>
              <p className="flex items-center gap-2"><Phone className="w-4 h-4" /> {settings.phone}</p>
              <p className="flex items-start gap-2"><MapPin className="w-4 h-4 mt-0.5 shrink-0" /> <span>{settings.address}</span></p>
              <p className="flex items-center gap-2"><Globe className="w-4 h-4" /> {formatPublicHours(settings)}</p>
            </div>
            <div className="flex gap-3">
              {socialLinks.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="w-9 h-9 rounded-full border border-current/20 flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm mb-4" style={{ fontWeight: 600 }}>Navigation</h4>
            <ul className="space-y-2 text-sm opacity-70">
              {["Accueil", "Catégories", "Marques", "Promotions", "Blog"].map((l) => (
                <li key={l}><Link to="/" className="hover:opacity-100 transition-opacity">{l}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm mb-4" style={{ fontWeight: 600 }}>Service client</h4>
            <ul className="space-y-2 text-sm opacity-70">
              {["FAQ", "Contact", "Suivi de commande", "Retours", "Garantie"].map((l) => (
                <li key={l}><Link to="/faq" className="hover:opacity-100 transition-opacity">{l}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm mb-4" style={{ fontWeight: 600 }}>Informations</h4>
            <ul className="space-y-2 text-sm opacity-70">
              {["À propos", "CGV", "Politique de confidentialité", "Mentions légales", "Recrutement"].map((l) => (
                <li key={l}><Link to="/a-propos" className="hover:opacity-100 transition-opacity">{l}</Link></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-current/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm opacity-60">
          <p>© 2026 {settings.shopName} — Bordj Bou Arreridj, Algerie. Tous droits reserves.</p>
          <div className="flex items-center gap-4">
            <span>CIB</span>
            <span>Dahabia</span>
            <span>BaridiMob</span>
            <span>Espèces</span>
          </div>
        </div>
      </div>
    </footer>
  );
}