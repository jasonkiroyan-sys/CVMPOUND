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
      className="group bg-surface-card border border-surface-border rounded-xl overflow-hidden transition-all hover:border-cmp-lime hover:-translate-y-0.5"
    >
      <div className="relative aspect-[4/3] bg-surface-hover flex items-center justify-center overflow-hidden">
        {equipment.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={equipment.photo_url}
            alt={equipment.name}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <Dumbbell size={40} className="text-slate-700" />
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
        <div className="text-sm font-semibold text-white leading-tight line-clamp-2">
          {equipment.name}
        </div>
        <div className="text-xs text-slate-500 mt-1 capitalize">
          {equipment.equipment_type.replace("_", " ")}
        </div>
      </div>
    </Link>
  );
}
