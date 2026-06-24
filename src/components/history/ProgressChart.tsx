"use client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { format } from "date-fns";
import type { WorkoutSet } from "@/lib/supabase";

/**
 * Plots a daily progress trend for one piece of equipment: total training
 * volume (weight × reps, summed across the day) for strength machines, or total
 * time (minutes, summed) for cardio machines. `mode="weight"` = volume.
 */
export default function ProgressChart({
  sets,
  mode = "weight",
}: {
  sets: WorkoutSet[];
  mode?: "weight" | "duration";
}) {
  const byDay = new Map<string, number>();
  for (const s of sets) {
    const day = s.logged_at.slice(0, 10);
    const value =
      mode === "duration" ? (s.duration_seconds ?? 0) / 60 : (s.weight ?? 0) * (s.reps ?? 0);
    byDay.set(day, (byDay.get(day) ?? 0) + value);
  }
  const data = Array.from(byDay.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([day, value]) => ({
      day,
      label: format(new Date(day), "MMM d"),
      value: mode === "duration" ? Math.round(value * 10) / 10 : value,
    }));

  const unit = mode === "duration" ? "min" : "lb";
  const seriesLabel = mode === "duration" ? "Total time" : "Volume";

  if (data.length < 2) {
    return (
      <p className="text-xs text-slate-600 py-4 text-center">
        Log this {mode === "duration" ? "machine" : "exercise"} on at least two days to see a progress trend.
      </p>
    );
  }

  return (
    <div className="h-40">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1c232e" />
          <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} width={36} />
          <Tooltip
            contentStyle={{
              background: "#11151c",
              border: "1px solid #1c232e",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: "#e2e8f0" }}
            formatter={(v: number) => [`${v} ${unit}`, seriesLabel]}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#c8ff2f"
            strokeWidth={2}
            dot={{ r: 3, fill: "#c8ff2f" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
