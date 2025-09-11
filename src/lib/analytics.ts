import { prisma } from '@/lib/db';

export interface AnalysisSessionData {
  totalImages: number;
  totalVideos: number;
  totalFiles: number;
  analysisDuration?: number;
  aiModel?: string;
  confidenceScore?: number;
  totalItemsFound: number;
  itemsEdited?: number;
  significantEdits?: number;
  feedbackSent?: boolean;
  errorOccurred?: boolean;
  errorMessage?: string;
}

export interface ItemAnalyticsData {
  shortName: string;
  description: string;
  roomName?: string | null;
  tags: string[];
  fileTags?: string[]; // Tags from the uploaded file
  aiLength?: number | null;
  aiWidth?: number | null;
  aiHeight?: number | null;
  aiConfidence?: number;
  userLength?: number | null;
  userWidth?: number | null;
  userHeight?: number | null;
  wasEdited?: boolean;
  editTimestamp?: Date;
  processingTime?: number;
  imageQuality?: string;
  itemComplexity?: string;
}

export interface FeedbackSessionData {
  correctedItems: number;
  totalDifferences: number;
  averageDifference: number;
  maxDifference: number;
  aiFeedback?: string;
  learningInsights?: string;
  suggestedImprovements?: string;
  processingTime?: number;
  errorOccurred?: boolean;
  errorMessage?: string;
}

// Generate a unique session ID
export function generateSessionId(): string {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Create a new analysis session
export async function createAnalysisSession(
  sessionId: string,
  data: AnalysisSessionData,
  userId?: string
) {
  try {
    const session = await prisma.analysisSession.create({
      data: {
        sessionId,
        userId,
        ...data,
      },
    });
    
    console.log(`📊 [ANALYTICS] Created analysis session: ${sessionId}`);
    return session;
  } catch (error) {
    console.error('❌ [ANALYTICS] Error creating analysis session:', error);
    throw error;
  }
}

// Add item analytics to a session
export async function addItemAnalytics(
  sessionId: string,
  items: ItemAnalyticsData[]
) {
  try {
    const itemAnalytics = items.map(item => {
      // Calculate accuracy metrics
      const lengthAccuracy = calculateAccuracy(item.aiLength, item.userLength);
      const widthAccuracy = calculateAccuracy(item.aiWidth, item.userWidth);
      const heightAccuracy = calculateAccuracy(item.aiHeight, item.userHeight);
      const overallAccuracy = [lengthAccuracy, widthAccuracy, heightAccuracy]
        .filter(acc => acc !== null)
        .reduce((sum, acc) => sum + acc, 0) / 3;
      
      const significantError = overallAccuracy < 90; // Less than 90% accuracy
      
      return {
        sessionId,
        ...item,
        lengthAccuracy,
        widthAccuracy,
        heightAccuracy,
        overallAccuracy: isNaN(overallAccuracy) ? null : overallAccuracy,
        significantError,
      };
    });

    const created = await prisma.itemAnalytics.createMany({
      data: itemAnalytics,
    });
    
    console.log(`📊 [ANALYTICS] Added ${created.count} item analytics for session: ${sessionId}`);
    return created;
  } catch (error) {
    console.error('❌ [ANALYTICS] Error adding item analytics:', error);
    throw error;
  }
}

// Create a feedback session
export async function createFeedbackSession(
  sessionId: string,
  data: FeedbackSessionData
) {
  try {
    const feedbackSession = await prisma.feedbackSession.create({
      data: {
        sessionId,
        ...data,
        feedbackProcessed: true,
      },
    });
    
    console.log(`📊 [ANALYTICS] Created feedback session: ${sessionId}`);
    return feedbackSession;
  } catch (error) {
    console.error('❌ [ANALYTICS] Error creating feedback session:', error);
    throw error;
  }
}

// Update analysis session with final results
export async function updateAnalysisSession(
  sessionId: string,
  updates: Partial<AnalysisSessionData>
) {
  try {
    const updated = await prisma.analysisSession.update({
      where: { sessionId },
      data: updates,
    });
    
    console.log(`📊 [ANALYTICS] Updated analysis session: ${sessionId}`);
    return updated;
  } catch (error) {
    console.error('❌ [ANALYTICS] Error updating analysis session:', error);
    throw error;
  }
}

// Calculate accuracy percentage between AI and user values
function calculateAccuracy(aiValue: number | null | undefined, userValue: number | null | undefined): number | null {
  if (!aiValue || !userValue) return null;
  if (aiValue === 0) return userValue === 0 ? 100 : 0;
  
  const difference = Math.abs(aiValue - userValue);
  const percentage = (difference / aiValue) * 100;
  return Math.max(0, 100 - percentage);
}

// Get analytics summary for a date range
export async function getAnalyticsSummary(startDate: Date, endDate: Date) {
  try {
    const sessions = await prisma.analysisSession.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        itemAnalytics: true,
        feedbackSessions: true,
      },
    });

    const totalSessions = sessions.length;
    const totalImages = sessions.reduce((sum, s) => sum + s.totalImages, 0);
    const totalItems = sessions.reduce((sum, s) => sum + s.totalItemsFound, 0);
    const totalEdits = sessions.reduce((sum, s) => sum + s.itemsEdited, 0);
    const totalFeedback = sessions.filter(s => s.feedbackSent).length;

    // Calculate accuracy metrics
    const allItems = sessions.flatMap(s => s.itemAnalytics);
    const itemsWithAccuracy = allItems.filter(item => item.overallAccuracy !== null);
    const averageAccuracy = itemsWithAccuracy.length > 0 
      ? itemsWithAccuracy.reduce((sum, item) => sum + (item.overallAccuracy || 0), 0) / itemsWithAccuracy.length
      : null;

    const significantErrors = allItems.filter(item => item.significantError).length;
    const itemsWithErrors = allItems.filter(item => item.overallAccuracy !== null && (item.overallAccuracy || 0) < 100).length;

    // Calculate performance metrics
    const sessionsWithDuration = sessions.filter(s => s.analysisDuration);
    const averageProcessingTime = sessionsWithDuration.length > 0
      ? sessionsWithDuration.reduce((sum, s) => sum + (s.analysisDuration || 0), 0) / sessionsWithDuration.length
      : null;

    // User behavior metrics
    const averageItemsPerSession = totalSessions > 0 ? totalItems / totalSessions : 0;
    const averageEditsPerSession = totalSessions > 0 ? totalEdits / totalSessions : 0;

    // Most common rooms and item types
    const roomCounts: Record<string, number> = {};
    const itemTypeCounts: Record<string, number> = {};
    
    allItems.forEach(item => {
      if (item.roomName) {
        roomCounts[item.roomName] = (roomCounts[item.roomName] || 0) + 1;
      }
      itemTypeCounts[item.shortName] = (itemTypeCounts[item.shortName] || 0) + 1;
    });

    const mostCommonRooms = Object.entries(roomCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([room]) => room);

    const mostCommonItemTypes = Object.entries(itemTypeCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([type]) => type);

    return {
      totalSessions,
      totalImages,
      totalItems,
      totalEdits,
      totalFeedback,
      averageAccuracy,
      itemsWithErrors,
      significantErrors,
      averageProcessingTime,
      averageItemsPerSession,
      averageEditsPerSession,
      mostCommonRooms,
      mostCommonItemTypes,
    };
  } catch (error) {
    console.error('❌ [ANALYTICS] Error getting analytics summary:', error);
    throw error;
  }
}

