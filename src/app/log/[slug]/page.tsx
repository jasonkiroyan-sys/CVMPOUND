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

  // Best set from prior history (heaviest weight, then most reps) as a starting point.
  const recentBest = history.length
    ? history.reduce((best, s) =>
        s.weight > best.weight || (s.weight === best.weight && s.reps > best.reps) ? s : best
      )
    : null;

  return (
    <AppShell>
      <TopBar
        title={equipment?.name ?? "Log"}
        subtitle={equipment ? "Log your weight, reps & sets" : undefined}
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

            {recentBest && (
              <div className="flex items-center gap-2 text-sm bg-surface-card border border-surface-border rounded-lg px-4 py-2.5 text-slate-300">
                <TrendingUp size={15} className="text-cmp-lime" />
                Best so far: <span className="font-semibold text-white">{recentBest.weight} lb × {recentBest.reps}</span>
              </div>
            )}

            <SetLogger
              equipment={equipment}
              recentBest={recentBest ? { weight: recentBest.weight, reps: recentBest.reps } : null}
            />

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
