"use client";

import {
  ArrowDownUp,
  Bell,
  CalendarDays,
  Database,
  Download,
  Droplets,
  Eye,
  MapPin,
  Pencil,
  SlidersHorizontal,
  Search,
  Thermometer,
  Trash2,
  Upload,
  UploadCloud,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { TopBar } from "@/components/layout/topbar";
import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleToggle } from "@/components/locale-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { datasets, stats } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n-provider";

const statusStyles: Record<string, string> = {
  Verified:
    "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200",
  Pending:
    "border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-200",
  Flagged:
    "border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-200",
};

const statIcons = {
  database: Database,
  "map-pin": MapPin,
  thermometer: Thermometer,
  droplets: Droplets,
};

export default function DataManagementPage() {
  const { t } = useI18n();
  const statusLabels: Record<string, string> = {
    Verified: t("status.verified"),
    Pending: t("status.pending"),
    Flagged: t("status.flagged"),
  };

  return (
    <DashboardShell
      header={
        <TopBar
          title={t("dataManagement.title")}
          right={
            <>
              <div className="relative hidden items-center md:flex">
                <Search className="absolute left-3 h-4 w-4 text-slate-400" />
                <Input
                  className="h-9 w-60 border-slate-200 bg-slate-100 pl-9 text-[13px] text-slate-700 placeholder:text-slate-400 dark:border-[#334155] dark:bg-[#1e293b] dark:text-slate-200 dark:placeholder:text-slate-500"
                  placeholder={t("common.searchDatasets")}
                />
              </div>
              <LocaleToggle />
              <ThemeToggle />
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200 dark:border-[#334155] dark:bg-[#1e293b] dark:text-[#f0f9ff] dark:hover:bg-[#334155]"
              >
                <Bell className="h-4 w-4" />
              </Button>
            </>
          }
        />
      }
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = statIcons[stat.icon as keyof typeof statIcons];
          return (
            <div
              key={stat.key}
              className="flex h-[100px] flex-col justify-between rounded-[10px] border border-slate-200 bg-white p-5 dark:border-[#334155] dark:bg-[#1e293b]"
            >
              <div className="flex items-center gap-2">
                <span
                  className="flex h-4 w-4 items-center justify-center"
                  style={{ color: stat.iconColor }}
                >
                  {Icon ? <Icon className="h-4 w-4" /> : null}
                </span>
                <span className="text-[13px] font-medium text-slate-500 dark:text-slate-300">
                  {t(stat.labelKey)}
                </span>
              </div>
              <div className="flex items-end gap-1">
                <span className="text-[28px] font-semibold text-[#0c4a6e] dark:text-[#f0f9ff]">
                  {stat.value}
                </span>
                {stat.unit ? (
                  <span className="pb-1 text-[14px] text-slate-400 dark:text-slate-400">
                    {stat.unit}
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </section>

      <section className="flex h-[120px] flex-col items-center justify-center gap-2 rounded-[10px] border-2 border-sky-500 bg-sky-50 text-center dark:border-[#38bdf8] dark:bg-[#1e293b]">
        <UploadCloud className="h-9 w-9 text-sky-500" />
        <p className="text-sm font-semibold text-[#0c4a6e] dark:text-[#f0f9ff]">
          {t("dataManagement.dragDropTitle")}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t("dataManagement.dragDropSubtitle")}
        </p>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Button className="h-[38px] gap-2 rounded-lg bg-sky-500 px-4 text-[13px] font-semibold hover:bg-sky-600">
            <Upload className="h-4 w-4" />
            {t("dataManagement.uploadCtdData")}
          </Button>
          <Select defaultValue="all">
            <SelectTrigger className="h-[38px] w-44 rounded-lg border-slate-200 bg-white text-[13px] text-slate-700 dark:border-[#334155] dark:bg-[#1e293b] dark:text-slate-200">
              <SlidersHorizontal className="mr-2 h-4 w-4 text-slate-500" />
              <SelectValue placeholder={t("dataManagement.filters.allStations")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t("dataManagement.filters.allStations")}
              </SelectItem>
              <SelectItem value="argo">
                {t("dataManagement.filters.argo")}
              </SelectItem>
              <SelectItem value="cruise">
                {t("dataManagement.filters.cruise")}
              </SelectItem>
              <SelectItem value="mooring">
                {t("dataManagement.filters.mooring")}
              </SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="north">
            <SelectTrigger className="h-[38px] w-44 rounded-lg border-slate-200 bg-white text-[13px] text-slate-700 dark:border-[#334155] dark:bg-[#1e293b] dark:text-slate-200">
              <MapPin className="mr-2 h-4 w-4 text-slate-500" />
              <SelectValue placeholder={t("dataManagement.filters.allSeaAreas")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="north">
                {t("dataManagement.filters.northPacific")}
              </SelectItem>
              <SelectItem value="south">
                {t("dataManagement.filters.southPacific")}
              </SelectItem>
              <SelectItem value="atlantic">
                {t("dataManagement.filters.atlantic")}
              </SelectItem>
              <SelectItem value="indian">
                {t("dataManagement.filters.indianOcean")}
              </SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="30">
            <SelectTrigger className="h-[38px] w-48 rounded-lg border-slate-200 bg-white text-[13px] text-slate-700 dark:border-[#334155] dark:bg-[#1e293b] dark:text-slate-200">
              <CalendarDays className="mr-2 h-4 w-4 text-slate-500" />
              <SelectValue placeholder={t("dataManagement.filters.dateRangeDefault")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">
                {t("dataManagement.filters.last7Days")}
              </SelectItem>
              <SelectItem value="30">
                {t("dataManagement.filters.last30Days")}
              </SelectItem>
              <SelectItem value="90">
                {t("dataManagement.filters.last90Days")}
              </SelectItem>
              <SelectItem value="365">
                {t("dataManagement.filters.lastYear")}
              </SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="1000">
            <SelectTrigger className="h-[38px] w-40 rounded-lg border-slate-200 bg-white text-[13px] text-slate-700 dark:border-[#334155] dark:bg-[#1e293b] dark:text-slate-200">
              <ArrowDownUp className="mr-2 h-4 w-4 text-slate-500" />
              <SelectValue placeholder={t("dataManagement.filters.depthDefault")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="100">
                {t("dataManagement.filters.depth0to100")}
              </SelectItem>
              <SelectItem value="500">
                {t("dataManagement.filters.depth0to500")}
              </SelectItem>
              <SelectItem value="1000">
                {t("dataManagement.filters.depth0to1000")}
              </SelectItem>
              <SelectItem value="2000">
                {t("dataManagement.filters.depth0to2000")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="outline"
          className="h-[38px] gap-2 rounded-lg border-slate-200 bg-white px-4 text-[13px] font-medium text-slate-700 hover:bg-slate-50 dark:border-[#334155] dark:bg-[#1e293b] dark:text-slate-200 dark:hover:bg-[#334155]"
        >
          <Download className="h-4 w-4" />
          {t("common.export")}
        </Button>
      </section>

      <section className="overflow-hidden rounded-[10px] border border-slate-200 bg-white dark:border-[#334155] dark:bg-[#1e293b]">
        <Table>
          <TableHeader>
            <TableRow className="h-11 border-b border-slate-200 bg-slate-50 dark:border-[#334155] dark:bg-[#0f172a]">
              <TableHead className="w-[120px] px-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
                {t("dataManagement.table.station")}
              </TableHead>
              <TableHead className="w-[120px] px-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
                {t("dataManagement.table.date")}
              </TableHead>
              <TableHead className="w-[100px] px-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
                {t("dataManagement.table.depth")}
              </TableHead>
              <TableHead className="w-[100px] px-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
                {t("dataManagement.table.temp")}
              </TableHead>
              <TableHead className="w-[120px] px-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
                {t("dataManagement.table.salinity")}
              </TableHead>
              <TableHead className="w-[130px] px-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
                {t("dataManagement.table.density")}
              </TableHead>
              <TableHead className="w-[100px] px-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
                {t("dataManagement.table.status")}
              </TableHead>
              <TableHead className="w-[80px] px-4 text-right text-xs font-semibold text-slate-500 dark:text-slate-400">
                {t("dataManagement.table.actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {datasets.map((row) => (
              <TableRow
                key={`${row.station}-${row.date}`}
                className="h-11 border-b border-slate-100 dark:border-[#1e293b]"
              >
                <TableCell className="px-4 text-[13px] font-semibold text-sky-500">
                  {row.station}
                </TableCell>
                <TableCell className="px-4 text-[13px] text-slate-700 dark:text-slate-200">
                  {row.date}
                </TableCell>
                <TableCell className="px-4 text-[13px] text-slate-700 dark:text-slate-200">
                  {row.depth.toFixed(1)}
                </TableCell>
                <TableCell className="px-4 text-[13px] text-slate-700 dark:text-slate-200">
                  {row.temp.toFixed(2)}
                </TableCell>
                <TableCell className="px-4 text-[13px] text-slate-700 dark:text-slate-200">
                  {row.salinity.toFixed(3)}
                </TableCell>
                <TableCell className="px-4 text-[13px] text-slate-700 dark:text-slate-200">
                  {row.density.toFixed(2)}
                </TableCell>
                <TableCell className="px-4">
                  <span
                    className={cn(
                      "inline-flex h-6 items-center rounded-full border px-2 text-[11px] font-semibold",
                      statusStyles[row.status]
                    )}
                  >
                    {statusLabels[row.status]}
                  </span>
                </TableCell>
                <TableCell className="px-4 text-right">
                  <div className="flex items-center justify-end gap-2 text-slate-400 dark:text-slate-500">
                    <Eye className="h-4 w-4" />
                    <Pencil className="h-4 w-4" />
                    <Trash2 className="h-4 w-4" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-400 dark:border-[#334155] dark:bg-[#0f172a] dark:text-slate-500">
          <span>
            {t("dataManagement.pagination.showingRecords", {
              range: "1-5",
              total: "2,847",
            })}
          </span>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  label={t("common.previous")}
                  ariaLabel={t("common.previousAria")}
                  className="h-8 w-8 rounded-md border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-[#334155] dark:bg-[#1e293b] dark:text-slate-300 dark:hover:bg-[#334155]"
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink
                  href="#"
                  isActive
                  className="h-8 w-8 rounded-md border border-sky-500 bg-sky-500 text-white hover:bg-sky-500"
                >
                  1
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink
                  href="#"
                  className="h-8 w-8 rounded-md border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-[#334155] dark:bg-[#1e293b] dark:text-slate-300 dark:hover:bg-[#334155]"
                >
                  2
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink
                  href="#"
                  className="h-8 w-8 rounded-md border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-[#334155] dark:bg-[#1e293b] dark:text-slate-300 dark:hover:bg-[#334155]"
                >
                  3
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  href="#"
                  label={t("common.next")}
                  ariaLabel={t("common.nextAria")}
                  className="h-8 w-8 rounded-md border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-[#334155] dark:bg-[#1e293b] dark:text-slate-300 dark:hover:bg-[#334155]"
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </section>
    </DashboardShell>
  );
}
