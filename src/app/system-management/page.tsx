"use client";

import {
  Database,
  HardDrive,
  List,
  Pencil,
  Search,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { TopBar } from "@/components/layout/topbar";
import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleToggle } from "@/components/locale-toggle";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n-provider";

const backupCards = [
  {
    titleKey: "systemManagement.backup.lastBackup",
    valueKey: "systemManagement.backup.todayTime",
    icon: HardDrive,
    iconClass:
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    badge: {
      textKey: "common.success",
      className:
        "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300",
      dotClass: "bg-emerald-600 dark:bg-emerald-300",
    },
  },
  {
    titleKey: "systemManagement.backup.storageUsed",
    value: "24.7 GB / 100 GB",
    icon: Database,
    iconClass:
      "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
  },
  {
    titleKey: "systemManagement.backup.nextScheduled",
    valueKey: "systemManagement.backup.tomorrowTime",
    icon: ShieldCheck,
    iconClass:
      "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300",
    badge: {
      textKey: "common.auto",
      className:
        "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300",
    },
  },
];

const userRows = [
  {
    name: "Dr. Zhang Wei",
    initials: "ZW",
    avatarClass: "bg-sky-500",
    email: "zhang.wei@ouc.edu.cn",
    roleKey: "roles.admin",
    roleClass:
      "bg-sky-500 text-white dark:bg-sky-500/20 dark:text-sky-200",
    departmentKey: "departments.marineScience",
    lastActiveKey: "systemManagement.logs.time.min2",
    lastActiveClass: "text-emerald-600 dark:text-emerald-400",
    statusKey: "status.active",
    statusClass: "text-emerald-600 dark:text-emerald-400",
    statusDot: "bg-emerald-600 dark:bg-emerald-400",
  },
  {
    name: "Prof. Li Ming",
    initials: "LM",
    avatarClass: "bg-violet-500",
    email: "li.ming@ouc.edu.cn",
    roleKey: "roles.researcher",
    roleClass:
      "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200",
    departmentKey: "departments.oceanography",
    lastActiveKey: "systemManagement.logs.time.hour1",
    lastActiveClass: "text-emerald-600 dark:text-emerald-400",
    statusKey: "status.active",
    statusClass: "text-emerald-600 dark:text-emerald-400",
    statusDot: "bg-emerald-600 dark:bg-emerald-400",
  },
  {
    name: "Wang Jun",
    initials: "WJ",
    avatarClass: "bg-cyan-500",
    email: "wang.jun@sjtu.edu.cn",
    roleKey: "roles.analyst",
    roleClass:
      "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200",
    departmentKey: "departments.dataScience",
    lastActiveKey: "systemManagement.logs.time.hour3",
    lastActiveClass: "text-slate-500 dark:text-slate-400",
    statusKey: "status.active",
    statusClass: "text-emerald-600 dark:text-emerald-400",
    statusDot: "bg-emerald-600 dark:bg-emerald-400",
  },
  {
    name: "Chen Yue",
    initials: "CY",
    avatarClass: "bg-amber-500",
    email: "chen.yue@pku.edu.cn",
    roleKey: "roles.student",
    roleClass:
      "border border-slate-200 text-slate-500 dark:border-slate-600 dark:text-slate-300",
    departmentKey: "departments.physics",
    lastActiveKey: "systemManagement.logs.time.day2",
    lastActiveClass: "text-slate-500 dark:text-slate-400",
    statusKey: "status.pending",
    statusClass: "text-amber-600 dark:text-amber-400",
    statusDot: "bg-amber-600 dark:bg-amber-400",
  },
  {
    name: "Sun Hao",
    initials: "SH",
    avatarClass: "bg-slate-400",
    email: "sun.hao@xmu.edu.cn",
    roleKey: "roles.viewer",
    roleClass:
      "border border-slate-200 text-slate-500 dark:border-slate-600 dark:text-slate-300",
    departmentKey: "departments.geography",
    lastActiveKey: "systemManagement.logs.time.day14",
    lastActiveClass: "text-slate-400 dark:text-slate-500",
    statusKey: "status.inactive",
    statusClass: "text-slate-400 dark:text-slate-500",
    statusDot: "bg-slate-400 dark:bg-slate-500",
  },
];

