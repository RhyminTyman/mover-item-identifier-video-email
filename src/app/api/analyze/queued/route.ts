import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserRole } from "@/lib/user";
import { analysisQueue } from "@/lib/analysis-queue";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
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
    const { base64Images, priority = 0 } = body;

    if (!Array.isArray(base64Images) || base64Images.length === 0) {
      return NextResponse.json({ error: "No valid images provided" }, { status: 400 });
    }

    // Add job to queue
    const jobId = await analysisQueue.addJob({
      userId,
      data: { base64Images },
      priority,
      maxRetries: 3
    });

    console.log(`📝 Added analysis job ${jobId} to queue for user ${userId}`);

    return NextResponse.json({ 
      jobId,
      message: "Analysis job queued successfully",
      estimatedWaitTime: "30-60 seconds"
    });

  } catch (error) {
    console.error("Error queuing analysis job:", error);
    return NextResponse.json({ 
      error: "Failed to queue analysis job", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json({ error: "Job ID required" }, { status: 400 });
    }

    const status = await analysisQueue.getJobStatus(jobId);
    
    if (status === 'not_found') {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (status === 'completed') {
      const result = await analysisQueue.getJobResult(jobId);
      return NextResponse.json({ 
        status, 
        result 
      });
    }

    return NextResponse.json({ status });

  } catch (error) {
    console.error("Error checking job status:", error);
    return NextResponse.json({ 
      error: "Failed to check job status", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}
