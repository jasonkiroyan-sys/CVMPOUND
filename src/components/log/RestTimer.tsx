"use client";
import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Plus, Minus } from "lucide-react";

/**
 * Counts down rest between sets. Reports elapsed rest seconds via onTick so the
 * next logged set can record how long the lifter actually rested.
 */
export default function RestTimer({
  defaultSeconds = 90,
  onElapsedChange,
}: {
  defaultSeconds?: number;
  onElapsedChange?: (elapsed: number) => void;
}) {
  const [target, setTarget] = useState(defaultSeconds);
  const [remaining, setRemaining] = useState(defaultSeconds);
  const [running, setRunning] = useState(false);
  const elapsedRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        elapsedRef.current += 1;
        onElapsedChange?.(elapsedRef.current);
        setRemaining((r) => Math.max(0, r - 1));
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, onElapsedChange]);

  useEffect(() => {
    if (remaining === 0 && running) setRunning(false);
  }, [remaining, running]);

  function reset(to = target) {
    setRunning(false);
    setRemaining(to);
    elapsedRef.current = 0;
    onElapsedChange?.(0);
  }

  function adjust(delta: number) {
    const next = Math.max(15, target + delta);
    setTarget(next);
    if (!running) setRemaining(next);
  }

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rest timer</span>
        <div className="flex items-center gap-1">
          <button onClick={() => adjust(-15)} className="p-1 rounded text-slate-400 hover:text-white" aria-label="-15s">
            <Minus size={14} />
          </button>
          <span className="text-xs text-slate-400 w-8 text-center">{target}s</span>
          <button onClick={() => adjust(15)} className="p-1 rounded text-slate-400 hover:text-white" aria-label="+15s">
            <Plus size={14} />
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-3xl font-extrabold tabular-nums text-white tracking-tight">{mm}:{ss}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRunning((v) => !v)}
            className="p-2.5 rounded-lg bg-cmp-lime text-black hover:bg-cmp-lime-light"
            aria-label={running ? "Pause" : "Start"}
          >
            {running ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button
            onClick={() => reset()}
            className="p-2.5 rounded-lg bg-surface border border-surface-border text-slate-300 hover:text-white"
            aria-label="Reset"
          >
            <RotateCcw size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
