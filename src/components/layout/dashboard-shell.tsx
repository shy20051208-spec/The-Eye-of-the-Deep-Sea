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
    <div className="h-screen overflow-hidden bg-slate-50 text-slate-900 dark:bg-[#0f172a] dark:text-slate-100">
      <div className="flex h-full">
        <Sidebar />
        <div className="flex h-full flex-1 flex-col">
          {header}
          <main className={cn("flex-1 min-h-0 overflow-y-auto space-y-3 p-4 md:p-5", contentClassName)}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
