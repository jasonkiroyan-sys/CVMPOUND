import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin, cors } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = "claude-opus-4-8";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: cors });
}

// ── POST /api/recognize ───────────────────────────────────────────────────────
// Body: { image: "<base64, no data: prefix>", mediaType: "image/jpeg" | "image/png" }
// Returns: { matched, equipment?, confidence?, reason? }
export async function POST(req: NextRequest) {
  let body: { image?: string; mediaType?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ matched: false, reason: "invalid_body" }, { status: 400, headers: cors });
  }

  if (!body.image) {
    return NextResponse.json({ matched: false, reason: "no_image" }, { status: 400, headers: cors });
  }

  // Graceful fallback: no key → UI falls back to manual grid selection.
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ matched: false, reason: "recognition_unavailable" }, { headers: cors });
  }

  // Load the active catalog to match against.
  const { data: catalog, error } = await supabaseAdmin
    .from("equipment")
    .select("slug, name, category, description")
    .eq("is_active", true);

  if (error) {
    return NextResponse.json({ matched: false, reason: error.message }, { status: 500, headers: cors });
  }
  if (!catalog || catalog.length === 0) {
    return NextResponse.json({ matched: false, reason: "empty_catalog" }, { headers: cors });
  }

  const catalogText = catalog
    .map((c) => `- slug: ${c.slug} | name: ${c.name} | category: ${c.category}${c.description ? ` | ${c.description}` : ""}`)
    .join("\n");

  const mediaType = (body.mediaType as "image/jpeg" | "image/png") || "image/jpeg";

  try {
    const client = new Anthropic();
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system:
        "You identify gym equipment from a photo by matching it to a fixed catalog. " +
        "Return the single best matching catalog slug. If nothing in the catalog matches the machine in the photo, set matched=false.",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: body.image },
            },
            {
              type: "text",
              text:
                `Here is the gym's equipment catalog:\n${catalogText}\n\n` +
                "Identify which ONE catalog item this photo shows. Only use a slug from the list above. " +
                "If no item is a confident match, return matched=false with slug=null.",
            },
          ],
        },
      ],
      output_config: {
        format: {
          type: "json_schema",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              matched: { type: "boolean" },
              slug: { type: ["string", "null"] },
              confidence: { type: "number" },
              reasoning: { type: "string" },
            },
            required: ["matched", "slug", "confidence", "reasoning"],
          },
        },
      },
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const raw = textBlock && "text" in textBlock ? textBlock.text : "{}";
    let parsed: { matched?: boolean; slug?: string | null; confidence?: number };
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json({ matched: false, reason: "parse_failed" }, { headers: cors });
    }

    // Never trust the model's slug blindly — validate against the real catalog.
    if (parsed.matched && parsed.slug) {
      const { data: match } = await supabaseAdmin
        .from("equipment")
        .select("*")
        .eq("slug", parsed.slug)
        .eq("is_active", true)
        .maybeSingle();

      if (match) {
        return NextResponse.json(
          { matched: true, equipment: match, confidence: parsed.confidence ?? 0.5 },
          { headers: cors }
        );
      }
    }

    return NextResponse.json({ matched: false }, { headers: cors });
  } catch (e) {
    const status = e instanceof Anthropic.RateLimitError ? 429 : 502;
    const reason = e instanceof Anthropic.APIError ? e.message : "recognition_error";
    return NextResponse.json({ matched: false, reason }, { status, headers: cors });
  }
}
