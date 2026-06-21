"use client";
import { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/layout/AppShell";
import TopBar from "@/components/layout/TopBar";
import AddEquipmentModal from "@/components/equipment/AddEquipmentModal";
import { getEquipment, supabase, type Equipment } from "@/lib/supabase";
import { Plus, Pencil, Trash2, Dumbbell } from "lucide-react";
import clsx from "clsx";

const categoryLabels: Record<string, string> = {
  chest: "Chest", back: "Back", legs: "Legs", shoulders: "Shoulders",
  arms: "Arms", core: "Core", cardio: "Cardio", full_body: "Full Body",
};

export default function EquipmentManagePage() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Equipment | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setEquipment(await getEquipment());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function remove(e: Equipment) {
    if (!confirm(`Remove "${e.name}"? Past logged sets are kept.`)) return;
    // Soft-delete so historical sets still reference it.
    await supabase.from("equipment").update({ is_active: false }).eq("id", e.id);
    load();
  }

  return (
    <AppShell>
      <TopBar
        title="Manage equipment"
        subtitle="Add CVMPOUND's machines with real photos"
        onRefresh={load}
        refreshing={loading}
        right={
          <button
            onClick={() => { setEditing(null); setModalOpen(true); }}
            className="inline-flex items-center gap-2 btn-primary text-sm"
          >
            <Plus size={15} /> Add
          </button>
        }
      />

      <div className="p-5 sm:p-6 space-y-2">
        {!loading && equipment.length === 0 && (
          <div className="card text-center py-12">
            <Dumbbell size={36} className="text-slate-700 mx-auto mb-3" />
            <p className="text-slate-300 font-semibold">No equipment yet</p>
            <p className="text-slate-500 text-sm mt-1">Tap Add to create your first machine.</p>
          </div>
        )}

        {equipment.map((e) => (
          <div key={e.id} className="flex items-center gap-3 bg-surface-card border border-surface-border rounded-xl p-3">
            <div className="w-14 h-14 rounded-lg bg-surface-hover overflow-hidden flex items-center justify-center shrink-0">
              {e.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={e.photo_url} alt={e.name} className="w-full h-full object-cover" />
              ) : (
                <Dumbbell size={20} className="text-slate-600" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-white truncate">{e.name}</div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={clsx("badge", `badge-${e.category}`)}>
                  {categoryLabels[e.category] ?? e.category}
                </span>
                <span className="text-xs text-slate-500 capitalize">
                  {e.equipment_type.replace("_", " ")}
                </span>
              </div>
            </div>
            <button
              onClick={() => { setEditing(e); setModalOpen(true); }}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-surface-hover"
              aria-label="Edit"
            >
              <Pencil size={15} />
            </button>
            <button
              onClick={() => remove(e)}
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-surface-hover"
              aria-label="Remove"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>

      {modalOpen && (
        <AddEquipmentModal
          existing={editing}
          onClose={() => setModalOpen(false)}
          onSaved={load}
        />
      )}
    </AppShell>
  );
}
