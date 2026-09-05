"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import TopBar from "@/components/layout/TopBar";
import {
  getEquipment,
  updateEquipmentNotes,
  CATEGORIES,
  type Equipment,
} from "@/lib/supabase";
import { Search, Dumbbell, Check, Loader2, StickyNote } from "lucide-react";
import clsx from "clsx";

const categoryLabels: Record<string, string> = {
  chest: "Chest", back: "Back", legs: "Legs", shoulders: "Shoulders",
  arms: "Arms", core: "Core", cardio: "Cardio", full_body: "Full Body",
};

export default function NotesPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const eq = await getEquipment();
      setEquipment(eq);
      setDrafts(Object.fromEntries(eq.map((e) => [e.id, e.settings_notes ?? ""])));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load equipment");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return equipment.filter((e) => !q || e.name.toLowerCase().includes(q));
  }, [equipment, query]);

  async function save(e: Equipment) {
    setSavingId(e.id);
    setError(null);
    try {
      const trimmed = (drafts[e.id] ?? "").trim();
      await updateEquipmentNotes(e.id, trimmed || null);
      setEquipment((prev) => prev.map((x) => (x.id === e.id ? { ...x, settings_notes: trimmed || null } : x)));
      setSavedId(e.id);
      setTimeout(() => setSavedId((cur) => (cur === e.id ? null : cur)), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <AppShell>
      <TopBar
        title="Machine notes"
        subtitle="Your settings for each machine — seat height, pads, pins"
        onRefresh={load}
        refreshing={loading}
      />

      <div className="p-5 sm:p-6 space-y-5 max-w-3xl">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search machines…"
            className="w-full bg-surface-card border border-surface-border rounded-lg pl-9 pr-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cmp-lime"
          />
        </div>

        {error && <p className="text-xs text-rose-400">{error}</p>}

        {!loading && equipment.length === 0 && (
          <div className="card text-center py-12">
            <Dumbbell size={36} className="text-slate-700 mx-auto mb-3" />
            <p className="text-slate-300 font-semibold">No equipment yet</p>
            <p className="text-slate-500 text-sm mt-1">
              Add machines in <Link href="/equipment" className="text-cmp-lime">Manage</Link> first.
            </p>
          </div>
        )}

        {CATEGORIES.map((cat) => {
          const items = filtered.filter((e) => e.category === cat);
          if (items.length === 0) return null;
          return (
            <section key={cat}>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                <StickyNote size={13} /> {categoryLabels[cat] ?? cat}
              </div>
              <div className="space-y-3">
                {items.map((e) => {
                  const draft = drafts[e.id] ?? "";
                  const dirty = draft.trim() !== (e.settings_notes ?? "").trim();
                  const isSaving = savingId === e.id;
                  const justSaved = savedId === e.id;
                  return (
                    <div key={e.id} className="bg-surface-card border border-surface-border rounded-xl p-3 sm:p-4">
                      <div className="flex items-start gap-3">
                        <Link href={`/log/${e.slug}`} className="w-16 rounded-lg bg-surface-hover overflow-hidden shrink-0 block">
                          {e.photo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={e.photo_url} alt={e.name} className="w-full h-auto block" />
                          ) : (
                            <div className="aspect-square flex items-center justify-center"><Dumbbell size={20} className="text-slate-600" /></div>
                          )}
                        </Link>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link href={`/log/${e.slug}`} className="text-sm font-semibold text-white hover:text-cmp-lime">
                              {e.name}
                            </Link>
                            <span className={clsx("badge", `badge-${e.category}`)}>
                              {categoryLabels[e.category] ?? e.category}
                            </span>
                          </div>
                          <textarea
                            rows={2}
                            value={draft}
                            onChange={(ev) => setDrafts({ ...drafts, [e.id]: ev.target.value })}
                            placeholder="e.g. Seat height 4, back pad 3, pin at 8"
                            className="mt-2 w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cmp-lime resize-none"
                          />
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => save(e)}
                              disabled={!dirty || isSaving}
                              className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
                            >
                              {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                              Save
                            </button>
                            {justSaved && <span className="text-xs text-cmp-lime">Saved ✓</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </AppShell>
  );
}
