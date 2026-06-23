"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import TopBar from "@/components/layout/TopBar";
import SetLogger from "@/components/log/SetLogger";
import {
  getEquipmentBySlug,
  getSetsForEquipment,
  isCardio,
  type Equipment,
  type WorkoutSet,
} from "@/lib/supabase";
import { ArrowLeft, Dumbbell, TrendingUp } from "lucide-react";

export default function LogPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [history, setHistory] = useState<WorkoutSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const eq = await getEquipmentBySlug(slug);
      if (!eq) { setNotFound(true); setLoading(false); return; }
      setEquipment(eq);
      setHistory(await getSetsForEquipment(eq.id));
      setLoading(false);
    })();
  }, [slug]);

  const cardio = equipment ? isCardio(equipment) : false;

  // Sensible defaults from prior history: heaviest set (strength) or longest
  // time (cardio), used to pre-fill the logger and show a "best so far" hint.
  const heaviest = history.reduce<WorkoutSet | null>((best, s) => {
    if (s.weight == null) return best;
    if (!best || s.weight > (best.weight ?? 0)) return s;
    return best;
  }, null);
  const longestSeconds = history.reduce(
    (max, s) => (s.duration_seconds != null && s.duration_seconds > max ? s.duration_seconds : max),
    0
  );
  const recentBest = history.length
    ? {
        weight: heaviest?.weight ?? 45,
        reps: heaviest?.reps ?? 8,
        durationSeconds: longestSeconds,
      }
    : null;

  const fmtTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m && s ? `${m}m ${s}s` : m ? `${m} min` : `${s}s`;
  };

  return (
    <AppShell>
      <TopBar
        title={equipment?.name ?? "Log"}
        subtitle={equipment ? (cardio ? "Log how long you used the machine" : "Log your weight, reps & sets") : undefined}
        right={
          <Link href="/" className="p-2 rounded-lg bg-surface-card border border-surface-border text-slate-400 hover:text-white" aria-label="Back">
            <ArrowLeft size={15} />
          </Link>
        }
      />

      <div className="p-5 sm:p-6 max-w-xl mx-auto space-y-5">
        {loading && <p className="text-slate-500 text-sm">Loading…</p>}

        {notFound && (
          <div className="card text-center py-12">
            <Dumbbell size={36} className="text-slate-700 mx-auto mb-3" />
            <p className="text-slate-300 font-semibold">Equipment not found</p>
            <Link href="/" className="text-cmp-lime text-sm mt-2 inline-block">Back to equipment</Link>
          </div>
        )}

        {equipment && (
          <>
            {equipment.photo_url && (
              <div className="aspect-[16/9] rounded-xl overflow-hidden bg-surface-hover">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={equipment.photo_url} alt={equipment.name} className="w-full h-full object-cover" />
              </div>
            )}

            {recentBest && (cardio ? recentBest.durationSeconds > 0 : true) && (
              <div className="flex items-center gap-2 text-sm bg-surface-card border border-surface-border rounded-lg px-4 py-2.5 text-slate-300">
                <TrendingUp size={15} className="text-cmp-lime" />
                {cardio ? "Longest so far:" : "Best so far:"}{" "}
                <span className="font-semibold text-white">
                  {cardio ? fmtTime(recentBest.durationSeconds) : `${recentBest.weight} lb × ${recentBest.reps}`}
                </span>
              </div>
            )}

            <SetLogger equipment={equipment} recentBest={recentBest} />

            <Link
              href="/session"
              className="block text-center btn-ghost text-sm"
            >
              View session & finish
            </Link>
          </>
        )}
      </div>
    </AppShell>
  );
}
