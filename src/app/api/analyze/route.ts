import { NextResponse } from "next/server";
import { openai, VISION_MODEL } from "@/lib/openai";
import { AnalysisSchema } from "@/types";
import { rateLimit } from "@/lib/rateLimit";
import { generateRAGEnhancedPrompt } from "@/lib/rag-prompt-enhancer";
import { getAuthedUser } from "@/lib/authz";

export const runtime = "nodejs";

// Each image is sent to the vision model at detail:"high", so an unbounded
// batch is both a cost and a latency problem. Cap it explicitly.
const MAX_IMAGES_PER_REQUEST = 20;

export async function POST(req: Request) {
  // Rate limit per authenticated user, not per X-Forwarded-For: that header is
  // caller-supplied and trivially rotated, which is not acceptable on a route
  // that spends money per call.
  const user = await getAuthedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await rateLimit({ key: `analyze:${user.id}`, points: 12, windowSec: 60 });
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

    // Both sources are sent to the model, so cap the combined total.
    if (urls.length + base64Images.length > MAX_IMAGES_PER_REQUEST) {
      return NextResponse.json(
        { error: `Too many images; maximum ${MAX_IMAGES_PER_REQUEST} per request` },
        { status: 413 }
      );
    }

    // Prepare image content for OpenAI API
    const imageContent: Array<{ type: "input_image"; image_url: string }> = [];
    
    // Collect room information for the prompt
    const roomInfo: string[] = [];
    
    // Honour both sources; `else if` here silently dropped every base64 image
    // whenever an S3 URL was also supplied.
    if (urls.length > 0) {
      // Use S3 URLs
      imageContent.push(...urls.map((u) => ({ type: "input_image" as const, image_url: u })));
    }

    if (base64Images.length > 0) {
      // Use base64 data URLs
      imageContent.push(...base64Images.map((img) => ({ type: "input_image" as const, image_url: img.dataUrl })));
      // Collect room information
      base64Images.forEach(img => {
        if (img.roomName) {
          roomInfo.push(`Image "${img.name}" is from the ${img.roomName}`);
        }
      });
    }

    // Use RAG to enhance prompt with feedback and training data insights
    const basePrompt = `Please analyze these room photos and create a detailed inventory of ALL movable items you can see. Look carefully at every corner, surface, and area of each image. Identify furniture, appliances, electronics, decorations, and personal items. For each item, estimate its dimensions, note any special handling requirements, and count how many of each item you can see.`;
    const improvedPrompt = await generateRAGEnhancedPrompt(basePrompt, 7);  // Last 7 days of feedback

    const response = await openai.chat.completions.create({
      model: VISION_MODEL,
      messages: [
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: improvedPrompt + `

⚠️ CRITICAL: The "count" field in your JSON response MUST exactly match the number you write in the description text. If you see 2 barstools and write "Two barstools" in the description, the count field must be 2, not 1.

CRITICAL COUNTING INSTRUCTIONS:
- Count EVERY instance of each item type you can see
- If you see 5 identical chairs, the count should be 5, not 1
- If you see 3 identical lamps, the count should be 3, not 1
- If you see 2 identical books, the count should be 2, not 1
- Group identical items together with their total count
- If items are similar but different (different colors, styles, sizes), list them as separate items with count 1 each
- Look for items that might be partially hidden or in the background
- Count items in all visible areas of the image

CRITICAL: The "count" field in your JSON response MUST match the number you mention in the description text.
If you write "Two chairs" in the description, the count field must be 2.
If you write "Three lamps" in the description, the count field must be 3.
The count field and description text must be consistent!

DESCRIPTION FORMATTING RULES:
- The description should describe the item's characteristics (material, color, style, purpose) AND include the count
- ALWAYS include the count/number in the description text (e.g., "2 small chairs", "3 lamps", "4 books")
- Keep descriptions informative and include both characteristics and quantity
- Use the count field to match the number mentioned in the description

EXAMPLES (count field MUST match description):
- 4 dining chairs around a table → shortName: "Dining Chairs", description: "4 wooden dining chairs with upholstered seats", count: 4
- 2 matching bedside lamps → shortName: "Bedside Lamps", description: "2 matching table lamps with fabric shades", count: 2
- 1 red chair and 1 blue chair → list as 2 separate items: 
  * shortName: "Red Chair", description: "1 red upholstered armchair", count: 1
  * shortName: "Blue Chair", description: "1 blue upholstered armchair", count: 1
- 3 books on a shelf → shortName: "Books", description: "3 hardcover books", count: 3
- 2 throw pillows on a sofa → shortName: "Throw Pillows", description: "2 decorative throw pillows", count: 2

WRONG EXAMPLE (DO NOT DO THIS):
- 2 chairs visible → shortName: "Chairs", description: "Two gray chairs near the window", count: 1 ❌
- This is WRONG because description says "Two" but count is 1

CORRECT EXAMPLE:
- 2 chairs visible → shortName: "Chairs", description: "Two gray chairs near the window", count: 2 ✅
- This is CORRECT because description says "Two" and count is 2

${roomInfo.length > 0 ? `Room Information: ${roomInfo.join('. ')}. Please assign each item to the correct room based on this information.` : ''}

BOUNDING BOX INSTRUCTIONS:
For each item you identify, please provide the bounding box coordinates showing where in the image that item is located. This helps us crop and show just that item in reports.
- Coordinates should be normalized between 0 and 1 (e.g., 0.5 = middle of image)
- x: horizontal position from left (0 = left edge, 1 = right edge)
- y: vertical position from top (0 = top edge, 1 = bottom edge)  
- width: width of the box as fraction of image width
- height: height of the box as fraction of image height
- sourceImageIndex: which image in the batch (0 for first image, 1 for second, etc.)

Example: A chair in the center of the first image might have: {"x": 0.4, "y": 0.3, "width": 0.3, "height": 0.5, "sourceImageIndex": 0}

Return your response as a JSON object with the following structure: { \"items\": [{\"shortName\": \"string\", \"description\": \"string\", \"estimatedDimensionsInches\": {\"length\": number, \"width\": number, \"height\": number}, \"notes\": \"string\", \"tags\": [\"string\"], \"roomName\": \"string\", \"count\": number, \"boundingBox\": {\"x\": number, \"y\": number, \"width\": number, \"height\": number} | null, \"sourceImageIndex\": number}], \"confidenceNote\": \"string\" }` 
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
    
    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "Model returned invalid JSON" }, { status: 502 });
    }
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
    
    // Upstream provider errors can carry request/context detail; log them but
    // return an opaque message to the caller.
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
