"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Dumbbell,
  Camera,
  Brain,
  LineChart,
  Settings,
  Menu,
  X,
} from "lucide-react";
import clsx from "clsx";

const nav = [
  { label: "Equipment", href: "/", icon: Dumbbell },
  { label: "Recognize", href: "/recognize", icon: Camera },
  { label: "Coach", href: "/coach", icon: Brain },
  { label: "History", href: "/history", icon: LineChart },
  { label: "Manage", href: "/equipment", icon: Settings },
];

function isActive(path: string, href: string) {
  if (href === "/") return path === "/" || path.startsWith("/log");
  return path === href || path.startsWith(href);
}

export default function Sidebar() {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar with hamburger */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between bg-surface-card border-b border-surface-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cmp-lime">
            <Dumbbell size={16} className="text-black" />
          </div>
          <span className="text-white font-extrabold tracking-tight">CVMPOUND</span>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="p-2 rounded-lg text-slate-300 hover:text-white"
          aria-label="Toggle menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Backdrop on mobile */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={clsx(
          "fixed left-0 top-0 h-screen w-60 bg-surface-card border-r border-surface-border flex flex-col z-50 transition-transform",
          "md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-surface-border">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-cmp-lime">
            <Dumbbell size={18} className="text-black" />
          </div>
          <div>
            <div className="text-white font-extrabold text-sm leading-none tracking-tight">
              CVMPOUND
            </div>
            <div className="text-slate-500 text-xs mt-0.5">Train. Track. Progress.</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {nav.map(({ label, href, icon: Icon }) => {
            const active = isActive(path, href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  active
                    ? "bg-cmp-lime text-black"
                    : "text-slate-400 hover:text-slate-100 hover:bg-surface-hover"
                )}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom status */}
        <div className="px-4 py-4 border-t border-surface-border">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cmp-lime animate-pulse-slow" />
            <span className="text-xs text-slate-500">Synced to your gym</span>
          </div>
        </div>
      </aside>
    </>
  );
}
