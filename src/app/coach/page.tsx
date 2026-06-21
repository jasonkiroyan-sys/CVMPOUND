"use client";
import { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/layout/AppShell";
import TopBar from "@/components/layout/TopBar";
import GoalForm from "@/components/coach/GoalForm";
import ProgramView from "@/components/coach/ProgramView";
import {
  getActiveProgram,
  getProgramDays,
  type CoachingProgram,
  type ProgramDay,
  type GoalType,
  type Experience,
} from "@/lib/supabase";
import { RotateCcw, AlertTriangle } from "lucide-react";

export default function CoachPage() {
  const [program, setProgram] = useState<CoachingProgram | null>(null);
  const [days, setDays] = useState<ProgramDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadActive = useCallback(async () => {
    setLoading(true);
    try {
      const p = await getActiveProgram();
      setProgram(p);
      setDays(p ? await getProgramDays(p.id) : []);
      setShowForm(!p);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadActive(); }, [loadActive]);

  async function generate(input: {
    goalType: GoalType;
    experience: Experience;
    daysPerWeek: number;
    notes: string;
  }) {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Generation failed");
      setProgram(json.program);
      setDays(json.days ?? []);
      setShowForm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <AppShell>
      <TopBar
        title="Free coach"
        subtitle="A personalized program built around CVMPOUND's equipment"
        right={
          program && !showForm ? (
            <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 btn-ghost text-sm">
              <RotateCcw size={14} /> New plan
            </button>
          ) : undefined
        }
      />

      <div className="p-5 sm:p-6 max-w-2xl mx-auto space-y-5">
        {error && (
          <div className="card border-amber-500/30 bg-amber-500/5 flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-400 mt-0.5" />
            <div className="text-sm text-slate-300">
              <p className="font-semibold text-amber-300">Couldn&apos;t generate the program.</p>
              <p className="text-slate-400 mt-1">{error}</p>
              {error === "empty_catalog" && (
                <p className="text-slate-500 mt-1 text-xs">Add equipment first so the coach knows what you have.</p>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-slate-500 text-sm">Loading…</p>
        ) : showForm ? (
          <>
            {program && (
              <button onClick={() => setShowForm(false)} className="text-xs text-slate-500 hover:text-slate-300">
                ← Back to current program
              </button>
            )}
            <GoalForm onGenerate={generate} loading={generating} />
          </>
        ) : program ? (
          <ProgramView program={program} days={days} />
        ) : null}
      </div>
    </AppShell>
  );
}
