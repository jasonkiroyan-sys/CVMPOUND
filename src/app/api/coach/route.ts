import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin, cors } from "@/lib/supabaseAdmin";
import {
  generateFallbackProgram,
  type CatalogItem,
  type GeneratedProgram,
} from "@/lib/coachFallback";
import type { GoalType, Experience } from "@/lib/supabase";

export const runtime = "nodejs";
export const maxDuration = 120;

const MODEL = "claude-opus-4-8";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: cors });
}

interface CoachRequest {
  goalType: GoalType;
  experience: Experience;
  daysPerWeek: number;
  sessionLengthMin?: number;
  notes?: string;
}

// ── POST /api/coach ───────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  let body: CoachRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400, headers: cors });
  }

  const goalType = body.goalType ?? "general_fitness";
  const experience = body.experience ?? "beginner";
  const daysPerWeek = Math.min(6, Math.max(2, Number(body.daysPerWeek) || 3));

  // Load available equipment.
  const { data: catalog, error: catErr } = await supabaseAdmin
    .from("equipment")
    .select("id, slug, name, category, muscle_groups, equipment_type")
    .eq("is_active", true);

  if (catErr) {
    return NextResponse.json({ error: catErr.message }, { status: 500, headers: cors });
  }
  if (!catalog || catalog.length === 0) {
    return NextResponse.json({ error: "empty_catalog" }, { status: 400, headers: cors });
  }
  const items = catalog as CatalogItem[];
  const slugToId = new Map(items.map((e) => [e.slug, e.id]));
  const slugToName = new Map(items.map((e) => [e.slug, e.name]));

  // Persist the goal.
  const { data: goal } = await supabaseAdmin
    .from("user_goals")
    .insert({
      goal_type: goalType,
      experience,
      days_per_week: daysPerWeek,
      session_length_min: body.sessionLengthMin ?? null,
      notes: body.notes ?? null,
    })
    .select()
    .single();

  let program: GeneratedProgram;
  let source: "claude" | "fallback" = "fallback";

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      program = await generateWithClaude(items, goalType, experience, daysPerWeek, body.notes);
      source = "claude";
    } catch {
      program = generateFallbackProgram(items, goalType, experience, daysPerWeek);
      source = "fallback";
    }
  } else {
    program = generateFallbackProgram(items, goalType, experience, daysPerWeek);
  }

  // Deactivate prior active programs, then persist the new one.
  await supabaseAdmin.from("coaching_programs").update({ is_active: false }).eq("is_active", true);

  const { data: savedProgram, error: progErr } = await supabaseAdmin
    .from("coaching_programs")
    .insert({
      goal_id: goal?.id ?? null,
      title: program.title,
      summary: program.summary,
      weeks: program.weeks,
      days_per_week: program.days_per_week,
      source,
      raw_json: program,
      is_active: true,
    })
    .select()
    .single();

  if (progErr || !savedProgram) {
    return NextResponse.json({ error: progErr?.message ?? "save_failed" }, { status: 500, headers: cors });
  }

  // Normalize days, mapping slugs → real equipment ids (dropping unknown slugs).
  const dayRows = program.days.map((d) => ({
    program_id: savedProgram.id,
    week_number: d.week_number,
    day_number: d.day_number,
    focus: d.focus,
    exercises: d.exercises
      .filter((ex) => slugToId.has(ex.equipment_slug))
      .map((ex) => ({
        equipment_id: slugToId.get(ex.equipment_slug) ?? null,
        equipment_name: slugToName.get(ex.equipment_slug) ?? ex.equipment_name,
        equipment_slug: ex.equipment_slug,
        sets: ex.sets,
        reps: ex.reps,
        rest_seconds: ex.rest_seconds,
        notes: ex.notes ?? "",
      })),
  }));

  const { data: savedDays, error: daysErr } = await supabaseAdmin
    .from("program_days")
    .insert(dayRows)
    .select();

  if (daysErr) {
    return NextResponse.json({ error: daysErr.message }, { status: 500, headers: cors });
  }

  return NextResponse.json({ program: savedProgram, days: savedDays, source }, { headers: cors });
}

// ── Claude program generation ────────────────────────────────────────────────
async function generateWithClaude(
  items: CatalogItem[],
  goalType: GoalType,
  experience: Experience,
  daysPerWeek: number,
  notes?: string
): Promise<GeneratedProgram> {
  const client = new Anthropic();

  const equipmentList = items
    .map((e) => `- slug: ${e.slug} | ${e.name} | ${e.category} | muscles: ${e.muscle_groups.join(", ") || "n/a"}`)
    .join("\n");

  const schema = {
    type: "object",
    additionalProperties: false,
    properties: {
      title: { type: "string" },
      summary: { type: "string" },
      weeks: { type: "integer" },
      days_per_week: { type: "integer" },
      days: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            week_number: { type: "integer" },
            day_number: { type: "integer" },
            focus: { type: "string" },
            exercises: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  equipment_slug: { type: "string" },
                  equipment_name: { type: "string" },
                  sets: { type: "integer" },
                  reps: { type: "string" },
                  rest_seconds: { type: "integer" },
                  notes: { type: "string" },
                },
                required: ["equipment_slug", "equipment_name", "sets", "reps", "rest_seconds", "notes"],
              },
            },
          },
          required: ["week_number", "day_number", "focus", "exercises"],
        },
      },
    },
    required: ["title", "summary", "weeks", "days_per_week", "days"],
  };

  // Stream because the program can be long; collect the final message.
  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 8000,
    system:
      "You are an expert strength & conditioning coach. Design a structured, progressive multi-week " +
      "workout program. CRITICAL: every exercise MUST reference an equipment_slug from the provided list — " +
      "do not invent equipment. Build a sensible training split for the goal, experience and days per week, " +
      "with appropriate sets, reps and rest, and progressive overload across weeks.",
    messages: [
      {
        role: "user",
        content:
          `Available equipment at the gym:\n${equipmentList}\n\n` +
          `Goal: ${goalType}\nExperience: ${experience}\nDays per week: ${daysPerWeek}\n` +
          (notes ? `Athlete notes: ${notes}\n` : "") +
          `\nProduce a 4-week program with exactly ${daysPerWeek} training days per week.`,
      },
    ],
    output_config: {
      format: { type: "json_schema", schema },
    },
  });

  const message = await stream.finalMessage();
  const textBlock = message.content.find((b) => b.type === "text");
  const raw = textBlock && "text" in textBlock ? textBlock.text : "{}";
  return JSON.parse(raw) as GeneratedProgram;
}
