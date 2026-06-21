import type { GoalType, Experience } from "./supabase";

export interface CatalogItem {
  id: string;
  slug: string;
  name: string;
  category: string;
  muscle_groups: string[];
  equipment_type: string;
}

export interface GeneratedExercise {
  equipment_slug: string;
  equipment_name: string;
  sets: number;
  reps: string;
  rest_seconds: number;
  notes?: string;
}

export interface GeneratedDay {
  week_number: number;
  day_number: number;
  focus: string;
  exercises: GeneratedExercise[];
}

export interface GeneratedProgram {
  title: string;
  summary: string;
  weeks: number;
  days_per_week: number;
  days: GeneratedDay[];
}

// Set/rep/rest defaults keyed by goal.
const goalScheme: Record<GoalType, { sets: number; reps: string; rest: number; label: string }> = {
  strength: { sets: 5, reps: "5", rest: 180, label: "Strength" },
  hypertrophy: { sets: 4, reps: "8-12", rest: 75, label: "Hypertrophy" },
  fat_loss: { sets: 3, reps: "12-15", rest: 45, label: "Fat Loss" },
  general_fitness: { sets: 3, reps: "10", rest: 60, label: "General Fitness" },
};

const CATEGORY_FOCUS: Record<string, string[]> = {
  push: ["chest", "shoulders", "arms"],
  pull: ["back", "arms"],
  legs: ["legs", "core"],
  upper: ["chest", "back", "shoulders", "arms"],
  lower: ["legs", "core"],
  full: ["chest", "back", "legs", "shoulders", "arms", "core"],
};

function pickForFocus(catalog: CatalogItem[], cats: string[], max: number): CatalogItem[] {
  const matches = catalog.filter((e) => cats.includes(e.category));
  // Prefer one per distinct category first for balance, then fill.
  const seen = new Set<string>();
  const ordered: CatalogItem[] = [];
  for (const cat of cats) {
    const item = matches.find((m) => m.category === cat && !seen.has(m.id));
    if (item) { ordered.push(item); seen.add(item.id); }
  }
  for (const m of matches) {
    if (ordered.length >= max) break;
    if (!seen.has(m.id)) { ordered.push(m); seen.add(m.id); }
  }
  return ordered.slice(0, max);
}

/** Returns a day template (focus names) for the chosen split. */
function splitForDays(days: number, experience: Experience): string[] {
  if (experience === "beginner" || days <= 2) {
    return Array.from({ length: days }, () => "full");
  }
  if (days === 3) return ["push", "pull", "legs"];
  if (days === 4) return ["upper", "lower", "upper", "lower"];
  if (days === 5) return ["push", "pull", "legs", "upper", "lower"];
  return ["push", "pull", "legs", "push", "pull", "legs"].slice(0, days);
}

const FOCUS_LABEL: Record<string, string> = {
  push: "Push (Chest / Shoulders / Triceps)",
  pull: "Pull (Back / Biceps)",
  legs: "Legs & Core",
  upper: "Upper Body",
  lower: "Lower Body",
  full: "Full Body",
};

/**
 * Deterministic, rule-based program generator. Used when the Claude API is
 * unavailable. Uses ONLY the provided catalog equipment.
 */
export function generateFallbackProgram(
  catalog: CatalogItem[],
  goalType: GoalType,
  experience: Experience,
  daysPerWeek: number,
  weeks = 4
): GeneratedProgram {
  const scheme = goalScheme[goalType];
  const split = splitForDays(daysPerWeek, experience);
  const exercisesPerDay = experience === "beginner" ? 4 : 6;

  const days: GeneratedDay[] = [];
  for (let w = 1; w <= weeks; w++) {
    split.forEach((focus, idx) => {
      const cats = CATEGORY_FOCUS[focus] ?? CATEGORY_FOCUS.full;
      const picks = pickForFocus(catalog, cats, exercisesPerDay);
      // Progressive overload note: nudge intensity up each week.
      const progression =
        w === 1 ? "Establish working weight" : `Add a little weight vs week ${w - 1}`;
      days.push({
        week_number: w,
        day_number: idx + 1,
        focus: FOCUS_LABEL[focus] ?? "Full Body",
        exercises: picks.map((e) => ({
          equipment_slug: e.slug,
          equipment_name: e.name,
          sets: scheme.sets,
          reps: scheme.reps,
          rest_seconds: scheme.rest,
          notes: progression,
        })),
      });
    });
  }

  return {
    title: `${scheme.label} — ${daysPerWeek}-Day Plan`,
    summary:
      `A ${weeks}-week ${scheme.label.toLowerCase()} program built around CVMPOUND's equipment, ` +
      `training ${daysPerWeek} days per week with a ${split.map((s) => FOCUS_LABEL[s] ?? s).join(" / ")} split. ` +
      `Target ${scheme.sets} sets of ${scheme.reps} reps with ~${scheme.rest}s rest, adding weight as it gets easier.`,
    weeks,
    days_per_week: daysPerWeek,
    days,
  };
}
