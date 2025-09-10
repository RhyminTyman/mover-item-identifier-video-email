import { NextResponse } from "next/server";
import { openai, VISION_MODEL } from "@/lib/openai";
import { AnalysisSchema } from "@/types";
import { rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const ip = (req.headers.get("x-forwarded-for") ?? "local").split(",")[0].trim();
  const rl = await rateLimit({ key: `analyze:${ip}`, points: 12, windowSec: 60 });
  if (!rl.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  try {
    console.log("🔍 [ANALYZE] Starting image analysis...");
    console.log("🔍 [ANALYZE] OpenAI API key:", process.env.OPENAI_API_KEY ? "Set" : "Not set");
    console.log("🔍 [ANALYZE] Vision model:", process.env.OPENAI_VISION_MODEL || "gpt-4o");
    const body = await req.json();
    const urls: string[] = Array.isArray(body.imageUrls) ? body.imageUrls : [];
    const base64Images: Array<{ name: string; dataUrl: string }> = Array.isArray(body.base64Images) ? body.base64Images : [];
    
    if (urls.length === 0 && base64Images.length === 0) {
      return NextResponse.json({ error: "Provide either imageUrls: string[] or base64Images: Array<{name: string, dataUrl: string}>" }, { status: 400 });
    }

    // Prepare image content for OpenAI API
    const imageContent: Array<{ type: "input_image"; image_url: string }> = [];
    
    if (urls.length > 0) {
      // Use S3 URLs
      imageContent.push(...urls.map((u) => ({ type: "input_image" as const, image_url: u })));
    } else if (base64Images.length > 0) {
      // Use base64 data URLs
      imageContent.push(...base64Images.map((img) => ({ type: "input_image" as const, image_url: img.dataUrl })));
    }

    const response = await openai.responses.create({
      model: VISION_MODEL,
      text: {
        format: {
          type: "json_schema",
          name: "mover_inventory",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              items: {
                type: "array",
                maxItems: 50,
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    shortName: { type: "string" },
                    description: { type: "string" },
                    estimatedDimensionsInches: {
                      type: "object",
                      additionalProperties: false,
                      properties: {
                        length: { type: ["number", "null"] },
                        width: { type: ["number", "null"] },
                        height: { type: ["number", "null"] }
                      },
                      required: ["length", "width", "height"]
                    },
                    notes: { type: "string" },
                    tags: { type: "array", items: { type: "string" } },
                    roomName: { type: ["string", "null"] }
                  },
                  required: ["shortName", "description", "estimatedDimensionsInches", "notes", "tags", "roomName"]
                }
              },
              confidenceNote: { type: "string" }
            },
            required: ["items", "confidenceNote"]
          },
          strict: true
        }
      },
      instructions: [
        "Identify mover-relevant items (furniture, appliances, TVs, lamps, bikes, boxes).",
        "Return shortName, description, estimated dimensions (inches); null when unclear.",
        "Include notes/tags (fragile, glass, heavy, needs-disassembly; box-S/M/L/XL).",
        "Merge duplicates across photos if clearly the same item.",
        "Ignore people/pets/scenery; max 50 items."
      ].join(" "),
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: "Analyze these photos (sampled from images/videos) into one deduplicated inventory." },
            ...imageContent.map(img => ({
              type: "input_image" as const,
              image_url: img.image_url,
              detail: "low" as const
            }))
          ]
        }
      ]
    });

    const raw = response.output_text || (response.output && response.output[0] && typeof response.output[0] === 'string' ? response.output[0] : '');
    const json = JSON.parse(raw);
    const parsed = AnalysisSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Model returned unexpected shape", issues: parsed.error.flatten() }, { status: 502 });
    }
    return NextResponse.json(parsed.data);
  } catch (err: unknown) {
    const error = err as Error;
    console.error("❌ [ANALYZE] Error during analysis:", error);
    console.error("❌ [ANALYZE] Error name:", error?.name);
    console.error("❌ [ANALYZE] Error message:", error?.message);
    console.error("❌ [ANALYZE] Error stack:", error?.stack);
    
    return NextResponse.json({ 
      error: error?.message ?? "Unknown error",
      details: {
        name: error?.name,
        type: "analyze_error"
      }
    }, { status: 500 });
  }
}
