"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TopBarProps {
  title?: string;
  left?: ReactNode;
  right?: ReactNode;
  className?: string;
}

export function TopBar({ title, left, right, className }: TopBarProps) {
  return (
    <div
      className={cn(
        "flex h-14 items-center justify-between border-b border-slate-200 bg-white px-8 dark:border-[#334155] dark:bg-[#1e293b]",
        className
      )}
    >
      <div className="flex items-center gap-4">
        {title ? (
          <h1 className="text-lg font-semibold text-[#0c4a6e] dark:text-[#f0f9ff]">
            {title}
          </h1>
        ) : null}
        {left}
      </div>
      <div className="flex items-center gap-4">{right}</div>
    </div>
  );
}
