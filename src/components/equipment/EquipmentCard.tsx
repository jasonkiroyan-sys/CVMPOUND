"use client";
import Link from "next/link";
import { Dumbbell } from "lucide-react";
import clsx from "clsx";
import type { Equipment } from "@/lib/supabase";

const categoryLabels: Record<string, string> = {
  chest: "Chest",
  back: "Back",
  legs: "Legs",
  shoulders: "Shoulders",
  arms: "Arms",
  core: "Core",
  cardio: "Cardio",
  full_body: "Full Body",
};

export default function EquipmentCard({ equipment }: { equipment: Equipment }) {
  return (
    <Link
      href={`/log/${equipment.slug}`}
      className="group block bg-surface-card border border-surface-border rounded-xl overflow-hidden transition-all hover:border-cmp-lime"
    >
      <div className="relative bg-surface-hover">
        {equipment.photo_url ? (
          // Full photo, uncropped, edge to edge — the card grows to fit it.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={equipment.photo_url} alt={equipment.name} className="w-full h-auto block" />
        ) : (
          <div className="aspect-[16/9] flex items-center justify-center">
            <Dumbbell size={48} className="text-slate-700" />
          </div>
        )}
        <span
          className={clsx(
            "badge absolute top-2 left-2",
            `badge-${equipment.category}`
          )}
        >
          {categoryLabels[equipment.category] ?? equipment.category}
        </span>
      </div>
      <div className="p-3">
        <div className="text-base font-semibold text-white leading-tight">
          {equipment.name}
        </div>
        <div className="text-xs text-slate-500 mt-1 capitalize">
          {equipment.equipment_type.replace("_", " ")}
        </div>
      </div>
    </Link>
  );
}
