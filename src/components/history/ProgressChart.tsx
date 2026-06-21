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

/** Plots the top-set weight per day for one piece of equipment. */
export default function ProgressChart({ sets }: { sets: WorkoutSet[] }) {
  const byDay = new Map<string, number>();
  for (const s of sets) {
    const day = s.logged_at.slice(0, 10);
    byDay.set(day, Math.max(byDay.get(day) ?? 0, s.weight));
  }
  const data = Array.from(byDay.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([day, weight]) => ({ day, label: format(new Date(day), "MMM d"), weight }));

  if (data.length < 2) {
    return (
      <p className="text-xs text-slate-600 py-4 text-center">
        Log this exercise on at least two days to see a progress trend.
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
            formatter={(v: number) => [`${v} lb`, "Top set"]}
          />
          <Line
            type="monotone"
            dataKey="weight"
            stroke="#c8ff2f"
            strokeWidth={2}
            dot={{ r: 3, fill: "#c8ff2f" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
