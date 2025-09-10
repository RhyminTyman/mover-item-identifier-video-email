import { NextResponse } from "next/server";
import { getAnalyticsSummary, getItemAccuracyTrends, updateDailyMetrics } from "@/lib/analytics";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '30');
    const action = searchParams.get('action') || 'summary';

    console.log(`📊 [ANALYTICS API] Request: ${action}, days: ${days}`);

    switch (action) {
      case 'summary': {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const summary = await getAnalyticsSummary(startDate, endDate);
        
        return NextResponse.json({
          success: true,
          data: summary,
          period: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            days
          }
        });
      }

      case 'trends': {
        const trends = await getItemAccuracyTrends(days);
        
        return NextResponse.json({
          success: true,
          data: trends,
          period: { days }
        });
      }

      case 'update-daily': {
        const today = new Date();
        await updateDailyMetrics(today);
        
        return NextResponse.json({
          success: true,
          message: `Daily metrics updated for ${today.toISOString().split('T')[0]}`
        });
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: summary, trends, or update-daily'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ [ANALYTICS API] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch analytics data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
