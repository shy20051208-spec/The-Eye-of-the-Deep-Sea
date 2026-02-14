"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Brain,
  Database,
  FileText,
  Settings,
  TrendingUp,
  Waves,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n-provider";

const navItems = [
  { href: "/", labelKey: "nav.dataManagement", icon: Database },
  { href: "/visualization", labelKey: "nav.visualization", icon: TrendingUp },
  { href: "/analysis", labelKey: "nav.analysis", icon: Brain },
  { href: "/report-export", labelKey: "nav.reportExport", icon: FileText },
  { href: "/system-management", labelKey: "nav.systemSettings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useI18n();

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

      <div className="flex items-center gap-3 border-t border-[#0e3f5e] px-4 py-4 dark:border-[#0e3f5e]">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500 text-sm font-semibold dark:bg-[#38bdf8]">
          W
        </div>
        <div className="leading-tight">
          <p className="text-sm font-medium text-sky-100 dark:text-[#f0f9ff]">
            {t("nav.userName")}
          </p>
          <p className="text-[11px] text-sky-300 dark:text-[#7dd3fc]">
            {t("nav.userRole")}
          </p>
        </div>
      </div>
    </aside>
  );
}
