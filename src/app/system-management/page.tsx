"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { TopBar } from "@/components/layout/topbar";
import { useI18n } from "@/components/i18n-provider";
import { LocaleToggle } from "@/components/locale-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { isAdminRole, normalizeUserRole } from "@/lib/auth";
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
  管理员: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
  科研人员: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400",
  分析员: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
  学生: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  访客: "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400",
  用户: "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400",
  Admin: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
  Researcher: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400",
  Analyst: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
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
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  useEffect(() => {
    const match = document.cookie.match(/(?:^|;\s*)user=([^;]+)/);
    if (!match) {
      setCurrentUserRole(null);
      return;
    }

    try {
      const parsed = JSON.parse(decodeURIComponent(match[1])) as { role?: string };
      setCurrentUserRole(normalizeUserRole(parsed.role || null));
    } catch {
      setCurrentUserRole(null);
    }
  }, []);

  const hasAdminAccess = isAdminRole(currentUserRole);

  useEffect(() => {
    if (!hasAdminAccess) return;

    fetch("/api/users").then((r) => r.json()).then(setUsers);
    fetch("/api/audit-logs").then((r) => r.json()).then((d) => setLogs(d.data || []));
  }, [currentUserRole]);

  const filteredUsers = users.filter(
    (u) => u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase())
  );
  const filteredLogs = logs.filter(
    (l) => l.detail?.toLowerCase().includes(logSearch.toLowerCase()) || l.user.name.toLowerCase().includes(logSearch.toLowerCase())
  );

  const updateUser = async (userId: string, updates: Partial<User>) => {
    const res = await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: userId, ...updates }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Failed to update user");
      return;
    }

    const updated = await res.json();
    setUsers((prev) => prev.map((user) => (user.id === updated.id ? { ...user, ...updated } : user)));
  };

  if (!hasAdminAccess) {
    return (
      <DashboardShell
        contentClassName="p-6"
        header={<TopBar title={t("systemManagement.title")} right={<div className="flex items-center gap-3"><LocaleToggle /><ThemeToggle /></div>} />}
      >
        <div className="flex min-h-[420px] items-center justify-center">
          <div className="w-full max-w-xl rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center dark:border-amber-500/30 dark:bg-amber-500/10">
            <p className="text-lg font-semibold text-amber-700 dark:text-amber-200">权限不足</p>
            <p className="mt-2 text-sm text-amber-700/80 dark:text-amber-200/80">
              当前账号不具备系统管理权限，仅管理员可访问系统设置与操作日志页面。
            </p>
            <button
              type="button"
              onClick={() => window.location.href = "/"}
              className="mt-5 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500"
            >
              返回首页
            </button>
          </div>
        </div>
      </DashboardShell>
    );
  }

  // Backup status cards (static for design)
  const backupCards = [
    { icon: Database, label: t("systemManagement.backup.database"), value: "SQLite 3.46", color: "text-sky-500", bg: "bg-sky-50 dark:bg-sky-500/10" },
    { icon: HardDrive, label: t("systemManagement.backup.storage"), value: "2.4 MB", color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-500/10" },
    { icon: Clock, label: t("systemManagement.backup.lastBackup"), value: new Date().toLocaleDateString(), color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10" },
    { icon: Shield, label: t("systemManagement.backup.status"), value: "Healthy", color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
  ];

  const adminSummary = [
    { label: "Users", value: String(users.length), icon: Users, color: "text-sky-500", bg: "bg-sky-50 dark:bg-sky-500/10" },
    { label: "Active", value: String(users.filter((u) => u.status === "Active").length), icon: Shield, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
    { label: "Audit logs", value: String(logs.length), icon: FileText, color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-500/10" },
    { label: "Admins", value: String(users.filter((u) => isAdminRole(u.role)).length), icon: Database, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10" },
  ];

  const adminQuickActions = [
    { label: "Sync user roles", value: "/system-management" },
    { label: "View audit trail", value: "/system-management" },
    { label: "Open data operations", value: "/" },
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

      <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {adminSummary.map((card) => (
          <div key={card.label} className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-[#334155] dark:bg-[#1e293b]">
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", card.bg)}>
              <card.icon className={cn("h-5 w-5", card.color)} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{card.value}</p>
              <p className="text-xs text-slate-500">{card.label}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 dark:border-[#334155] dark:bg-[#1e293b]">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Admin controls</p>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Operations shortcuts</h3>
          </div>
          <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-600 dark:bg-red-500/10 dark:text-red-300">
            {currentUserRole}
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {adminQuickActions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => window.location.href = action.value}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-[#334155] dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              {action.label}
            </button>
          ))}
        </div>
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
                {filteredUsers.map((user) => {
                  const normalizedRole = normalizeUserRole(user.role);
                  return (
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
                        <Select
                          value={normalizedRole}
                          onValueChange={(nextRole) => updateUser(user.id, { role: normalizeUserRole(nextRole) })}
                        >
                          <SelectTrigger className="h-8 w-[140px] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="管理员">管理员</SelectItem>
                            <SelectItem value="科研人员">科研人员</SelectItem>
                            <SelectItem value="分析员">分析员</SelectItem>
                            <SelectItem value="学生">学生</SelectItem>
                            <SelectItem value="访客">访客</SelectItem>
                            <SelectItem value="用户">用户</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="px-4 text-sm text-slate-600 dark:text-slate-300">{user.department}</TableCell>
                      <TableCell className="px-4">
                        <Select
                          value={user.status}
                          onValueChange={(nextStatus) => updateUser(user.id, { status: nextStatus })}
                        >
                          <SelectTrigger className="h-8 w-[110px] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="px-4 text-xs text-slate-400">
                        {new Date(user.lastActiveAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  );
                })}
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