const logItems = [
  {
    dot: "bg-sky-500",
    user: "Dr. Zhang Wei",
    actionKey: "systemManagement.logs.uploadedDataset",
    timeKey: "systemManagement.logs.time.min2",
  },
  {
    dot: "bg-emerald-600",
    user: "Prof. Li Ming",
    actionKey: "systemManagement.logs.ranAnalysis",
    timeKey: "systemManagement.logs.time.hour1",
  },
  {
    dot: "bg-amber-600",
    user: "Wang Jun",
    actionKey: "systemManagement.logs.exportedReport",
    timeKey: "systemManagement.logs.time.hour3",
  },
  {
    dot: "bg-red-600",
    user: "Dr. Zhang Wei",
    actionKey: "systemManagement.logs.revokedAccess",
    timeKey: "systemManagement.logs.time.hour5",
  },
  {
    dot: "bg-violet-500",
    user: "Chen Yue",
    actionKey: "systemManagement.logs.modifiedMetadata",
    timeKey: "systemManagement.logs.time.yesterday",
  },
];

const tableColumns =
  "grid grid-cols-[220px_200px_140px_130px_120px_100px_1fr] items-center";

export default function SystemManagementPage() {
  const { t } = useI18n();
  return (
    <DashboardShell
      header={
        <TopBar
          title={t("systemManagement.title")}
          right={
            <div className="flex items-center gap-3">
              <LocaleToggle />
              <ThemeToggle />
            </div>
          }
        />
      }
    >
      <section className="flex flex-wrap items-center justify-between gap-4">
        <Tabs defaultValue="users">
          <TabsList className="h-10 rounded-lg bg-slate-100 p-1 dark:bg-[#0f172a]">
            <TabsTrigger
              value="users"
              className="rounded-md px-4 text-xs font-medium text-slate-500 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm dark:text-slate-300 dark:data-[state=active]:bg-[#1e293b] dark:data-[state=active]:text-slate-100"
            >
              {t("systemManagement.tabs.userManagement")}
            </TabsTrigger>
            <TabsTrigger
              value="logs"
              className="rounded-md px-4 text-xs font-medium text-slate-500 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm dark:text-slate-300 dark:data-[state=active]:bg-[#1e293b] dark:data-[state=active]:text-slate-100"
            >
              {t("systemManagement.tabs.operationLogs")}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-3">
          <div className="flex h-9 w-60 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-500 shadow-sm dark:border-[#334155] dark:bg-[#0f172a] dark:text-slate-300">
            <Search className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder={t("common.searchUsers")}
              className="h-full w-full bg-transparent text-xs font-medium leading-9 text-slate-700 placeholder:text-slate-400 focus:outline-none dark:text-slate-200 dark:placeholder:text-slate-500"
            />
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="h-9 w-40 rounded-md border-slate-200 bg-white text-xs font-medium text-slate-700 shadow-sm dark:border-[#334155] dark:bg-[#0f172a] dark:text-slate-200">
              <SelectValue placeholder={t("common.allRoles")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.allRoles")}</SelectItem>
              <SelectItem value="admin">{t("roles.admin")}</SelectItem>
              <SelectItem value="researcher">{t("roles.researcher")}</SelectItem>
              <SelectItem value="analyst">{t("roles.analyst")}</SelectItem>
              <SelectItem value="student">{t("roles.student")}</SelectItem>
              <SelectItem value="viewer">{t("roles.viewer")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {backupCards.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.titleKey}
              className="flex h-[72px] items-center gap-3 rounded-[10px] border border-slate-200 bg-white px-4 dark:border-[#334155] dark:bg-[#1e293b]"
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${item.iconClass}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {t(item.titleKey)}
                </p>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {item.valueKey ? t(item.valueKey) : item.value}
                </p>
              </div>
              {item.badge ? (
                <div
                  className={`flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium ${item.badge.className}`}
                >
                  {item.badge.dotClass ? (
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${item.badge.dotClass}`}
                    />
                  ) : null}
                  {item.badge.textKey ? t(item.badge.textKey) : item.badge.text}
                </div>
              ) : null}
            </div>
          );
        })}
      </section>

      <section className="grid gap-4">
        <div className="overflow-hidden rounded-[10px] border border-slate-200 bg-white dark:border-[#334155] dark:bg-[#1e293b]">
          <div
            className={`${tableColumns} h-11 border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-[0.5px] text-slate-500 dark:border-[#334155] dark:bg-[#0f172a] dark:text-slate-400`}
          >
            <div className="px-4">{t("systemManagement.users.table.user")}</div>
            <div className="px-4">{t("systemManagement.users.table.email")}</div>
            <div className="px-4">{t("systemManagement.users.table.role")}</div>
            <div className="px-4">{t("systemManagement.users.table.department")}</div>
            <div className="px-4">{t("systemManagement.users.table.lastActive")}</div>
            <div className="px-4">{t("systemManagement.users.table.status")}</div>
            <div className="px-4 text-right">{t("systemManagement.users.table.actions")}</div>
          </div>
          {userRows.map((row) => (
            <div
              key={row.email}
              className={`${tableColumns} h-14 border-b border-slate-200 text-sm text-slate-700 last:border-b-0 dark:border-[#334155] dark:text-slate-200`}
            >
              <div className="flex items-center gap-3 px-4">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold text-white ${row.avatarClass}`}
                >
                  {row.initials}
                </div>
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {row.name}
                </span>
              </div>
              <div className="px-4 text-sm text-slate-500 dark:text-slate-400">
                {row.email}
              </div>
              <div className="px-4">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${row.roleClass}`}
                >
                  {t(row.roleKey)}
                </span>
              </div>
              <div className="px-4 text-sm text-slate-500 dark:text-slate-400">
                {t(row.departmentKey)}
              </div>
              <div className={`px-4 text-sm ${row.lastActiveClass}`}>
                {t(row.lastActiveKey)}
              </div>
              <div className="px-4">
                <span
                  className={`inline-flex items-center gap-2 text-sm font-medium ${row.statusClass}`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${row.statusDot}`}
                  />
                  {t(row.statusKey)}
                </span>
              </div>
              <div className="flex items-center justify-end px-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 px-2 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-100"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  {t("common.edit")}
                </Button>
              </div>
            </div>
          ))}
          <div className="flex h-12 items-center justify-between border-t border-slate-200 bg-slate-50 px-4 text-xs text-slate-500 dark:border-[#334155] dark:bg-[#0f172a] dark:text-slate-400">
            <span>
              {t("systemManagement.users.footer", { count: 5, total: 23 })}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-400 dark:border-[#334155] dark:bg-[#1e293b] dark:text-slate-500"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-md bg-sky-500 text-xs font-semibold text-white"
              >
                1
              </button>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-xs text-slate-500 dark:border-[#334155] dark:bg-[#1e293b] dark:text-slate-400"
              >
                2
              </button>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-xs text-slate-500 dark:border-[#334155] dark:bg-[#1e293b] dark:text-slate-400"
              >
                3
              </button>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 dark:border-[#334155] dark:bg-[#1e293b] dark:text-slate-400"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[10px] border border-slate-200 bg-white dark:border-[#334155] dark:bg-[#1e293b]">
          <div className="flex h-12 items-center justify-between border-b border-slate-200 bg-slate-50 px-5 dark:border-[#334155] dark:bg-[#0f172a]">
            <div className="flex items-center gap-2 text-xs font-semibold text-sky-900 dark:text-sky-100">
              <List className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              {t("systemManagement.logs.title")}
            </div>
            <button className="text-xs font-medium text-sky-500">
              {t("common.viewAll")}
            </button>
          </div>
          <div className="space-y-2 py-2">
            {logItems.map((log) => (
              <div
                key={`${log.user}-${log.actionKey}`}
                className="flex h-10 items-center gap-3 px-5 text-xs"
              >
                <span className={`h-1.5 w-1.5 rounded-full ${log.dot}`} />
                <span className="text-slate-900 dark:text-slate-100">
                  {log.user}
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  {t(log.actionKey)}
                </span>
                <span className="ml-auto text-[11px] text-slate-400 dark:text-slate-500">
                  {t(log.timeKey)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </DashboardShell>
  );
}
