"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { TopBar } from "@/components/layout/topbar";
import { useI18n } from "@/components/i18n-provider";
import { LocaleToggle } from "@/components/locale-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Search, Shield, Users, FileText, Database, HardDrive, Clock } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  initials: string;
  role: string;
  department: string;
  status: string;
  lastActiveAt: string;
}

interface AuditLog {
  id: string;
  action: string;
  detail: string;
  createdAt: string;
  user: { name: string; initials: string };
}

const roleColors: Record<string, string> = {
  Admin: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
  Researcher: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400",
  Analyst: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
  Student: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  Viewer: "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400",
};

const statusColors: Record<string, string> = {
  Active: "text-emerald-600 dark:text-emerald-400",
  Pending: "text-amber-600 dark:text-amber-400",
  Inactive: "text-slate-400",
};

const actionIcons: Record<string, string> = {
  uploaded_dataset: "📤",
  ran_analysis: "🔬",
  exported_report: "📄",
  modified_metadata: "✏️",
  verified_data: "✅",
  deleted_records: "🗑️",
};

export default function SystemManagementPage() {
  const { t } = useI18n();
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [logSearch, setLogSearch] = useState("");

  useEffect(() => {
    fetch("/api/users").then((r) => r.json()).then(setUsers);
    fetch("/api/audit-logs").then((r) => r.json()).then((d) => setLogs(d.data || []));
  }, []);

  const filteredUsers = users.filter(
    (u) => u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase())
  );
  const filteredLogs = logs.filter(
    (l) => l.detail?.toLowerCase().includes(logSearch.toLowerCase()) || l.user.name.toLowerCase().includes(logSearch.toLowerCase())
  );

  // Backup status cards (static for design)
  const backupCards = [
    { icon: Database, label: t("systemManagement.backup.database"), value: "SQLite 3.46", color: "text-sky-500", bg: "bg-sky-50 dark:bg-sky-500/10" },
    { icon: HardDrive, label: t("systemManagement.backup.storage"), value: "2.4 MB", color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-500/10" },
    { icon: Clock, label: t("systemManagement.backup.lastBackup"), value: new Date().toLocaleDateString(), color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10" },
    { icon: Shield, label: t("systemManagement.backup.status"), value: "Healthy", color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
  ];

  return (
    <DashboardShell
      contentClassName="p-6"
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
      {/* Backup Cards */}
      <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {backupCards.map((card) => (
          <div
            key={card.label}
            className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-[#334155] dark:bg-[#1e293b]"
          >
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", card.bg)}>
              <card.icon className={cn("h-5 w-5", card.color)} />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{card.value}</p>
              <p className="text-xs text-slate-500">{card.label}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Tabs */}
      <Tabs defaultValue="users">
        <TabsList className="mb-4 h-9 rounded-lg bg-slate-100 p-1 dark:bg-[#334155]">
          <TabsTrigger value="users" className="gap-1 text-xs">
            <Users className="h-3.5 w-3.5" />
            {t("systemManagement.tabs.users")}
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-1 text-xs">
            <FileText className="h-3.5 w-3.5" />
            {t("systemManagement.tabs.operationLogs")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <div className="mb-3 flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder={t("systemManagement.searchUsers")}
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="h-9 pl-9 text-sm"
              />
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-[#334155] dark:bg-[#1e293b]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase text-slate-400">User</TableHead>
                  <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase text-slate-400">Role</TableHead>
                  <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase text-slate-400">Department</TableHead>
                  <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase text-slate-400">Status</TableHead>
                  <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase text-slate-400">Last Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className="border-b border-slate-100 dark:border-[#1e293b]">
                    <TableCell className="px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-[11px] font-bold text-sky-600 dark:bg-sky-500/20 dark:text-sky-400">
                          {user.initials}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{user.name}</p>
                          <p className="text-[11px] text-slate-400">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4">
                      <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", roleColors[user.role])}>
                        {user.role}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 text-sm text-slate-600 dark:text-slate-300">{user.department}</TableCell>
                    <TableCell className="px-4">
                      <span className={cn("text-xs font-medium", statusColors[user.status])}>
                        {user.status}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 text-xs text-slate-400">
                      {new Date(user.lastActiveAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="logs">
          <div className="mb-3 flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder={t("systemManagement.searchLogs")}
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                className="h-9 pl-9 text-sm"
              />
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-[#334155] dark:bg-[#1e293b]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase text-slate-400">User</TableHead>
                  <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase text-slate-400">Action</TableHead>
                  <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase text-slate-400">Detail</TableHead>
                  <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase text-slate-400">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id} className="border-b border-slate-100 dark:border-[#1e293b]">
                    <TableCell className="px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                          {log.user.initials}
                        </div>
                        <span className="text-sm text-slate-700 dark:text-slate-200">{log.user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 text-sm">
                      <span className="mr-1">{actionIcons[log.action] || "📋"}</span>
                      {log.action.replaceAll("_", " ")}
                    </TableCell>
                    <TableCell className="px-4 text-sm text-slate-500">{log.detail}</TableCell>
                    <TableCell className="px-4 text-xs text-slate-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}
