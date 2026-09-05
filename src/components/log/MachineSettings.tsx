"use client";
import { useState } from "react";
import { updateEquipmentNotes, type Equipment } from "@/lib/supabase";
import { StickyNote, Pencil, Check, X, Loader2 } from "lucide-react";

/**
 * Per-machine settings note (seat height, back pad, pin position…) shown on the
 * log screen so it's right there when you sit down. Editable in place.
 */
export default function MachineSettings({ equipment }: { equipment: Pick<Equipment, "id" | "settings_notes"> }) {
  const [notes, setNotes] = useState<string>(equipment.settings_notes ?? "");
  const [draft, setDraft] = useState<string>(notes);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEdit() {
    setDraft(notes);
    setError(null);
    setEditing(true);
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const trimmed = draft.trim();
      await updateEquipmentNotes(equipment.id, trimmed || null);
      setNotes(trimmed);
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <StickyNote size={13} className="text-cmp-lime" /> Machine settings
        </div>
        {!editing && notes && (
          <button onClick={startEdit} className="p-1.5 rounded text-slate-400 hover:text-white" aria-label="Edit settings">
            <Pencil size={14} />
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-2">
          <textarea
            autoFocus
            rows={3}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="e.g. Seat height 4, back pad 3, pin at 8"
            className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cmp-lime resize-none"
          />
          {error && <p className="text-xs text-rose-400">{error}</p>}
          <div className="flex gap-2">
            <button onClick={save} disabled={saving} className="btn-primary flex-1 text-sm flex items-center justify-center gap-2 py-2">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save
            </button>
            <button onClick={() => setEditing(false)} disabled={saving} className="btn-ghost text-sm py-2" aria-label="Cancel">
              <X size={14} />
            </button>
          </div>
        </div>
      ) : notes ? (
        <p className="text-sm text-slate-200 whitespace-pre-wrap">{notes}</p>
      ) : (
        <button onClick={startEdit} className="w-full text-left text-sm text-slate-500 hover:text-cmp-lime">
          + Add your settings for this machine (seat height, pin, etc.)
        </button>
      )}
    </div>
  );
}
