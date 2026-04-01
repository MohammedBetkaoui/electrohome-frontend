import { Bell, Search, Moon, Sun, Menu, ExternalLink } from "lucide-react";
import { Link } from "react-router";
import { useSidebar } from "./AdminLayout";
import { useStore } from "../../data/store";

export function AdminTopbar({ title }: { title: string }) {
  const { darkMode, toggleDarkMode } = useStore();
  const { setMobileOpen } = useSidebar();

  return (
    <header
      className="h-16 bg-white dark:bg-[#1E1E24] border-b border-[#E5E7EB] dark:border-white/10 flex items-center justify-between px-4 lg:px-6 shrink-0"
      style={{ fontFamily: "'Sora', sans-serif" }}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="w-9 h-9 rounded-lg bg-[#F3F4F6] dark:bg-white/10 flex items-center justify-center text-[#6B7280] dark:text-white/60 hover:text-[#1A2332] dark:hover:text-white transition-colors lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-[16px] lg:text-[18px] text-[#1A2332] dark:text-white" style={{ fontWeight: 600 }}>
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-2 lg:gap-3">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Rechercher..."
            className="pl-9 pr-4 py-2 rounded-lg bg-[#F3F4F6] dark:bg-white/10 text-[13px] w-56 outline-none text-[#1A2332] dark:text-white placeholder:text-[#9CA3AF]"
          />
        </div>
        <Link
          to="/"
          className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#E5E7EB] dark:border-white/10 text-[12px] text-[#6B7280] hover:border-[#FF6B35] hover:text-[#FF6B35] transition-colors"
          style={{ fontWeight: 500 }}
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Voir le site
        </Link>
        <button
          onClick={toggleDarkMode}
          className="w-9 h-9 rounded-lg bg-[#F3F4F6] dark:bg-white/10 flex items-center justify-center text-[#6B7280] dark:text-white/60 hover:text-[#1A2332] dark:hover:text-white transition-colors"
          title={darkMode ? "Passer en mode clair" : "Passer en mode sombre"}
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <button className="w-9 h-9 rounded-lg bg-[#F3F4F6] dark:bg-white/10 flex items-center justify-center text-[#6B7280] dark:text-white/60 hover:text-[#1A2332] dark:hover:text-white transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#FF6B35] text-[9px] text-white flex items-center justify-center">
            5
          </span>
        </button>
        <div className="w-9 h-9 rounded-lg bg-[#FF6B35] flex items-center justify-center text-white text-[13px]" style={{ fontWeight: 600 }}>
          AK
        </div>
      </div>
    </header>
  );
}
