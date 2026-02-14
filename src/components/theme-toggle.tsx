"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n-provider";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const { t } = useI18n();
  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="outline"
      size="icon"
      className={cn(
        "relative h-9 w-9 overflow-hidden bg-slate-100 text-slate-500 hover:bg-slate-200",
        "border-slate-200 dark:border-[#334155] dark:bg-[#1e293b] dark:text-[#f0f9ff] dark:hover:bg-[#334155]",
        className
      )}
      aria-label={t("common.toggleTheme")}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 text-slate-500 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 text-slate-200 transition-all dark:rotate-0 dark:scale-100 dark:text-[#f0f9ff]" />
    </Button>
  );
}
