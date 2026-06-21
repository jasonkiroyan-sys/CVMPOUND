"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import TopBar from "@/components/layout/TopBar";
import EquipmentCard from "@/components/equipment/EquipmentCard";
import { getEquipment, getActiveSession, CATEGORIES, type Equipment, type WorkoutSession } from "@/lib/supabase";
import { Search, Dumbbell, Camera, AlertTriangle, Activity } from "lucide-react";
import clsx from "clsx";

const categoryLabels: Record<string, string> = {
  chest: "Chest", back: "Back", legs: "Legs", shoulders: "Shoulders",
  arms: "Arms", core: "Core", cardio: "Cardio", full_body: "Full Body",
};

export default function HomePage() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string>("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [eq, sess] = await Promise.all([getEquipment(), getActiveSession()]);
      setEquipment(eq);
      setSession(sess);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load equipment");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    return equipment.filter((e) => {
      const matchesCat = cat === "all" || e.category === cat;
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        e.name.toLowerCase().includes(q) ||
        e.muscle_groups.some((m) => m.toLowerCase().includes(q));
      return matchesCat && matchesQuery;
    });
  }, [equipment, cat, query]);

  return (
    <AppShell>
      <TopBar
        title="Equipment"
        subtitle="Tap a machine to start logging your sets"
        onRefresh={load}
        refreshing={loading}
        right={
          <Link href="/recognize" className="hidden sm:inline-flex items-center gap-2 btn-primary text-sm">
            <Camera size={15} /> Scan
          </Link>
        }
      />

      <div className="p-5 sm:p-6 space-y-5">
        {session && (
          <Link
            href="/session"
            className="flex items-center gap-2 text-sm bg-cmp-lime/10 border border-cmp-lime/30 text-cmp-lime rounded-lg px-4 py-2.5"
          >
            <Activity size={15} /> Workout in progress — tap to view & finish
          </Link>
        )}

        {/* Search + category filter */}
        <div className="space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search equipment or muscle group…"
              className="w-full bg-surface-card border border-surface-border rounded-lg pl-9 pr-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cmp-lime"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {["all", ...CATEGORIES].map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={clsx(
                  "whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold transition-all border",
                  cat === c
                    ? "bg-cmp-lime text-black border-cmp-lime"
                    : "bg-surface-card text-slate-400 border-surface-border hover:text-white"
                )}
              >
                {c === "all" ? "All" : categoryLabels[c]}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="card border-amber-500/30 bg-amber-500/5">
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="text-amber-400 mt-0.5" />
              <div className="text-sm text-slate-300">
                <p className="font-semibold text-amber-300">Couldn&apos;t load equipment.</p>
                <p className="text-slate-400 mt-1">{error}</p>
                <p className="text-slate-500 mt-2 text-xs">
                  Make sure your Supabase env vars are set and the schema/seed have been applied
                  (see <code className="text-cmp-lime">SETUP.md</code>).
                </p>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && equipment.length === 0 && (
          <div className="card text-center py-12">
            <Dumbbell size={36} className="text-slate-700 mx-auto mb-3" />
            <p className="text-slate-300 font-semibold">No equipment yet</p>
            <p className="text-slate-500 text-sm mt-1">
              Add CVMPOUND&apos;s machines with photos in{" "}
              <Link href="/equipment" className="text-cmp-lime">Manage</Link>.
            </p>
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {filtered.map((e) => (
            <EquipmentCard key={e.id} equipment={e} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
