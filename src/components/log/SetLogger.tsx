"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  supabase,
  getOrCreateActiveSession,
  getSetsForSession,
  type Equipment,
  type WorkoutSet,
} from "@/lib/supabase";
import RestTimer from "./RestTimer";
import { Plus, Minus, Check, Trash2, History } from "lucide-react";

export default function SetLogger({
  equipment,
  recentBest,
}: {
  equipment: Equipment;
  recentBest?: { weight: number; reps: number } | null;
}) {
  const step = equipment.weight_increment || 5;
  const [weight, setWeight] = useState<number>(recentBest?.weight ?? 45);
  const [reps, setReps] = useState<number>(recentBest?.reps ?? 8);
  const [sets, setSets] = useState<WorkoutSet[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const restElapsed = useRef(0);

  const loadSets = useCallback(async (sid: string) => {
    const all = await getSetsForSession(sid);
    setSets(all.filter((s) => s.equipment_id === equipment.id));
  }, [equipment.id]);

  useEffect(() => {
    (async () => {
      const session = await getOrCreateActiveSession();
      setSessionId(session.id);
      await loadSets(session.id);
    })();
  }, [loadSets]);

  async function logSet() {
    if (!sessionId) return;
    setSaving(true);
    try {
      const setNumber = sets.length + 1;
      const { error } = await supabase.from("workout_sets").insert({
        session_id: sessionId,
        equipment_id: equipment.id,
        set_number: setNumber,
        weight,
        reps,
        rest_seconds: restElapsed.current > 0 ? restElapsed.current : null,
      });
      if (error) throw error;
      restElapsed.current = 0;
      await loadSets(sessionId);
    } finally {
      setSaving(false);
    }
  }

  async function deleteSet(id: string) {
    await supabase.from("workout_sets").delete().eq("id", id);
    if (sessionId) await loadSets(sessionId);
  }

  return (
    <div className="space-y-4">
      {/* Weight + reps steppers */}
      <div className="grid grid-cols-2 gap-3">
        <Stepper label="Weight (lb)" value={weight} onChange={setWeight} step={step} min={0} />
        <Stepper label="Reps" value={reps} onChange={setReps} step={1} min={1} />
      </div>

      <button
        onClick={logSet}
        disabled={saving}
        className="btn-primary w-full text-base flex items-center justify-center gap-2 py-3.5"
      >
        <Check size={18} /> Log set {sets.length + 1}
      </button>

      <RestTimer
        defaultSeconds={90}
        onElapsedChange={(e) => { restElapsed.current = e; }}
      />

      {/* This session's sets */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
          <History size={13} /> This session — {sets.length} {sets.length === 1 ? "set" : "sets"}
        </div>
        {sets.length === 0 ? (
          <p className="text-sm text-slate-600">No sets logged yet. Hit “Log set” after your first set.</p>
        ) : (
          <div className="space-y-1.5">
            {sets.map((s) => (
              <div key={s.id} className="flex items-center gap-3 bg-surface-card border border-surface-border rounded-lg px-3 py-2">
                <span className="w-6 h-6 rounded-full bg-cmp-lime/15 text-cmp-lime text-xs font-bold flex items-center justify-center">
                  {s.set_number}
                </span>
                <span className="text-sm text-white font-semibold tabular-nums">
                  {s.weight} lb × {s.reps}
                </span>
                {s.rest_seconds != null && (
                  <span className="text-xs text-slate-500">· {s.rest_seconds}s rest</span>
                )}
                <button
                  onClick={() => deleteSet(s.id)}
                  className="ml-auto p-1.5 rounded text-slate-500 hover:text-rose-400"
                  aria-label="Delete set"
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
  label, value, onChange, step, min,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step: number;
  min: number;
}) {
  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-3">
      <label className="text-xs text-slate-500 mb-2 block">{label}</label>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(min, value - step))}
          className="w-10 h-10 rounded-lg bg-surface border border-surface-border text-slate-300 hover:text-white flex items-center justify-center shrink-0"
          aria-label={`Decrease ${label}`}
        >
          <Minus size={16} />
        </button>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Math.max(min, Number(e.target.value)))}
          className="w-full bg-transparent text-center text-2xl font-extrabold text-white tabular-nums focus:outline-none"
        />
        <button
          onClick={() => onChange(value + step)}
          className="w-10 h-10 rounded-lg bg-surface border border-surface-border text-slate-300 hover:text-white flex items-center justify-center shrink-0"
          aria-label={`Increase ${label}`}
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}