// Update daily system metrics
export async function updateDailyMetrics(date: Date) {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const summary = await getAnalyticsSummary(startOfDay, endOfDay);

    await prisma.systemMetrics.upsert({
      where: { date: startOfDay },
      update: {
        ...summary,
      },
      create: {
        date: startOfDay,
        ...summary,
      },
    });

    console.log(`📊 [ANALYTICS] Updated daily metrics for ${startOfDay.toISOString().split('T')[0]}`);
  } catch (error) {
    console.error('❌ [ANALYTICS] Error updating daily metrics:', error);
    throw error;
  }
}

// Get item accuracy trends
export async function getItemAccuracyTrends(days: number = 30) {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const items = await prisma.itemAnalytics.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        overallAccuracy: {
          not: null,
        },
      },
      select: {
        shortName: true,
        overallAccuracy: true,
        significantError: true,
        createdAt: true,
        roomName: true,
      },
    });

    // Group by item type
    const itemTrends: Record<string, {
      totalItems: number;
      averageAccuracy: number;
      significantErrors: number;
      accuracyByRoom: Record<string, number[]>;
    }> = {};

    items.forEach(item => {
      if (!itemTrends[item.shortName]) {
        itemTrends[item.shortName] = {
          totalItems: 0,
          averageAccuracy: 0,
          significantErrors: 0,
          accuracyByRoom: {},
        };
      }

      const trend = itemTrends[item.shortName];
      trend.totalItems++;
      trend.averageAccuracy += item.overallAccuracy || 0;
      
      if (item.significantError) {
        trend.significantErrors++;
      }

      if (item.roomName) {
        if (!trend.accuracyByRoom[item.roomName]) {
          trend.accuracyByRoom[item.roomName] = [];
        }
        trend.accuracyByRoom[item.roomName].push(item.overallAccuracy || 0);
      }
    });

    // Calculate averages
    Object.values(itemTrends).forEach(trend => {
      trend.averageAccuracy = trend.averageAccuracy / trend.totalItems;
      
      // Calculate room-specific averages
      Object.keys(trend.accuracyByRoom).forEach(room => {
        const accuracies = trend.accuracyByRoom[room];
        trend.accuracyByRoom[room] = [
          accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length
        ];
      });
    });

    return itemTrends;
  } catch (error) {
    console.error('❌ [ANALYTICS] Error getting item accuracy trends:', error);
    throw error;
  }
}
