import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sendFeedbackToAI, calculateAccuracyScore, getUserFeedbackMessage, ItemEdit } from "@/lib/ml-feedback";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

/**
 * Collect ML feedback from user edits
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { sessionId, edits, totalItems } = body as {
      sessionId: string;
      edits: ItemEdit[];
      totalItems: number;
    };

    if (!sessionId || !edits || !Array.isArray(edits)) {
      return NextResponse.json({ 
        error: "Missing required fields: sessionId, edits" 
      }, { status: 400 });
    }

    logger.info('ML feedback received', {
      component: 'ml_feedback',
      userId,
      sessionId,
      editCount: edits.length,
      totalItems
    });

    // Send feedback to AI improvement system
    const result = await sendFeedbackToAI(sessionId, edits);

    // Calculate accuracy score
    const accuracyScore = calculateAccuracyScore(edits, totalItems);

    // Get user-friendly feedback message
    const feedbackMessage = getUserFeedbackMessage(edits);

    return NextResponse.json({
      success: result.success,
      message: result.message,
      feedbackMessage,
      accuracyScore,
      stats: {
        totalEdits: edits.length,
        added: edits.filter(e => e.editType === 'added').length,
        removed: edits.filter(e => e.editType === 'removed').length,
        modified: edits.filter(e => e.editType === 'modified').length
      }
    });

  } catch (error) {
    logger.error('ML feedback API error', error as Error, {
      component: 'ml_feedback'
    });
    
    return NextResponse.json({ 
      error: "Failed to process feedback",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

/**
 * Get feedback statistics
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO: Get user-specific feedback statistics
    // For now, return mock data
    return NextResponse.json({
      totalFeedbackSessions: 0,
      averageAccuracyScore: 0,
      improvementTrend: 'stable'
    });

  } catch (error) {
    logger.error('Failed to fetch feedback stats', error as Error);
    return NextResponse.json({ 
      error: "Failed to fetch feedback statistics"
    }, { status: 500 });
  }
}

