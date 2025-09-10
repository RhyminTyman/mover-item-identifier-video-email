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
        "CAREFULLY examine each image to identify EVERY individual item that can be moved. Look for:",
        "• Furniture: chairs, tables, desks, sofas, beds, dressers, bookcases, shelves, cabinets",
        "• Appliances: refrigerators, stoves, microwaves, dishwashers, washers, dryers, TVs, computers",
        "• Electronics: monitors, speakers, gaming consoles, routers, lamps, fans",
        "• Personal items: bikes, exercise equipment, artwork, mirrors, rugs, plants",
        "• Storage: boxes, bins, suitcases, bags, containers",
        "• Decor: vases, frames, sculptures, decorative objects",
        "For EACH item found, provide:",
        "- shortName: Brief name (e.g., 'Dining Chair', 'Coffee Table', 'Lamp')",
        "- description: Detailed description including color, material, style",
        "- estimatedDimensionsInches: {length, width, height} in inches (estimate based on room context)",
        "- notes: Any special handling notes (fragile, heavy, disassembled, etc.)",
        "- tags: Relevant tags like ['fragile', 'heavy', 'glass', 'wood', 'metal', 'needs-disassembly']",
        "IMPORTANT: Count and identify EVERY visible item, not just major furniture. Include small items, decorations, and accessories.",
        "If you see multiple similar items (like 4 dining chairs), list them as separate items.",
        "Estimate dimensions by comparing to known objects (doors are ~30\" wide, standard chairs ~18\" wide).",
        "Maximum 100 items per room. Be thorough and detailed."
      ].join(" "),
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: "Please analyze these room photos and create a detailed inventory of ALL movable items you can see. Look carefully at every corner, surface, and area of each image. Identify furniture, appliances, electronics, decorations, and personal items. For each item, estimate its dimensions and note any special handling requirements." },
            ...imageContent.map(img => ({
              type: "input_image" as const,
              image_url: img.image_url,
              detail: "high" as const
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
