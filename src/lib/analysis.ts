import { openai, VISION_MODEL } from "@/lib/openai";
import { AnalysisSchema } from "@/types";

export interface AnalysisRequest {
  imageUrls?: string[];
  base64Images?: Array<{ name: string; dataUrl: string; roomName?: string | null }>;
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
  
  // Collect room information for the prompt
  const roomInfo: string[] = [];
  
  if (imageUrls.length > 0) {
    // Use S3 URLs
    imageContent.push(...imageUrls.map((u) => ({ type: "input_image" as const, image_url: u })));
  } else if (base64Images.length > 0) {
    // Use base64 data URLs - all files should now be images (videos converted to frames)
    const validImageData = base64Images.filter(img => {
      const isValidImage = img.dataUrl.startsWith('data:image/');
      if (!isValidImage) {
        console.warn(`Skipping ${img.name}: Not a valid image data URL (starts with: ${img.dataUrl.substring(0, 20)})`);
      }
      return isValidImage;
    });
    
    if (validImageData.length === 0) {
      throw new Error("No valid image files found for analysis");
    }
    
    // Process all images for OpenAI Vision API (including video frames)
    imageContent.push(...validImageData.map((img) => ({ type: "input_image" as const, image_url: img.dataUrl })));
    // Collect room information
    validImageData.forEach(img => {
      if (img.roomName) {
        roomInfo.push(`Image "${img.name}" is from the ${img.roomName}`);
      }
    });
    
    console.log("🔍 [ANALYSIS] Valid images found:", validImageData.length);
    console.log("🔍 [ANALYSIS] Image names:", validImageData.map(img => img.name));
    console.log("🔍 [ANALYSIS] Room info:", roomInfo);
  }

  let response;
  try {
    response = await openai.chat.completions.create({
      model: VISION_MODEL,
      messages: [
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: `Please analyze these images and create a detailed inventory of ALL movable items you can actually see in the images. Look carefully at every corner, surface, and area of each image. Identify furniture, appliances, electronics, decorations, and personal items that are visible.

IMPORTANT: Only analyze what you can actually see in the images. Do not make assumptions or generate generic items. If you cannot clearly see specific items in the images, indicate this in your confidence note.

For each item you can see, estimate its dimensions and note any special handling requirements.

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
  } catch (error) {
    console.error("❌ [ANALYSIS] OpenAI API error:", error);
    throw new Error(`OpenAI API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  const raw = response.choices[0]?.message?.content || '';
  if (!raw) {
    throw new Error("No response content from OpenAI");
  }
  
  const json = JSON.parse(raw);
  const parsed = AnalysisSchema.safeParse(json);
  
  if (!parsed.success) {
    throw new Error("Model returned unexpected shape: " + JSON.stringify(parsed.error.flatten()));
  }
  
  return parsed.data;
}
