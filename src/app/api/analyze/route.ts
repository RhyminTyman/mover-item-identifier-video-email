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
    const base64Images: Array<{ name: string; dataUrl: string; roomName?: string | null }> = Array.isArray(body.base64Images) ? body.base64Images : [];
    
    if (urls.length === 0 && base64Images.length === 0) {
      return NextResponse.json({ error: "Provide either imageUrls: string[] or base64Images: Array<{name: string, dataUrl: string}>" }, { status: 400 });
    }

    // Prepare image content for OpenAI API
    const imageContent: Array<{ type: "input_image"; image_url: string }> = [];
    
    // Collect room information for the prompt
    const roomInfo: string[] = [];
    
    if (urls.length > 0) {
      // Use S3 URLs
      imageContent.push(...urls.map((u) => ({ type: "input_image" as const, image_url: u })));
    } else if (base64Images.length > 0) {
      // Use base64 data URLs
      imageContent.push(...base64Images.map((img) => ({ type: "input_image" as const, image_url: img.dataUrl })));
      // Collect room information
      base64Images.forEach(img => {
        if (img.roomName) {
          roomInfo.push(`Image "${img.name}" is from the ${img.roomName}`);
        }
      });
    }

    const response = await openai.chat.completions.create({
      model: VISION_MODEL,
      messages: [
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: `Please analyze these room photos and create a detailed inventory of ALL movable items you can see. Look carefully at every corner, surface, and area of each image. Identify furniture, appliances, electronics, decorations, and personal items. For each item, estimate its dimensions and note any special handling requirements.

${roomInfo.length > 0 ? `Room Information: ${roomInfo.join('. ')}. Please assign each item to the correct room based on this information.` : ''}

Return your response as a JSON object with the following structure: { \"items\": [{\"shortName\": \"string\", \"description\": \"string\", \"estimatedDimensionsInches\": {\"length\": number, \"width\": number, \"height\": number}, \"notes\": \"string\", \"tags\": [\"string\"], \"roomName\": \"string\"}], \"confidenceNote\": \"string\" }` 
            },
            ...imageContent.map(img => ({
              type: "image_url" as const,
              image_url: {
                url: img.image_url,
                detail: "high" as const
              }
            }))
          ]
        }
      ],
      response_format: {
        type: "json_object"
      },
      max_tokens: 4000
    });

    const raw = response.choices[0]?.message?.content || '';
    if (!raw) {
      return NextResponse.json({ error: "No response content from OpenAI" }, { status: 502 });
    }
    
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
