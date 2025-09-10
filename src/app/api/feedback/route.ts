import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      originalAnalysis, 
      correctedDimensions
    } = body;

    console.log("🔍 [FEEDBACK] Processing AI feedback...");
    console.log("🔍 [FEEDBACK] Items with corrections:", correctedDimensions.length);

    // Create a feedback prompt to help improve future analysis
    const feedbackPrompt = `
You previously analyzed images and provided dimension estimates. The user has corrected some of these estimates because they were significantly inaccurate (>10% difference).

Original Analysis:
${JSON.stringify(originalAnalysis, null, 2)}

User Corrections:
${JSON.stringify(correctedDimensions, null, 2)}

Please provide feedback on what went wrong with your dimension estimation and how to improve accuracy in future analyses. Focus on:
1. What visual cues you might have missed
2. How to better estimate dimensions using room context
3. Common objects that can serve as size references
4. Any patterns in the errors

Keep your response concise and actionable.
    `;

    // Send feedback to OpenAI for learning (optional - you might want to store this locally instead)
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an AI assistant that helps improve dimension estimation accuracy. Provide constructive feedback on what went wrong and how to improve."
          },
          {
            role: "user",
            content: feedbackPrompt
          }
        ],
        max_tokens: 500,
        temperature: 0.3
      });

      const aiFeedback = response.choices[0]?.message?.content || "No specific feedback generated.";

      console.log("✅ [FEEDBACK] AI feedback generated successfully");

      return NextResponse.json({
        success: true,
        message: "Feedback processed successfully",
        aiFeedback: aiFeedback,
        correctionsCount: correctedDimensions.length
      });

    } catch (aiError) {
      console.error("❌ [FEEDBACK] Error generating AI feedback:", aiError);
      
      // Still return success even if AI feedback fails
      return NextResponse.json({
        success: true,
        message: "Feedback recorded (AI analysis failed)",
        correctionsCount: correctedDimensions.length
      });
    }

  } catch (error) {
    console.error("❌ [FEEDBACK] Error processing feedback:", error);
    
    return NextResponse.json({
      success: false,
      error: "Failed to process feedback",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
