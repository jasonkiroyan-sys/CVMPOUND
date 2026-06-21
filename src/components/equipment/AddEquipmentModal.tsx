"use client";
import { useState } from "react";
import { Plus, Upload, X, Loader2 } from "lucide-react";
import {
  supabase,
  EQUIPMENT_BUCKET,
  CATEGORIES,
  EQUIPMENT_TYPES,
  type Equipment,
  type EquipmentCategory,
  type EquipmentType,
} from "@/lib/supabase";

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface Props {
  onClose: () => void;
  onSaved: () => void;
  existing?: Equipment | null;
}

export default function AddEquipmentModal({ onClose, onSaved, existing }: Props) {
  const [form, setForm] = useState({
    name: existing?.name ?? "",
    category: (existing?.category ?? "chest") as EquipmentCategory,
    equipment_type: (existing?.equipment_type ?? "machine") as EquipmentType,
    muscle_groups: existing?.muscle_groups?.join(", ") ?? "",
    weight_increment: existing?.weight_increment ?? 5,
    description: existing?.description ?? "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(existing?.photo_url ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function pickFile(f: File | null) {
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : existing?.photo_url ?? null);
  }

  async function uploadPhoto(): Promise<string | null> {
    if (!file) return existing?.photo_url ?? null;
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${slugify(form.name) || "equipment"}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from(EQUIPMENT_BUCKET)
      .upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) throw upErr;
    const { data } = supabase.storage.from(EQUIPMENT_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const photo_url = await uploadPhoto();
      const row = {
        name: form.name.trim(),
        slug: slugify(form.name),
        category: form.category,
        equipment_type: form.equipment_type,
        muscle_groups: form.muscle_groups
          .split(",")
          .map((m) => m.trim())
          .filter(Boolean),
        weight_increment: Number(form.weight_increment) || 5,
        description: form.description.trim() || null,
        photo_url,
        is_active: true,
      };
      if (existing) {
        const { error: e2 } = await supabase.from("equipment").update(row).eq("id", existing.id);
        if (e2) throw e2;
      } else {
        const { error: e2 } = await supabase.from("equipment").insert(row);
        if (e2) throw e2;
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-surface-card border border-surface-border rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold text-base flex items-center gap-2">
            <Plus size={16} className="text-cmp-lime" />
            {existing ? "Edit equipment" : "Add equipment"}
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {/* Photo */}
          <label className="block">
            <div className="relative aspect-[4/3] rounded-lg border-2 border-dashed border-surface-border hover:border-cmp-lime cursor-pointer overflow-hidden bg-surface flex items-center justify-center">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center text-slate-500">
                  <Upload size={24} className="mx-auto mb-1" />
                  <span className="text-xs">Tap to add a photo</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
              />
            </div>
          </label>

          <input
            required
            placeholder="Equipment name *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cmp-lime"
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as EquipmentCategory })}
                className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cmp-lime capitalize"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c.replace("_", " ")}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Type</label>
              <select
                value={form.equipment_type}
                onChange={(e) => setForm({ ...form, equipment_type: e.target.value as EquipmentType })}
                className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cmp-lime capitalize"
              >
                {EQUIPMENT_TYPES.map((t) => (
                  <option key={t} value={t}>{t.replace("_", " ")}</option>
                ))}
              </select>
            </div>
          </div>

          <input
            placeholder="Muscle groups (comma-separated)"
            value={form.muscle_groups}
            onChange={(e) => setForm({ ...form, muscle_groups: e.target.value })}
            className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cmp-lime"
          />

          <div className="grid grid-cols-2 gap-3 items-end">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Weight step (lb)</label>
              <input
                type="number"
                min={1}
                step={1}
                value={form.weight_increment}
                onChange={(e) => setForm({ ...form, weight_increment: Number(e.target.value) })}
                className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cmp-lime"
              />
            </div>
          </div>

          <textarea
            placeholder="Description (optional — helps photo recognition & the coach)"
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cmp-lime resize-none"
          />

          {error && <p className="text-xs text-rose-400">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 text-sm">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 text-sm flex items-center justify-center gap-2">
              {saving && <Loader2 size={14} className="animate-spin" />}
              {existing ? "Save" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
