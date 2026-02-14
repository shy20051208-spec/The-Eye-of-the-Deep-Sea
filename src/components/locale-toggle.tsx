"use client";

import { Languages } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/components/i18n-provider";
import { type Locale } from "@/lib/i18n";

export function LocaleToggle() {
  const { locale, setLocale, t } = useI18n();

  return (
    <Select value={locale} onValueChange={(value) => setLocale(value as Locale)}>
      <SelectTrigger className="h-9 w-[120px] rounded-lg border-slate-200 bg-white text-[12px] font-medium text-slate-700 shadow-sm dark:border-[#334155] dark:bg-[#1e293b] dark:text-slate-200">
        <Languages className="h-4 w-4 text-slate-500 dark:text-slate-400" />
        <SelectValue placeholder={t("common.language")} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="en">{t("common.english")}</SelectItem>
        <SelectItem value="zh">{t("common.chinese")}</SelectItem>
      </SelectContent>
    </Select>
  );
}
