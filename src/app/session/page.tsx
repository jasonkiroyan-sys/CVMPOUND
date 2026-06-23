"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import TopBar from "@/components/layout/TopBar";
import {
  getActiveSession,
  getSetsForSession,
  getEquipment,
  supabase,
  type WorkoutSession,
  type WorkoutSet,
  type Equipment,
} from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle2, Dumbbell, Flag } from "lucide-react";

export default function SessionPage() {
  const router = useRouter();
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [sets, setSets] = useState<WorkoutSet[]>([]);
  const [equipment, setEquipment] = useState<Record<string, Equipment>>({});
  const [loading, setLoading] = useState(true);
  const [finishing, setFinishing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [sess, eq] = await Promise.all([getActiveSession(), getEquipment()]);
    setSession(sess);
    setEquipment(Object.fromEntries(eq.map((e) => [e.id, e])));
    setSets(sess ? await getSetsForSession(sess.id) : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function finish() {
    if (!session) return;
    setFinishing(true);
    await supabase
      .from("workout_sessions")
      .update({ ended_at: new Date().toISOString() })
      .eq("id", session.id);
    router.push("/history");
  }

  // Group sets by equipment, preserving first-seen order.
  const groups: { equipmentId: string; sets: WorkoutSet[] }[] = [];
  for (const s of sets) {
    let g = groups.find((x) => x.equipmentId === s.equipment_id);
    if (!g) { g = { equipmentId: s.equipment_id, sets: [] }; groups.push(g); }
    g.sets.push(s);
  }
  const totalVolume = sets.reduce((sum, s) => sum + (s.weight ?? 0) * (s.reps ?? 0), 0);

  const fmtDur = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m && s ? `${m}m ${s}s` : m ? `${m}m` : `${s}s`;
  };

  return (
    <AppShell>
      <TopBar
        title="Current workout"
        subtitle={session ? `Started ${formatDistanceToNow(new Date(session.started_at), { addSuffix: true })}` : undefined}
        onRefresh={load}
        refreshing={loading}
      />

      <div className="p-5 sm:p-6 max-w-xl mx-auto space-y-5">
        {!loading && !session && (
          <div className="card text-center py-12">
            <Dumbbell size={36} className="text-slate-700 mx-auto mb-3" />
            <p className="text-slate-300 font-semibold">No active workout</p>
            <p className="text-slate-500 text-sm mt-1">
              Pick a machine from <Link href="/" className="text-cmp-lime">Equipment</Link> to start one.
            </p>
          </div>
        )}

        {session && (
          <>
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Exercises" value={String(groups.length)} />
              <Stat label="Sets" value={String(sets.length)} />
              <Stat label="Volume" value={`${totalVolume.toLocaleString()}`} suffix="lb" />
            </div>

            {groups.length === 0 && (
              <p className="text-sm text-slate-500">No sets logged yet.</p>
            )}

            {groups.map((g) => {
              const eq = equipment[g.equipmentId];
              return (
                <div key={g.equipmentId} className="bg-surface-card border border-surface-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-white">{eq?.name ?? "Equipment"}</span>
                    {eq && <Link href={`/log/${eq.slug}`} className="text-xs text-cmp-lime">Add set</Link>}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {g.sets.map((s) => (
                      <span key={s.id} className="text-xs bg-surface border border-surface-border rounded-md px-2 py-1 text-slate-300 tabular-nums">
                        {s.duration_seconds != null ? fmtDur(s.duration_seconds) : `${s.weight}×${s.reps}`}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}

            <button
              onClick={finish}
              disabled={finishing}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3.5"
            >
              {finishing ? <CheckCircle2 size={18} /> : <Flag size={18} />}
              Finish workout
            </button>
          </>
        )}
      </div>
    </AppShell>
  );
}

function Stat({ label, value, suffix }: { label: string; value: string; suffix?: string }) {
  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-3 text-center">
      <div className="text-2xl font-extrabold text-white tabular-nums">
        {value}
        {suffix && <span className="text-sm text-slate-500 ml-1">{suffix}</span>}
      </div>
      <div className="text-xs text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}
