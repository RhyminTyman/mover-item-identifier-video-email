import { openai, VISION_MODEL } from "@/lib/openai";
import { AnalysisSchema } from "@/types";

export interface AnalysisRequest {
  imageUrls?: string[];
  base64Images?: Array<{ name: string; dataUrl: string }>;
}

export async function analyzeImages(request: AnalysisRequest) {
  const { imageUrls = [], base64Images = [] } = request;
  
  if (imageUrls.length === 0 && base64Images.length === 0) {
    throw new Error("Provide either imageUrls or base64Images");
  }

  console.log("🔍 [ANALYSIS] Starting image analysis...");
  console.log("🔍 [ANALYSIS] OpenAI API key:", process.env.OPENAI_API_KEY ? "Set" : "Not set");
  console.log("🔍 [ANALYSIS] Vision model:", process.env.OPENAI_VISION_MODEL || "gpt-4o");
  
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key is not set");
  }
  
  if (!openai) {
    throw new Error("OpenAI client is not initialized");
  }

  // Prepare image content for OpenAI API
  const imageContent: Array<{ type: "input_image"; image_url: string }> = [];
  
  if (imageUrls.length > 0) {
    // Use S3 URLs
    imageContent.push(...imageUrls.map((u) => ({ type: "input_image" as const, image_url: u })));
  } else if (base64Images.length > 0) {
    // Use base64 data URLs
    imageContent.push(...base64Images.map((img) => ({ type: "input_image" as const, image_url: img.dataUrl })));
  }

  let response;
  try {
    response = await openai.responses.create({
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
              maxItems: 100,
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  shortName: { type: "string", maxLength: 100 },
                  description: { type: "string", maxLength: 500 },
                  estimatedDimensionsInches: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      length: { type: "number", minimum: 0, maximum: 1000 },
                      width: { type: "number", minimum: 0, maximum: 1000 },
                      height: { type: "number", minimum: 0, maximum: 1000 }
                    },
                    required: ["length", "width", "height"]
                  },
                  notes: { type: "string", maxLength: 200 },
                  tags: {
                    type: "array",
                    maxItems: 10,
                    items: { type: "string", maxLength: 50 }
                  }
                },
                required: ["shortName", "description", "estimatedDimensionsInches", "notes", "tags"]
              }
            },
            confidenceNote: { type: "string", maxLength: 200 }
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
  } catch (error) {
    console.error("❌ [ANALYSIS] OpenAI API error:", error);
    throw new Error(`OpenAI API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  const raw = response.output_text || (response.output && response.output[0] && typeof response.output[0] === 'string' ? response.output[0] : '');
  const json = JSON.parse(raw);
  const parsed = AnalysisSchema.safeParse(json);
  
  if (!parsed.success) {
    throw new Error("Model returned unexpected shape: " + JSON.stringify(parsed.error.flatten()));
  }
  
  return parsed.data;
}
