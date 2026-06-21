"use client";
import { RefreshCw } from "lucide-react";
import { format } from "date-fns";

interface TopBarProps {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
  right?: React.ReactNode;
}

export default function TopBar({ title, subtitle, onRefresh, refreshing, right }: TopBarProps) {
  return (
    <header className="sticky top-0 z-20 bg-surface/80 backdrop-blur border-b border-surface-border px-5 sm:px-6 py-4 flex items-center justify-between">
      <div>
        <h1 className="text-lg font-bold text-white tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {right}
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-2 rounded-lg bg-surface-card border border-surface-border text-slate-400 hover:text-white hover:border-cmp-lime transition-all"
            aria-label="Refresh"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          </button>
        )}
        <div className="hidden lg:block text-xs text-slate-500 border-l border-surface-border pl-3">
          {format(new Date(), "EEE, MMM d")}
        </div>
      </div>
    </header>
  );
}
