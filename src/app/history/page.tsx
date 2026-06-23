"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import TopBar from "@/components/layout/TopBar";
import ProgressChart from "@/components/history/ProgressChart";
import {
  getSessionHistory,
  getEquipment,
  supabase,
  isCardio,
  type WorkoutSession,
  type WorkoutSet,
  type Equipment,
} from "@/lib/supabase";
import { format } from "date-fns";
import { Calendar, LineChart as LineChartIcon } from "lucide-react";

export default function HistoryPage() {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [allSets, setAllSets] = useState<WorkoutSet[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [sess, eq] = await Promise.all([getSessionHistory(), getEquipment()]);
    setSessions(sess);
    setEquipment(eq);
    const { data } = await supabase
      .from("workout_sets")
      .select("*")
      .order("logged_at", { ascending: true });
    setAllSets((data as WorkoutSet[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const completed = sessions.filter((s) => s.ended_at);

  // Equipment that has at least one logged set, for the progress section.
  const trained = equipment.filter((e) => allSets.some((s) => s.equipment_id === e.id));

  function sessionStats(sessionId: string) {
    const s = allSets.filter((x) => x.session_id === sessionId);
    const volume = s.reduce((sum, x) => sum + (x.weight ?? 0) * (x.reps ?? 0), 0);
    return { sets: s.length, volume };
  }

  return (
    <AppShell>
      <TopBar title="History" subtitle="Your sessions & strength progress" onRefresh={load} refreshing={loading} />

      <div className="p-5 sm:p-6 space-y-6">
        {/* Progress charts */}
        <section>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">
            <LineChartIcon size={13} /> Strength progress
          </div>
          {trained.length === 0 ? (
            <p className="text-sm text-slate-600">Log some sets to see progress charts.</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {trained.map((e) => (
                <div key={e.id} className="bg-surface-card border border-surface-border rounded-xl p-4">
                  <Link href={`/log/${e.slug}`} className="text-sm font-semibold text-white hover:text-cmp-lime">
                    {e.name}
                  </Link>
                  <ProgressChart
                    sets={allSets.filter((s) => s.equipment_id === e.id)}
                    mode={isCardio(e) ? "duration" : "weight"}
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Sessions */}
        <section>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">
            <Calendar size={13} /> Past workouts
          </div>
          {completed.length === 0 ? (
            <p className="text-sm text-slate-600">No finished workouts yet.</p>
          ) : (
            <div className="space-y-2">
              {completed.map((s) => {
                const { sets, volume } = sessionStats(s.id);
                return (
                  <div key={s.id} className="flex items-center gap-4 bg-surface-card border border-surface-border rounded-xl p-4">
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-white">
                        {format(new Date(s.started_at), "EEE, MMM d")}
                      </div>
                      <div className="text-xs text-slate-500">
                        {format(new Date(s.started_at), "p")}
                        {s.ended_at && ` – ${format(new Date(s.ended_at), "p")}`}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-cmp-lime tabular-nums">{sets} sets</div>
                      <div className="text-xs text-slate-500 tabular-nums">{volume.toLocaleString()} lb vol</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
