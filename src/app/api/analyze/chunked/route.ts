import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserRole } from "@/lib/user";
import { analyzeImages } from "@/lib/analysis";
import { rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const ip = (req.headers.get("x-forwarded-for") ?? "local").split(",")[0].trim();
  const rl = await rateLimit({ key: `analyze-chunked:${ip}`, points: 8, windowSec: 60 });
  if (!rl.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission
    const userRole = await getUserRole(userId);
    if (!userRole) {
      return NextResponse.json({ error: "User role not found" }, { status: 403 });
    }

    const body = await req.json();
    const { chunkIndex, totalChunks, base64Images } = body;

    if (!Array.isArray(base64Images) || base64Images.length === 0) {
      return NextResponse.json({ error: "No valid images provided" }, { status: 400 });
    }

    // For chunked processing, we'll process each chunk independently
    // This allows us to handle large videos by processing frames in smaller batches
    const analysisResult = await analyzeImages({
      base64Images: base64Images,
      chunkInfo: {
        chunkIndex: chunkIndex || 0,
        totalChunks: totalChunks || 1,
        isChunked: (totalChunks || 1) > 1
      }
    });

    return NextResponse.json(analysisResult);

  } catch (error) {
    console.error("Error in chunked analysis:", error);
    return NextResponse.json({ 
      error: "Analysis failed", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}
