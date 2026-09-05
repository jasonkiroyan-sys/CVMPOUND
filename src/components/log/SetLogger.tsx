"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  supabase,
  getOrCreateActiveSession,
  getSetsForSession,
  isCardio,
  type Equipment,
  type WorkoutSet,
} from "@/lib/supabase";
import RestTimer from "./RestTimer";
import { Plus, Minus, Check, Trash2, History, Loader2 } from "lucide-react";

function fmtDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  if (m && s) return `${m}m ${s}s`;
  if (m) return `${m} min`;
  return `${s}s`;
}

export default function SetLogger({
  equipment,
  recentBest,
}: {
  equipment: Equipment;
  recentBest?: { weight: number; reps: number; durationSeconds: number } | null;
}) {
  const cardio = isCardio(equipment);
  const step = equipment.weight_increment || 5;

  const [weight, setWeight] = useState<number>(recentBest?.weight ?? 45);
  const [reps, setReps] = useState<number>(recentBest?.reps ?? 8);
  const [durationMin, setDurationMin] = useState<number>(
    recentBest?.durationSeconds ? Math.floor(recentBest.durationSeconds / 60) : 20
  );
  const [durationSec, setDurationSec] = useState<number>(
    recentBest?.durationSeconds ? recentBest.durationSeconds % 60 : 0
  );

  const [sets, setSets] = useState<WorkoutSet[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const restElapsed = useRef(0);
  // Mirror of sessionId that's readable synchronously inside async handlers,
  // so a tap fired before React has re-rendered still sees the latest value.
  const sessionRef = useRef<string | null>(null);

  const loadSets = useCallback(async (sid: string) => {
    const all = await getSetsForSession(sid);
    setSets(all.filter((s) => s.equipment_id === equipment.id));
  }, [equipment.id]);

  useEffect(() => {
    (async () => {
      try {
        const session = await getOrCreateActiveSession();
        sessionRef.current = session.id;
        setSessionId(session.id);
        await loadSets(session.id);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't load your workout session");
      }
    })();
  }, [loadSets]);

  const onRestElapsed = useCallback((e: number) => { restElapsed.current = e; }, []);

  async function logEntry() {
    if (saving) return; // ignore double-taps while a save is in flight
    if (cardio && durationMin === 0 && durationSec === 0) return;
    setSaving(true);
    setError(null);
    try {
      // Never discard the tap: if the session hasn't finished loading yet
      // (slow connection), fetch/create it right now instead of bailing out.
      let sid = sessionRef.current ?? sessionId;
      if (!sid) {
        const session = await getOrCreateActiveSession();
        sid = session.id;
        sessionRef.current = sid;
        setSessionId(sid);
      }

      const setNumber = sets.length + 1;
      const row: {
        session_id: string;
        equipment_id: string;
        set_number: number;
        weight: number | null;
        reps: number | null;
        duration_seconds: number | null;
        rest_seconds: number | null;
      } = cardio
        ? {
            session_id: sid,
            equipment_id: equipment.id,
            set_number: setNumber,
            weight: null,
            reps: null,
            duration_seconds: durationMin * 60 + durationSec,
            rest_seconds: null,
          }
        : {
            session_id: sid,
            equipment_id: equipment.id,
            set_number: setNumber,
            weight,
            reps,
            duration_seconds: null,
            rest_seconds: restElapsed.current > 0 ? restElapsed.current : null,
          };

      // Insert and get the saved row back in one round-trip, then append it
      // locally — no second fetch, so the UI updates immediately.
      const { data, error: insertError } = await supabase
        .from("workout_sets")
        .insert(row)
        .select()
        .single();
      if (insertError) throw insertError;
      restElapsed.current = 0;
      setSets((prev) => [...prev, data as WorkoutSet]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save that set — try again");
    } finally {
      setSaving(false);
    }
  }

  async function deleteSet(id: string) {
    const { error: delError } = await supabase.from("workout_sets").delete().eq("id", id);
    if (delError) { setError(delError.message); return; }
    setSets((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <div className="space-y-4">
      {cardio ? (
        <div className="grid grid-cols-2 gap-3">
          <Stepper label="Minutes" value={durationMin} onChange={setDurationMin} step={1} min={0} />
          <Stepper label="Seconds" value={durationSec} onChange={setDurationSec} step={5} min={0} max={59} />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Stepper label="Weight (lb)" value={weight} onChange={setWeight} step={step} min={0} />
          <Stepper label="Reps" value={reps} onChange={setReps} step={1} min={1} />
        </div>
      )}

      <button
        onClick={logEntry}
        disabled={saving}
        className="btn-primary w-full text-base flex items-center justify-center gap-2 py-3.5"
      >
        {saving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
        {saving ? "Saving…" : cardio ? "Log time" : `Log set ${sets.length + 1}`}
      </button>

      {error && (
        <p className="text-xs text-rose-400 text-center" role="alert">{error}</p>
      )}

      {/* Rest timer is a strength-training concept — hide it for cardio. */}
      {!cardio && (
        <RestTimer defaultSeconds={90} onElapsedChange={onRestElapsed} />
      )}

      {/* This session's entries */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
          <History size={13} /> This session — {sets.length}{" "}
          {cardio ? (sets.length === 1 ? "bout" : "bouts") : sets.length === 1 ? "set" : "sets"}
        </div>
        {sets.length === 0 ? (
          <p className="text-sm text-slate-600">
            {cardio
              ? "No time logged yet. Enter how long you went and hit “Log time”."
              : "No sets logged yet. Hit “Log set” after your first set."}
          </p>
        ) : (
          <div className="space-y-1.5">
            {sets.map((s) => (
              <div key={s.id} className="flex items-center gap-3 bg-surface-card border border-surface-border rounded-lg px-3 py-2">
                <span className="w-6 h-6 rounded-full bg-cmp-lime/15 text-cmp-lime text-xs font-bold flex items-center justify-center">
                  {s.set_number}
                </span>
                <span className="text-sm text-white font-semibold tabular-nums">
                  {s.duration_seconds != null
                    ? fmtDuration(s.duration_seconds)
                    : `${s.weight} lb × ${s.reps}`}
                </span>
                {s.rest_seconds != null && (
                  <span className="text-xs text-slate-500">· {s.rest_seconds}s rest</span>
                )}
                <button
                  onClick={() => deleteSet(s.id)}
                  className="ml-auto p-1.5 rounded text-slate-500 hover:text-rose-400"
                  aria-label="Delete entry"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stepper({
  label, value, onChange, step, min, max,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step: number;
  min: number;
  max?: number;
}) {
  const clamp = (v: number) => {
    const lo = Math.max(min, v);
    return max != null ? Math.min(max, lo) : lo;
  };
  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-3">
      <label className="text-xs text-slate-500 mb-2 block">{label}</label>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(clamp(value - step))}
          className="w-10 h-10 rounded-lg bg-surface border border-surface-border text-slate-300 hover:text-white flex items-center justify-center shrink-0"
          aria-label={`Decrease ${label}`}
        >
          <Minus size={16} />
        </button>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(clamp(Number(e.target.value)))}
          className="w-full bg-transparent text-center text-2xl font-extrabold text-white tabular-nums focus:outline-none"
        />
        <button
          onClick={() => onChange(clamp(value + step))}
          className="w-10 h-10 rounded-lg bg-surface border border-surface-border text-slate-300 hover:text-white flex items-center justify-center shrink-0"
          aria-label={`Increase ${label}`}
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}
