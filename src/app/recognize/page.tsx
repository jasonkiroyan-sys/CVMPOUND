"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import TopBar from "@/components/layout/TopBar";
import { Camera, Loader2, CheckCircle2, XCircle, RotateCcw } from "lucide-react";

type Result =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "matched"; slug: string; name: string; confidence: number; photoUrl: string | null }
  | { status: "nomatch"; reason?: string };

function fileToBase64(file: File): Promise<{ data: string; mediaType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const [, base64] = result.split(",");
      resolve({ data: base64, mediaType: file.type || "image/jpeg" });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function RecognizePage() {
  const router = useRouter();
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<Result>({ status: "idle" });
  const inputRef = useRef<HTMLInputElement>(null);

  async function onPick(file: File | null) {
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setResult({ status: "loading" });
    try {
      const { data, mediaType } = await fileToBase64(file);
      const res = await fetch("/api/recognize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: data, mediaType }),
      });
      const json = await res.json();
      if (json.matched && json.equipment) {
        setResult({
          status: "matched",
          slug: json.equipment.slug,
          name: json.equipment.name,
          confidence: json.confidence ?? 0,
          photoUrl: json.equipment.photo_url ?? null,
        });
      } else {
        setResult({ status: "nomatch", reason: json.reason });
      }
    } catch {
      setResult({ status: "nomatch", reason: "request_failed" });
    }
  }

  function reset() {
    setPreview(null);
    setResult({ status: "idle" });
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <AppShell>
      <TopBar title="Scan equipment" subtitle="Snap a photo and we'll find the machine" />

      <div className="p-5 sm:p-6 max-w-lg mx-auto space-y-5">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => onPick(e.target.files?.[0] ?? null)}
        />

        {/* Capture area */}
        {!preview ? (
          <button
            onClick={() => inputRef.current?.click()}
            className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-surface-border hover:border-cmp-lime bg-surface-card flex flex-col items-center justify-center gap-3 text-slate-400 transition-all"
          >
            <div className="w-16 h-16 rounded-full bg-cmp-lime/15 flex items-center justify-center">
              <Camera size={28} className="text-cmp-lime" />
            </div>
            <span className="font-semibold text-white">Take or upload a photo</span>
            <span className="text-xs text-slate-500">Point your camera at the machine</span>
          </button>
        ) : (
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-surface-hover">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="captured" className="w-full h-full object-cover" />
            <button
              onClick={reset}
              className="absolute top-3 right-3 p-2 rounded-lg bg-black/60 text-white hover:bg-black/80"
              aria-label="Retake"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        )}

        {/* Result */}
        {result.status === "loading" && (
          <div className="flex items-center justify-center gap-2 text-slate-300 py-4">
            <Loader2 size={18} className="animate-spin text-cmp-lime" /> Identifying machine…
          </div>
        )}

        {result.status === "matched" && (
          <div className="card border-cmp-lime/30 bg-cmp-lime/5">
            <div className="flex items-center gap-3">
              {result.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={result.photoUrl} alt={result.name} className="w-14 h-14 rounded-lg object-cover" />
              ) : (
                <CheckCircle2 size={28} className="text-cmp-lime" />
              )}
              <div className="flex-1">
                <div className="text-xs text-cmp-lime font-semibold uppercase tracking-wide">
                  Match · {Math.round(result.confidence * 100)}% sure
                </div>
                <div className="text-white font-bold">{result.name}</div>
              </div>
            </div>
            <button
              onClick={() => router.push(`/log/${result.slug}`)}
              className="btn-primary w-full mt-4"
            >
              Log a set on this machine
            </button>
            <button onClick={reset} className="text-xs text-slate-500 mt-2 w-full text-center hover:text-slate-300">
              Not right? Scan again
            </button>
          </div>
        )}

        {result.status === "nomatch" && (
          <div className="card border-amber-500/30 bg-amber-500/5">
            <div className="flex items-center gap-3 mb-3">
              <XCircle size={24} className="text-amber-400" />
              <div>
                <div className="text-white font-semibold">No confident match</div>
                <div className="text-xs text-slate-500">
                  {result.reason === "recognition_unavailable"
                    ? "Photo recognition isn't configured yet — pick manually below."
                    : "Couldn't identify that machine — pick it from the list."}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/" className="btn-primary flex-1 text-center text-sm">Browse equipment</Link>
              <button onClick={reset} className="btn-ghost text-sm">Retry</button>
            </div>
          </div>
        )}

        <p className="text-xs text-slate-600 text-center">
          Tip: recognition matches against the equipment you&apos;ve added in{" "}
          <Link href="/equipment" className="text-cmp-lime">Manage</Link>.
        </p>
      </div>
    </AppShell>
  );
}
