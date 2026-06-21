"use client";
import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import type { GoalType, Experience } from "@/lib/supabase";

const GOALS: { value: GoalType; label: string; blurb: string }[] = [
  { value: "strength", label: "Get Stronger", blurb: "Heavy, low reps" },
  { value: "hypertrophy", label: "Build Muscle", blurb: "Moderate reps, volume" },
  { value: "fat_loss", label: "Lose Fat", blurb: "Higher reps, short rest" },
  { value: "general_fitness", label: "General Fitness", blurb: "Balanced & sustainable" },
];

const LEVELS: { value: Experience; label: string }[] = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

export default function GoalForm({
  onGenerate,
  loading,
}: {
  onGenerate: (input: {
    goalType: GoalType;
    experience: Experience;
    daysPerWeek: number;
    notes: string;
  }) => void;
  loading: boolean;
}) {
  const [goalType, setGoalType] = useState<GoalType>("hypertrophy");
  const [experience, setExperience] = useState<Experience>("beginner");
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [notes, setNotes] = useState("");

  return (
    <div className="space-y-5">
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2 block">Your goal</label>
        <div className="grid grid-cols-2 gap-2">
          {GOALS.map((g) => (
            <button
              key={g.value}
              onClick={() => setGoalType(g.value)}
              className={`text-left rounded-xl border p-3 transition-all ${
                goalType === g.value
                  ? "border-cmp-lime bg-cmp-lime/10"
                  : "border-surface-border bg-surface-card hover:border-slate-600"
              }`}
            >
              <div className={`text-sm font-bold ${goalType === g.value ? "text-cmp-lime" : "text-white"}`}>
                {g.label}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">{g.blurb}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2 block">Experience</label>
        <div className="grid grid-cols-3 gap-2">
          {LEVELS.map((l) => (
            <button
              key={l.value}
              onClick={() => setExperience(l.value)}
              className={`rounded-lg border py-2.5 text-sm font-semibold transition-all ${
                experience === l.value
                  ? "border-cmp-lime bg-cmp-lime/10 text-cmp-lime"
                  : "border-surface-border bg-surface-card text-slate-400 hover:text-white"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2 block">
          Days per week: <span className="text-cmp-lime">{daysPerWeek}</span>
        </label>
        <input
          type="range"
          min={2}
          max={6}
          value={daysPerWeek}
          onChange={(e) => setDaysPerWeek(Number(e.target.value))}
          className="w-full accent-cmp-lime"
        />
        <div className="flex justify-between text-xs text-slate-600 mt-1">
          <span>2</span><span>3</span><span>4</span><span>5</span><span>6</span>
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2 block">Anything else? (optional)</label>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. bad shoulder, want to focus on legs, 45-min sessions…"
          className="w-full bg-surface-card border border-surface-border rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cmp-lime resize-none"
        />
      </div>

      <button
        onClick={() => onGenerate({ goalType, experience, daysPerWeek, notes })}
        disabled={loading}
        className="btn-primary w-full flex items-center justify-center gap-2 py-3.5"
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
        {loading ? "Building your program…" : "Generate my free program"}
      </button>
    </div>
  );
}
