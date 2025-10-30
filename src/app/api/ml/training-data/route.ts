import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { 
  exportTrainingDataJSONL, 
  getTrainingDataStats, 
  generateDatasetSummary 
} from "@/lib/training-data-collector";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

/**
 * GET: Get training data statistics and summary
 * POST: Export training data in JSONL format
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    // TODO: Add admin check when role system is ready
    // For now, allow any authenticated user

    const stats = await getTrainingDataStats();
    const summary = await generateDatasetSummary();

    return NextResponse.json({
      stats,
      summary: summary.summary,
      recommendations: summary.recommendations
    });

  } catch (error) {
    logger.error('Failed to fetch training data stats', error as Error);
    return NextResponse.json({ 
      error: "Failed to fetch training data statistics"
    }, { status: 500 });
  }
}

/**
 * Export training data in JSONL format for fine-tuning
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    // TODO: Add admin check

    const body = await req.json().catch(() => ({}));
    const {
      startDate,
      endDate,
      minAccuracy,
      exportedOnly = false
    } = body as {
      startDate?: string;
      endDate?: string;
      minAccuracy?: number;
      exportedOnly?: boolean;
    };

    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const jsonl = await exportTrainingDataJSONL(
      start,
      end,
      minAccuracy,
      exportedOnly
    );

    if (!jsonl) {
      return NextResponse.json({ 
        error: "No training data found matching criteria" 
      }, { status: 404 });
    }

    // Return as downloadable file
    return new NextResponse(jsonl, {
      status: 200,
      headers: {
        'Content-Type': 'application/jsonl',
        'Content-Disposition': `attachment; filename="training-data-${Date.now()}.jsonl"`
      }
    });

  } catch (error) {
    logger.error('Failed to export training data', error as Error);
    return NextResponse.json({ 
      error: "Failed to export training data",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

