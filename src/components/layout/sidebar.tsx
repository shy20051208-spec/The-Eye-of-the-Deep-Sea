"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Brain,
  Database,
  FileText,
  LogOut,
  Settings,
  ShieldCheck,
  TrendingUp,
  UserCircle2,
  Waves,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n-provider";
import { normalizeUserRole } from "@/lib/auth";

const navItems = [
  { href: "/", labelKey: "nav.dataManagement", icon: Database },
  { href: "/data-cleaning", labelKey: "nav.dataCleaning", icon: ShieldCheck },
  { href: "/visualization", labelKey: "nav.visualization", icon: TrendingUp },
  { href: "/analysis", labelKey: "nav.analysis", icon: Brain },
  { href: "/report-export", labelKey: "nav.reportExport", icon: FileText },
  { href: "/profile", labelKey: "nav.profile", icon: UserCircle2 },
  { href: "/system-management", labelKey: "nav.systemSettings", icon: Settings },
];

interface UserCookie {
  id?: string | number;
  name?: string;
  email?: string;
  role?: string;
}

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useI18n();
  const [user, setUser] = useState<UserCookie | null>(null);

  useEffect(() => {
    const parseUser = () => {
      if (typeof document === "undefined") return null;
      const match = document.cookie.match(/(?:^|;\s*)user=([^;]+)/);
      if (!match) return null;

      try {
        return JSON.parse(decodeURIComponent(match[1])) as UserCookie;
      } catch {
        return null;
      }
    };

    setUser(parseUser());
  }, []);

  const handleLogout = () => {
    document.cookie = "user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=lax";
    window.location.href = "/login";
  };

  const displayName = user?.name || user?.email?.split("@")[0] || "访客";
  const roleLabel = normalizeUserRole(user?.role);

  return (
    <aside className="hidden h-screen w-64 flex-col bg-[#0c4a6e] text-white md:flex dark:bg-[#0a1628]">
      <div className="flex h-16 items-center gap-3 border-b border-[#0e3f5e] px-5 dark:border-[#0e3f5e]">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-400/20 text-sky-300 dark:text-[#7dd3fc]">
          <Waves className="h-4 w-4" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-sky-100 dark:text-[#f0f9ff]">
            {t("nav.appName")}
          </p>
          <p className="text-[11px] text-sky-300 dark:text-[#7dd3fc]">
            {t("nav.appSubtitle")}
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-10 items-center gap-3 rounded-lg px-3 text-sm transition",
                active
                  ? "bg-sky-500 text-white dark:bg-[#38bdf8] dark:text-white"
                  : "text-slate-300 hover:bg-sky-500/20 hover:text-white dark:text-[#64748b] dark:hover:bg-[#1e293b] dark:hover:text-white"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4",
                  active
                    ? "text-white dark:text-[#1e293b]"
                    : "text-sky-300 dark:text-[#7dd3fc]"
                )}
              />
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[#0e3f5e] px-4 py-4 dark:border-[#0e3f5e]">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500 text-sm font-semibold dark:bg-[#38bdf8]">
            {displayName.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-medium text-sky-100 dark:text-[#f0f9ff]">
              {displayName}
            </p>
            <p className="text-[11px] text-sky-300 dark:text-[#7dd3fc]">
              {user?.email || roleLabel}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-sky-400/30 bg-sky-500/10 px-3 py-2 text-xs font-medium text-sky-100 transition hover:bg-sky-500/20 dark:border-sky-400/40 dark:text-[#e0f2fe]"
        >
          <LogOut className="h-3.5 w-3.5" />
          退出登录
        </button>
      </div>
    </aside>
  );
}
