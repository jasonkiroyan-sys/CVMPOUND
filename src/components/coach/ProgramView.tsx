"use client";
import { useState } from "react";
import Link from "next/link";
import type { CoachingProgram, ProgramDay } from "@/lib/supabase";
import { Calendar, ChevronDown, ChevronUp, Sparkles, Dumbbell } from "lucide-react";
import clsx from "clsx";

export default function ProgramView({
  program,
  days,
}: {
  program: CoachingProgram;
  days: ProgramDay[];
}) {
  const weeks = Array.from(new Set(days.map((d) => d.week_number))).sort((a, b) => a - b);
  const [activeWeek, setActiveWeek] = useState(weeks[0] ?? 1);
  const weekDays = days.filter((d) => d.week_number === activeWeek);

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-cmp-lime/15 flex items-center justify-center shrink-0">
            <Sparkles size={18} className="text-cmp-lime" />
          </div>
          <div>
            <h2 className="text-white font-bold">{program.title}</h2>
            <p className="text-sm text-slate-400 mt-1">{program.summary}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
              <span>{program.weeks} weeks</span>
              <span>·</span>
              <span>{program.days_per_week} days/week</span>
              <span>·</span>
              <span className={program.source === "claude" ? "text-cmp-lime" : "text-slate-500"}>
                {program.source === "claude" ? "AI-designed" : "Template"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Week selector */}
      {weeks.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {weeks.map((w) => (
            <button
              key={w}
              onClick={() => setActiveWeek(w)}
              className={clsx(
                "whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold border transition-all",
                activeWeek === w
                  ? "bg-cmp-lime text-black border-cmp-lime"
                  : "bg-surface-card text-slate-400 border-surface-border hover:text-white"
              )}
            >
              Week {w}
            </button>
          ))}
        </div>
      )}

      {weekDays.map((day) => (
        <DayCard key={day.id} day={day} />
      ))}
    </div>
  );
}

function DayCard({ day }: { day: ProgramDay }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <Calendar size={15} className="text-cmp-lime" />
          <span className="text-sm font-semibold text-white">Day {day.day_number}</span>
          <span className="text-xs text-slate-500">· {day.focus}</span>
        </div>
        {open ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
      </button>
      {open && (
        <div className="border-t border-surface-border divide-y divide-surface-border">
          {day.exercises.length === 0 && (
            <p className="px-4 py-3 text-xs text-slate-600">No exercises mapped for this day.</p>
          )}
          {day.exercises.map((ex, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <Dumbbell size={16} className="text-slate-600 shrink-0" />
              <div className="min-w-0 flex-1">
                {ex.equipment_slug ? (
                  <Link href={`/log/${ex.equipment_slug}`} className="text-sm font-medium text-white hover:text-cmp-lime">
                    {ex.equipment_name}
                  </Link>
                ) : (
                  <span className="text-sm font-medium text-white">{ex.equipment_name}</span>
                )}
                {ex.notes && <div className="text-xs text-slate-500 truncate">{ex.notes}</div>}
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-bold text-cmp-lime tabular-nums">{ex.sets} × {ex.reps}</div>
                <div className="text-xs text-slate-500">{ex.rest_seconds}s rest</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
