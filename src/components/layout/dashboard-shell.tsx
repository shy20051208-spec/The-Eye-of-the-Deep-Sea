"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/layout/sidebar";

interface DashboardShellProps {
  header?: ReactNode;
  children: ReactNode;
  contentClassName?: string;
}

export function DashboardShell({
  header,
  children,
  contentClassName,
}: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0f172a] dark:text-slate-100">
      <div className="flex">
        <Sidebar />
        <div className="flex min-h-screen flex-1 flex-col">
          {header}
          <main className={cn("flex-1 space-y-6 p-8", contentClassName)}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
