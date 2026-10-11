"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { TopBar } from "@/components/layout/topbar";
import { LocaleToggle } from "@/components/locale-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { normalizeUserRole } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Activity, Briefcase, Mail, ShieldCheck, UserCircle2 } from "lucide-react";

interface UserCookie {
  id?: string | number;
  name?: string;
  email?: string;
  role?: string;
}

interface UserRecord {
  id: string;
  name: string;
  email: string;
  initials: string;
  role: string;
  department: string;
  status: string;
  lastActiveAt: string;
  phone?: string | null;
  createdAt?: string;
}

interface AuditEntry {
  id: string;
  action: string;
  detail: string;
  createdAt: string;
  user: { name: string; initials: string };
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserCookie | null>(null);
  const [profile, setProfile] = useState<UserRecord | null>(null);
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);

  useEffect(() => {
    const match = document.cookie.match(/(?:^|;\s*)user=([^;]+)/);
    if (!match) return;

    try {
      setUser(JSON.parse(decodeURIComponent(match[1])) as UserCookie);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    if (!user?.email && !user?.id) return;

    const loadProfile = async () => {
      try {
        const res = await fetch("/api/users");
        const users: UserRecord[] = await res.json();
        const current = users.find((item) => {
          if (user.id) return String(item.id) === String(user.id);
          return item.email.toLowerCase() === String(user.email || "").toLowerCase();
        }) ?? null;

        setProfile(current);
      } catch {
        setProfile(null);
      }
    };

    const loadAudit = async () => {
      try {
        const res = await fetch("/api/audit-logs?page=1&pageSize=5");
        const data = await res.json();
        setAuditEntries(data.data ?? []);
      } catch {
        setAuditEntries([]);
      }
    };

    void loadProfile();
    void loadAudit();
  }, [user]);

  const activeName = profile?.name || user?.name || user?.email?.split("@")[0] || "访客";
  const activeEmail = profile?.email || user?.email || "未登录";

  return (
    <DashboardShell
      contentClassName="p-6"
      header={
        <TopBar
          title="个人资料"
          right={
            <div className="flex items-center gap-3">
              <LocaleToggle />
              <ThemeToggle />
            </div>
          }
        />
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-[#334155] dark:bg-[#1e293b]">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-100 text-xl font-bold text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
              {(profile?.initials || activeName).slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{activeName}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{activeEmail}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <InfoTile icon={Mail} label="邮箱" value={activeEmail} />
            <InfoTile icon={Briefcase} label="部门" value={profile?.department || "未设置"} />
            <InfoTile icon={ShieldCheck} label="角色" value={normalizeUserRole(profile?.role || user?.role || "用户")} />
            <InfoTile icon={Activity} label="状态" value={profile?.status || "Active"} tone="green" />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-[#334155] dark:bg-[#1e293b]">
          <div className="mb-4 flex items-center gap-2">
            <UserCircle2 className="h-5 w-5 text-sky-500" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">账号概览</h2>
          </div>

          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/60">
              <span>最近活跃</span>
              <strong>{profile?.lastActiveAt ? new Date(profile.lastActiveAt).toLocaleString() : "暂无"}</strong>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/60">
              <span>账户创建</span>
              <strong>{profile?.createdAt ? new Date(profile.createdAt).toLocaleString() : "暂无"}</strong>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/60">
              <span>手机号</span>
              <strong>{profile?.phone || "未绑定"}</strong>
            </div>
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-[#334155] dark:bg-[#1e293b]">
        <div className="mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-violet-500" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">最近活动</h2>
        </div>

        <div className="space-y-3">
          {auditEntries.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">暂无活动记录</p>
          ) : (
            auditEntries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-3 dark:border-[#334155]">
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{entry.action}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{entry.detail}</p>
                </div>
                <div className="text-right text-xs text-slate-400">
                  <p>{entry.user?.name || "系统"}</p>
                  <p>{new Date(entry.createdAt).toLocaleString()}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </DashboardShell>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: typeof Mail;
  label: string;
  value: string;
  tone?: "default" | "green";
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-[#334155] dark:bg-slate-800/50">
      <div className="mb-2 flex items-center gap-2 text-slate-500 dark:text-slate-400">
        <Icon className={cn("h-4 w-4", tone === "green" ? "text-emerald-500" : "text-sky-500")} />
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{value}</p>
    </div>
  );
}
