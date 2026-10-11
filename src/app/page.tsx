"use client";

import { useCallback, useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { TopBar } from "@/components/layout/topbar";
import { useI18n } from "@/components/i18n-provider";

interface UserCookie {
  id?: string | number;
  name?: string;
  email?: string;
  role?: string;
}
import { LocaleToggle } from "@/components/locale-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { cn } from "@/lib/utils";
import { normalizeUserRole } from "@/lib/auth";
import {
  Upload,
  Search,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  Database,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  Check,
  Activity,
  BarChart3,
  Users,
  Sparkles,
} from "lucide-react";

interface Station {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  seaArea: string;
  type: string;
}

interface Measurement {
  id: string;
  stationId: string;
  station: Station;
  date: string;
  depth: number;
  temperature: number;
  salinity: number;
  density: number;
  status: string;
}

interface Stats {
  totalRecords: number;
  verifiedCount: number;
  pendingCount: number;
  flaggedCount: number;
  avgTemperature: number;
  avgSalinity: number;
  stationCount: number;
  verifiedPercentage: number;
}

const statusStyles: Record<string, string> = {
  Verified:
    "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200",
  Pending:
    "border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-200",
  Flagged:
    "border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-200",
};

export default function DataManagementPage() {
  const { t } = useI18n();
  const [currentUser] = useState<UserCookie | null>(() => {
    if (typeof document === "undefined") {
      return null;
    }

    const match = document.cookie.match(/(?:^|;\s*)user=([^;]+)/);
    if (!match) {
      return null;
    }

    try {
      return JSON.parse(decodeURIComponent(match[1])) as UserCookie;
    } catch {
      return null;
    }
  });

  // Data state
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentActivities, setRecentActivities] = useState<Array<{
    id: string;
    action: string;
    detail: string;
    createdAt: string;
    user?: { name?: string; initials?: string | null } | null;
  }>>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [search, setSearch] = useState("");
  const [stationFilter, setStationFilter] = useState("");
  const [seaAreaFilter, setSeaAreaFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const pageSize = 10;

  // UI state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<Measurement>>({});

  // Fetch measurements
  const fetchMeasurements = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      sortBy,
      sortOrder,
    });
    if (search) params.set("search", search);
    if (stationFilter) params.set("station", stationFilter);
    if (seaAreaFilter) params.set("seaArea", seaAreaFilter);
    if (statusFilter) params.set("status", statusFilter);

    const res = await fetch(`/api/measurements?${params}`);
    const data = await res.json();
    setMeasurements(data.data);
    setTotal(data.total);
    setLoading(false);
  }, [page, search, stationFilter, seaAreaFilter, statusFilter, sortBy, sortOrder]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    const res = await fetch("/api/measurements/stats");
    setStats(await res.json());
  }, []);

  // Fetch stations
  useEffect(() => {
    fetch("/api/stations")
      .then((r) => r.json())
      .then(setStations);
  }, []);

  useEffect(() => {
    fetch("/api/audit-logs?page=1&pageSize=5")
      .then((r) => r.json())
      .then((data) => setRecentActivities(data.data || []))
      .catch(() => setRecentActivities([]));
  }, []);

  useEffect(() => {
    // delay call to avoid synchronous setState inside effect
    void Promise.resolve().then(fetchMeasurements);
  }, [fetchMeasurements]);

  useEffect(() => {
    // delay call to avoid synchronous setState inside effect
    void Promise.resolve().then(fetchStats);
  }, [fetchStats]);

  // Search debounce
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Sort handler
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  // Upload handler
  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!stations.length) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("stationId", stations[0].id);

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const result = await res.json();
    setUploading(false);
    setUploadOpen(false);

    if (result.success) {
      fetchMeasurements();
      fetchStats();
    }
  };

  // Delete handler
  const handleDelete = async (id: string) => {
    await fetch(`/api/measurements/${id}`, { method: "DELETE" });
    fetchMeasurements();
    fetchStats();
  };

  // Edit handlers
  const startEdit = (m: Measurement) => {
    setEditingId(m.id);
    setEditValues({ temperature: m.temperature, salinity: m.salinity, status: m.status });
  };
  const saveEdit = async () => {
    if (!editingId) return;
    await fetch(`/api/measurements/${editingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editValues),
    });
    setEditingId(null);
    fetchMeasurements();
    fetchStats();
  };

  const totalPages = Math.ceil(total / pageSize);
  const seaAreas = [...new Set(stations.map((s) => s.seaArea))];

  const statusLabels: Record<string, string> = {
    Verified: t("dataManagement.status.verified"),
    Pending: t("dataManagement.status.pending"),
    Flagged: t("dataManagement.status.flagged"),
  };

  const statCards = stats
    ? [
      {
        label: t("dataManagement.stats.totalRecords"),
        value: stats.totalRecords.toLocaleString(),
        icon: Database,
        color: "text-sky-500",
        bg: "bg-sky-50 dark:bg-sky-500/10",
      },
      {
        label: t("dataManagement.stats.verified"),
        value: `${stats.verifiedPercentage}%`,
        icon: CheckCircle2,
        color: "text-emerald-500",
        bg: "bg-emerald-50 dark:bg-emerald-500/10",
      },
      {
        label: t("dataManagement.stats.pending"),
        value: stats.pendingCount.toLocaleString(),
        icon: Clock,
        color: "text-amber-500",
        bg: "bg-amber-50 dark:bg-amber-500/10",
      },
      {
        label: t("dataManagement.stats.flagged"),
        value: stats.flaggedCount.toLocaleString(),
        icon: AlertTriangle,
        color: "text-rose-500",
        bg: "bg-rose-50 dark:bg-rose-500/10",
      },
    ]
    : [];

  const overviewCards = [
    {
      label: "Active stations",
      value: `${stations.length || 0}`,
      detail: "Live CTD coverage",
      icon: Activity,
      color: "text-sky-600",
      bg: "bg-sky-50 dark:bg-sky-500/10",
    },
    {
      label: "Quality pass rate",
      value: stats ? `${stats.verifiedPercentage}%` : "--",
      detail: "Data integrity status",
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-500/10",
    },
    {
      label: "Analyses queued",
      value: stats ? `${Math.max(3, stats.pendingCount)}` : "3",
      detail: "Scheduled processing",
      icon: Sparkles,
      color: "text-violet-600",
      bg: "bg-violet-50 dark:bg-violet-500/10",
    },
    {
      label: "User activity",
      value: currentUser?.name ? "Online" : "Guest",
      detail: currentUser?.email || "Awaiting sign-in",
      icon: Users,
      color: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-500/10",
    },
  ];

  return (
    <DashboardShell
      contentClassName="p-4 md:p-5"
      header={
        <TopBar
          title={t("dataManagement.title")}
          right={
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs text-sky-700 md:flex dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-sky-500 text-[10px] font-bold text-white">
                  {(currentUser?.name || currentUser?.email || "U").charAt(0).toUpperCase()}
                </span>
                <span className="max-w-[180px] truncate">
                  {currentUser?.name || currentUser?.email?.split("@")[0] || "欢迎使用"}
                </span>
                {currentUser?.role ? (
                  <span className="rounded-full bg-sky-100 px-1.5 py-0.5 text-[10px] font-semibold text-sky-700 dark:bg-sky-500/20 dark:text-sky-200">
                    {normalizeUserRole(currentUser.role)}
                  </span>
                ) : null}
              </div>
              <Button
                onClick={() => setUploadOpen(true)}
                className="h-[38px] gap-2 rounded-lg bg-sky-500 px-4 text-[13px] font-semibold hover:bg-sky-600"
              >
                <Upload className="h-4 w-4" />
                {t("dataManagement.topbar.upload")}
              </Button>
              <LocaleToggle />
              <ThemeToggle />
            </div>
          }
        />
      }
    >
      {/* Upload Modal */}
      {uploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-[#1e293b]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{t("dataManagement.topbar.upload")}</h3>
              <button onClick={() => setUploadOpen(false)}>
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>
            <div
              className="flex h-40 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 hover:border-sky-400 dark:border-slate-600"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleUpload(e.dataTransfer.files);
              }}
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = ".csv,.xlsx,.xls";
                input.onchange = (e) => handleUpload((e.target as HTMLInputElement).files);
                input.click();
              }}
            >
              {uploading ? (
                <div className="text-sm text-slate-500">{t("dataManagement.upload.processing")}</div>
              ) : (
                <>
                  <Upload className="mb-2 h-8 w-8 text-slate-400" />
                  <p className="text-sm text-slate-500">{t("dataManagement.upload.dragDrop")}</p>
                  <p className="mt-1 text-xs text-slate-400">CSV, Excel (.xlsx)</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <section className="mb-3 grid gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(300px,420px)] lg:items-stretch">
        <div className="min-h-[270px] rounded-2xl border border-sky-300/40 bg-gradient-to-br from-sky-600 via-sky-500 to-cyan-500 p-4 text-white shadow-[0_18px_38px_rgba(14,116,144,0.22)] dark:border-sky-500/40 md:p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-sky-100">Operations overview</p>
              <h2 className="mt-1 text-[clamp(1.8rem,2vw,2.6rem)] font-bold leading-tight">Deep-sea monitoring dashboard</h2>
            </div>
            <div className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-sky-50">
              {normalizeUserRole(currentUser?.role) || "Operator"}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {overviewCards.map((card) => (
              <div key={card.label} className="rounded-xl bg-white/10 p-3 backdrop-blur-sm">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs text-sky-100">{card.label}</span>
                  <card.icon className="h-4 w-4 text-white/80" />
                </div>
                <div className="text-xl font-bold">{card.value}</div>
                <div className="mt-1 text-[11px] text-sky-100/80">{card.detail}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex h-full max-h-[420px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-[0_12px_30px_rgba(15,23,42,0.04)] backdrop-blur-sm dark:border-[#334155] dark:bg-[#1e293b]/90">
          <div className="mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-sky-500" />
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">Quick actions</h3>
          </div>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setUploadOpen(true)}
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-[#334155] dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <span>Upload datasets</span>
              <Upload className="h-4 w-4 text-sky-500" />
            </button>
            <button
              type="button"
              onClick={() => window.location.href = "/analysis"}
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-[#334155] dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <span>Run intelligent analysis</span>
              <Sparkles className="h-4 w-4 text-violet-500" />
            </button>
            <button
              type="button"
              onClick={() => window.location.href = "/report-export"}
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-[#334155] dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <span>Export reports</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </button>
          </div>

          <div className="mt-4 flex min-h-0 flex-1 flex-col border-t border-slate-200 pt-4 dark:border-[#334155]">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Recent activity</h4>
              <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Live</span>
            </div>
            <div
              className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1"
              style={{ scrollbarWidth: "thin", msOverflowStyle: "auto" }}
            >
              {recentActivities.length === 0 ? (
                <p className="text-xs text-slate-500">No recent events</p>
              ) : (
                recentActivities.map((activity) => (
                  <div key={activity.id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 shadow-sm dark:border-[#334155] dark:bg-slate-800/60">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{activity.action}</p>
                      <span className="text-[10px] text-slate-400">
                        {new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-300">{activity.detail}</p>
                    <p className="mt-1 text-[10px] text-slate-400">
                      {activity.user?.name || "System"}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Cards */}
      <section className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-[#334155] dark:bg-[#1e293b]"
          >
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

      {/* Filters */}
      <section className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder={t("dataManagement.search")}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-9 pl-9 text-sm"
          />
        </div>
        <Select value={stationFilter} onValueChange={(v) => { setStationFilter(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="h-9 w-[140px] text-xs">
            <SelectValue placeholder={t("dataManagement.filters.station")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("dataManagement.filters.allStations")}</SelectItem>
            {stations.map((s) => (
              <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={seaAreaFilter} onValueChange={(v) => { setSeaAreaFilter(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="h-9 w-[160px] text-xs">
            <SelectValue placeholder={t("dataManagement.filters.seaArea")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("dataManagement.filters.allAreas")}</SelectItem>
            {seaAreas.map((a) => (
              <SelectItem key={a} value={a}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="h-9 w-[130px] text-xs">
            <SelectValue placeholder={t("dataManagement.filters.status")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("dataManagement.filters.allStatus")}</SelectItem>
            <SelectItem value="Verified">{t("dataManagement.status.verified")}</SelectItem>
            <SelectItem value="Pending">{t("dataManagement.status.pending")}</SelectItem>
            <SelectItem value="Flagged">{t("dataManagement.status.flagged")}</SelectItem>
          </SelectContent>
        </Select>
      </section>

      {/* Data Table */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-[#334155] dark:bg-[#1e293b]">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-100 dark:border-[#334155]">
              {[
                { key: "station", label: t("dataManagement.table.station") },
                { key: "date", label: t("dataManagement.table.date") },
                { key: "depth", label: t("dataManagement.table.depth") },
                { key: "temperature", label: t("dataManagement.table.temperature") },
                { key: "salinity", label: t("dataManagement.table.salinity") },
                { key: "status", label: t("dataManagement.table.status") },
              ].map((col) => (
                <TableHead
                  key={col.key}
                  className="cursor-pointer px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-600"
                  onClick={() => handleSort(col.key)}
                >
                  {col.label}
                  {sortBy === col.key && (
                    <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                  )}
                </TableHead>
              ))}
              <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {t("dataManagement.table.actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-sm text-slate-400">
                  Loading...
                </TableCell>
              </TableRow>
            ) : measurements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-sm text-slate-400">
                  {t("dataManagement.table.noData")}
                </TableCell>
              </TableRow>
            ) : (
              measurements.map((row) => (
                <TableRow
                  key={row.id}
                  className="h-11 border-b border-slate-100 dark:border-[#1e293b]"
                >
                  <TableCell className="px-4 text-sm font-medium text-slate-700 dark:text-slate-200">
                    {row.station.name}
                    <span className="ml-2 text-xs text-slate-400">{row.station.seaArea}</span>
                  </TableCell>
                  <TableCell className="px-4 text-sm text-slate-600 dark:text-slate-300">
                    {new Date(row.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="px-4 text-sm text-slate-600 dark:text-slate-300">
                    {row.depth}m
                  </TableCell>
                  <TableCell className="px-4 text-sm text-slate-600 dark:text-slate-300">
                    {editingId === row.id ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={editValues.temperature ?? ""}
                        onChange={(e) => setEditValues({ ...editValues, temperature: parseFloat(e.target.value) })}
                        className="h-7 w-20 text-xs"
                      />
                    ) : (
                      `${row.temperature}℃`
                    )}
                  </TableCell>
                  <TableCell className="px-4 text-sm text-slate-600 dark:text-slate-300">
                    {editingId === row.id ? (
                      <Input
                        type="number"
                        step="0.001"
                        value={editValues.salinity ?? ""}
                        onChange={(e) => setEditValues({ ...editValues, salinity: parseFloat(e.target.value) })}
                        className="h-7 w-20 text-xs"
                      />
                    ) : (
                      `${row.salinity} PSU`
                    )}
                  </TableCell>
                  <TableCell className="px-4">
                    {editingId === row.id ? (
                      <Select
                        value={editValues.status}
                        onValueChange={(v) => setEditValues({ ...editValues, status: v })}
                      >
                        <SelectTrigger className="h-7 w-24 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Verified">Verified</SelectItem>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Flagged">Flagged</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <span
                        className={cn(
                          "inline-flex h-6 items-center rounded-full border px-2 text-[11px] font-semibold",
                          statusStyles[row.status]
                        )}
                      >
                        {statusLabels[row.status] || row.status}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="px-4">
                    <div className="flex items-center gap-1">
                      {editingId === row.id ? (
                        <>
                          <button onClick={saveEdit} className="rounded p-1 hover:bg-emerald-50 dark:hover:bg-emerald-500/10">
                            <Check className="h-4 w-4 text-emerald-500" />
                          </button>
                          <button onClick={() => setEditingId(null)} className="rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-700">
                            <X className="h-4 w-4 text-slate-400" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(row)} className="rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-700">
                            <Pencil className="h-3.5 w-3.5 text-slate-400" />
                          </button>
                          <button onClick={() => handleDelete(row.id)} className="rounded p-1 hover:bg-rose-50 dark:hover:bg-rose-500/10">
                            <Trash2 className="h-3.5 w-3.5 text-slate-400 hover:text-rose-500" />
                          </button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 dark:border-[#334155]">
          <p className="text-xs text-slate-400">
            {t("dataManagement.pagination.showing")} {(page - 1) * pageSize + 1}-
            {Math.min(page * pageSize, total)} {t("dataManagement.pagination.of")} {total}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, totalPages - 4));
              const pageNum = start + i;
              if (pageNum > totalPages) return null;
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPage(pageNum)}
                  className={cn("h-8 w-8 p-0 text-xs", pageNum === page && "bg-sky-500 hover:bg-sky-600")}
                >
                  {pageNum}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>
    </DashboardShell>
  );
}
