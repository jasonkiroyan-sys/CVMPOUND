import { createClient } from "@supabase/supabase-js";

// The Supabase URL and anon key are public client credentials (they ship in
// every browser bundle by design — RLS, not secrecy, is the security boundary).
// Env vars win; these baked defaults point at the CVMPOUND project so the app
// works when deployed without extra config. To use a different backend, set
// NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY (see SETUP.md).
const DEFAULT_SUPABASE_URL = "https://iakxrkrogjjugugmznpn.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlha3hya3JvZ2pqdWd1Z216bnBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwMzk0NzAsImV4cCI6MjA5NzYxNTQ3MH0.X9BqTJbT2UnJf9NvW07FoerxUoyOcuxI-1JejlSlOXk";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? DEFAULT_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? DEFAULT_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const EQUIPMENT_BUCKET = "equipment-photos";

// ─── Type Definitions ─────────────────────────────────────────────────────────

export type EquipmentCategory =
  | "chest"
  | "back"
  | "legs"
  | "shoulders"
  | "arms"
  | "core"
  | "cardio"
  | "full_body";

export type EquipmentType =
  | "machine"
  | "cable"
  | "free_weight"
  | "bodyweight"
  | "cardio";

export type GoalType = "strength" | "hypertrophy" | "fat_loss" | "general_fitness";
export type Experience = "beginner" | "intermediate" | "advanced";

export const CATEGORIES: EquipmentCategory[] = [
  "chest",
  "back",
  "legs",
  "shoulders",
  "arms",
  "core",
  "cardio",
  "full_body",
];

export const EQUIPMENT_TYPES: EquipmentType[] = [
  "machine",
  "cable",
  "free_weight",
  "bodyweight",
  "cardio",
];

export interface Equipment {
  id: string;
  name: string;
  slug: string;
  category: EquipmentCategory;
  muscle_groups: string[];
  equipment_type: EquipmentType;
  photo_url: string | null;
  description: string | null;
  weight_increment: number;
  is_active: boolean;
  user_id: string | null;
  created_at: string;
}

/** Cardio equipment is logged by duration (time on the machine), not weight/reps. */
export function isCardio(e: Pick<Equipment, "equipment_type" | "category">): boolean {
  return e.equipment_type === "cardio" || e.category === "cardio";
}

export interface WorkoutSession {
  id: string;
  started_at: string;
  ended_at: string | null;
  notes: string | null;
  user_id: string | null;
  created_at: string;
}

export interface WorkoutSet {
  id: string;
  session_id: string;
  equipment_id: string;
  set_number: number;
  weight: number | null;
  reps: number | null;
  rest_seconds: number | null;
  duration_seconds: number | null;
  logged_at: string;
  user_id: string | null;
}

export interface UserGoal {
  id: string;
  goal_type: GoalType;
  experience: Experience;
  days_per_week: number;
  session_length_min: number | null;
  notes: string | null;
  user_id: string | null;
  created_at: string;
}

export interface ProgramExercise {
  equipment_id: string | null;
  equipment_name: string;
  equipment_slug?: string;
  sets: number;
  reps: string;
  rest_seconds: number;
  notes?: string;
}

export interface CoachingProgram {
  id: string;
  goal_id: string | null;
  title: string;
  summary: string;
  weeks: number;
  days_per_week: number;
  source: "claude" | "fallback";
  raw_json: unknown;
  is_active: boolean;
  user_id: string | null;
  created_at: string;
}

export interface ProgramDay {
  id: string;
  program_id: string;
  week_number: number;
  day_number: number;
  focus: string;
  exercises: ProgramExercise[];
  created_at: string;
}

// ─── Data Fetchers ────────────────────────────────────────────────────────────

export async function getEquipment(): Promise<Equipment[]> {
  const { data, error } = await supabase
    .from("equipment")
    .select("*")
    .eq("is_active", true)
    .order("category", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getEquipmentBySlug(slug: string): Promise<Equipment | null> {
  const { data, error } = await supabase
    .from("equipment")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

/** Returns the open session (no ended_at) or creates a new one. */
export async function getOrCreateActiveSession(): Promise<WorkoutSession> {
  const { data: existing, error } = await supabase
    .from("workout_sessions")
    .select("*")
    .is("ended_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (existing) return existing;

  const { data: created, error: createError } = await supabase
    .from("workout_sessions")
    .insert({})
    .select()
    .single();
  if (createError) throw createError;
  return created;
}

export async function getActiveSession(): Promise<WorkoutSession | null> {
  const { data, error } = await supabase
    .from("workout_sessions")
    .select("*")
    .is("ended_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

export async function getSetsForSession(sessionId: string): Promise<WorkoutSet[]> {
  const { data, error } = await supabase
    .from("workout_sets")
    .select("*")
    .eq("session_id", sessionId)
    .order("logged_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getSetsForEquipment(equipmentId: string): Promise<WorkoutSet[]> {
  const { data, error } = await supabase
    .from("workout_sets")
    .select("*")
    .eq("equipment_id", equipmentId)
    .order("logged_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getSessionHistory(limit = 30): Promise<WorkoutSession[]> {
  const { data, error } = await supabase
    .from("workout_sessions")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function getActiveProgram(): Promise<CoachingProgram | null> {
  const { data, error } = await supabase
    .from("coaching_programs")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

export async function getProgramDays(programId: string): Promise<ProgramDay[]> {
  const { data, error } = await supabase
    .from("program_days")
    .select("*")
    .eq("program_id", programId)
    .order("week_number", { ascending: true })
    .order("day_number", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
