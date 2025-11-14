/**
 * RAG (Retrieval-Augmented Generation) Prompt Enhancer
 * Uses feedback and training data to dynamically improve AI prompts
 */

import { getRecentFeedback, FeedbackData } from './ml-feedback';
import { prisma } from './db';
import { logger } from './logger';

export interface RAGInsights {
  commonlyMissedItems: Array<{ item: string; frequency: number; accuracy: number }>;
  commonlyOverIdentified: Array<{ item: string; frequency: number; accuracy: number }>;
  problematicRooms: Array<{ room: string; errorRate: number; editCount: number }>;
  dimensionIssues: {
    itemsWithLargeErrors: Array<{ item: string; avgErrorPercent: number }>;
    overallDimensionAccuracy: number;
  };
  contextSpecificInsights: Array<{
    context: string;  // e.g., "Kitchen with small items"
    issue: string;
    frequency: number;
  }>;
}

/**
 * Enhanced RAG retrieval combining feedback and training data
 */
export async function retrieveRAGInsights(days: number = 7): Promise<RAGInsights> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  try {
    // Retrieve from both FeedbackSession and TrainingData
    // Use Promise.allSettled to handle partial failures gracefully
    const [feedbackResult, trainingResult] = await Promise.allSettled([
      getRecentFeedback(days),
      getRecentTrainingDataInsights(startDate)
    ]);

    const feedbackData = feedbackResult.status === 'fulfilled' ? feedbackResult.value : [];
    const trainingData = trainingResult.status === 'fulfilled' ? trainingResult.value : [];

    if (feedbackResult.status === 'rejected') {
      logger.warn('Failed to retrieve feedback data, continuing with training data only', {
        component: 'rag_enhancer',
        error: feedbackResult.reason
      });
    }

    if (trainingResult.status === 'rejected') {
      logger.warn('Failed to retrieve training data, continuing with feedback data only', {
        component: 'rag_enhancer',
        error: trainingResult.reason
      });
    }

    // Combine insights from both sources
    const insights = aggregateInsights(feedbackData, trainingData);

    logger.info('RAG insights retrieved', {
      component: 'rag_enhancer',
      feedbackSessions: feedbackData.length,
      trainingDataSessions: trainingData.length,
      missedItems: insights.commonlyMissedItems.length,
      overIdentified: insights.commonlyOverIdentified.length
    });

    return insights;

  } catch (error) {
    logger.error('Failed to retrieve RAG insights', error as Error, {
      component: 'rag_enhancer'
    });
    return getEmptyInsights();
  }
}

/**
 * Get insights from training data (more comprehensive)
 */
async function getRecentTrainingDataInsights(startDate: Date): Promise<Array<{
  edits: Array<{
    editType: 'added' | 'removed' | 'modified';
    originalItem?: { shortName: string; roomName?: string | null };
    editedItem: { shortName: string; roomName?: string | null };
    fieldsChanged?: string[];
  }>;
  accuracyScore?: number;
  imageQuality?: string;
  roomName?: string | null;
}>> {
  try {
    // Check if TrainingData table exists (graceful fallback if migration not run)
    const trainingData = await prisma.trainingData.findMany({
      where: {
        createdAt: { gte: startDate },
        accuracyScore: { not: null }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    }).catch(() => {
      // Table doesn't exist yet - return empty array
      logger.warn('TrainingData table not found, skipping training data insights', {
        component: 'rag_enhancer'
      });
      return [];
    });

    return trainingData.map(data => {
      const trainingPoint = data.trainingDataPoint as unknown as {
        groundTruth?: {
          edits?: Array<{
            editType: string;
            originalItem?: { shortName?: string; roomName?: string | null };
            editedItem?: { shortName?: string; roomName?: string | null };
            fieldsChanged?: string[];
          }>;
        };
      };

      return {
        edits: trainingPoint?.groundTruth?.edits?.map(e => ({
          editType: e.editType as 'added' | 'removed' | 'modified',
          originalItem: e.originalItem ? {
            shortName: e.originalItem.shortName || '',
            roomName: e.originalItem.roomName
          } : undefined,
          editedItem: {
            shortName: e.editedItem?.shortName || '',
            roomName: e.editedItem?.roomName
          },
          fieldsChanged: e.fieldsChanged
        })) || [],
        accuracyScore: data.accuracyScore || undefined,
        imageQuality: data.imageQuality || undefined,
        roomName: undefined  // Could extract from trainingPoint
      };
    });

  } catch (error) {
    logger.error('Failed to get training data insights', error as Error);
    return [];
  }
}

/**
 * Aggregate insights from feedback and training data
 */
function aggregateInsights(
  feedbackData: FeedbackData[],
  trainingData: Array<{
    edits: Array<{
      editType: 'added' | 'removed' | 'modified';
      originalItem?: { shortName: string; roomName?: string | null };
      editedItem: { shortName: string; roomName?: string | null };
      fieldsChanged?: string[];
    }>;
    accuracyScore?: number;
    imageQuality?: string;
  }>
): RAGInsights {
  const commonlyMissedItems: Record<string, { count: number; accuracySum: number }> = {};
  const commonlyOverIdentified: Record<string, { count: number; accuracySum: number }> = {};
  const problematicRooms: Record<string, { errorCount: number; editCount: number }> = {};
  const dimensionErrors: Record<string, { errorSum: number; count: number }> = {};

  // Process feedback data
  feedbackData.forEach(feedback => {
    feedback.edits.forEach(edit => {
      const room = edit.editedItem.roomName || 'Unknown';

      if (edit.editType === 'added') {
        const itemName = edit.editedItem.shortName;
        if (!commonlyMissedItems[itemName]) {
          commonlyMissedItems[itemName] = { count: 0, accuracySum: 0 };
        }
        commonlyMissedItems[itemName].count++;
      }

      if (edit.editType === 'removed' && edit.originalItem) {
        const itemName = edit.originalItem.shortName;
        if (!commonlyOverIdentified[itemName]) {
          commonlyOverIdentified[itemName] = { count: 0, accuracySum: 0 };
        }
        commonlyOverIdentified[itemName].count++;
      }

      if (edit.editType !== 'added') {
        if (!problematicRooms[room]) {
          problematicRooms[room] = { errorCount: 0, editCount: 0 };
        }
        problematicRooms[room].editCount++;
      }

      // Track dimension errors
      if (edit.editType === 'modified' && edit.originalItem && edit.editedItem) {
        const itemName = edit.editedItem.shortName;
        const orig = edit.originalItem.dimensions;
        const edited = edit.editedItem.dimensions;

        if (orig.length && edited.length) {
          const errorPercent = Math.abs(orig.length - edited.length) / orig.length * 100;
          if (!dimensionErrors[itemName]) {
            dimensionErrors[itemName] = { errorSum: 0, count: 0 };
          }
          dimensionErrors[itemName].errorSum += errorPercent;
          dimensionErrors[itemName].count++;
        }
      }
    });
  });

  // Process training data (more comprehensive)
  trainingData.forEach(data => {
    data.edits.forEach(edit => {
      const room = edit.editedItem.roomName || 'Unknown';
      const accuracy = data.accuracyScore || 100;

      if (edit.editType === 'added') {
        const itemName = edit.editedItem.shortName;
        if (!commonlyMissedItems[itemName]) {
          commonlyMissedItems[itemName] = { count: 0, accuracySum: 0 };
        }
        commonlyMissedItems[itemName].count++;
        commonlyMissedItems[itemName].accuracySum += accuracy;
      }

      if (edit.editType === 'removed' && edit.originalItem) {
        const itemName = edit.originalItem.shortName;
        if (!commonlyOverIdentified[itemName]) {
          commonlyOverIdentified[itemName] = { count: 0, accuracySum: 0 };
        }
        commonlyOverIdentified[itemName].count++;
        commonlyOverIdentified[itemName].accuracySum += accuracy;
      }

      if (edit.editType !== 'added') {
        if (!problematicRooms[room]) {
          problematicRooms[room] = { errorCount: 0, editCount: 0 };
        }
        problematicRooms[room].editCount++;
        if (accuracy < 80) {
          problematicRooms[room].errorCount++;
        }
      }

      // Check dimension errors from fieldsChanged
      if (edit.fieldsChanged?.includes('dimensions')) {
        const itemName = edit.editedItem.shortName;
        if (!dimensionErrors[itemName]) {
          dimensionErrors[itemName] = { errorSum: 0, count: 0 };
        }
        dimensionErrors[itemName].count++;
      }
    });
  });

  // Convert to sorted arrays
  const missedItems = Object.entries(commonlyMissedItems)
    .map(([item, data]) => ({
      item,
      frequency: data.count,
      accuracy: data.count > 0 ? data.accuracySum / data.count : 100
    }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 10);

  const overIdentified = Object.entries(commonlyOverIdentified)
    .map(([item, data]) => ({
      item,
      frequency: data.count,
      accuracy: data.count > 0 ? data.accuracySum / data.count : 100
    }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 10);

  const rooms = Object.entries(problematicRooms)
    .map(([room, data]) => ({
      room,
      errorRate: data.editCount > 0 ? (data.errorCount / data.editCount) * 100 : 0,
      editCount: data.editCount
    }))
    .sort((a, b) => b.errorRate - a.errorRate)
    .slice(0, 5);

  const dimensionIssues = Object.entries(dimensionErrors)
    .map(([item, data]) => ({
      item,
      avgErrorPercent: data.count > 0 ? data.errorSum / data.count : 0
    }))
    .filter(d => d.avgErrorPercent > 20)  // Only significant errors
    .sort((a, b) => b.avgErrorPercent - a.avgErrorPercent)
    .slice(0, 5);

  const overallDimensionAccuracy = dimensionIssues.length > 0
    ? 100 - (dimensionIssues.reduce((sum, d) => sum + d.avgErrorPercent, 0) / dimensionIssues.length)
    : 100;

  return {
    commonlyMissedItems: missedItems,
    commonlyOverIdentified: overIdentified,
    problematicRooms: rooms,
    dimensionIssues: {
      itemsWithLargeErrors: dimensionIssues,
      overallDimensionAccuracy
    },
    contextSpecificInsights: []  // Can be enhanced with more context analysis
  };
}

/**
 * Generate enhanced prompt using RAG insights
 */
export async function generateRAGEnhancedPrompt(
  basePrompt: string,
  days: number = 7
): Promise<string> {
  try {
    const insights = await retrieveRAGInsights(days);

  if (
    insights.commonlyMissedItems.length === 0 &&
    insights.commonlyOverIdentified.length === 0 &&
    insights.problematicRooms.length === 0
  ) {
    return basePrompt;
  }

  const improvements: string[] = [];

  // Add commonly missed items
  if (insights.commonlyMissedItems.length > 0) {
    const topMissed = insights.commonlyMissedItems.slice(0, 5);
    const itemsList = topMissed.map(i => `${i.item} (missed ${i.frequency}x)`).join(', ');
    
    improvements.push(`
\n🔍 IMPORTANT - Based on ${days} days of user feedback:
Pay EXTRA attention to these commonly missed items: ${itemsList}
These items are often in the background or partially obscured. Scan carefully!`);

    // Add accuracy context
    const lowAccuracyItems = topMissed.filter(i => i.accuracy < 70);
    if (lowAccuracyItems.length > 0) {
      improvements.push(`\n⚠️ Low accuracy areas: ${lowAccuracyItems.map(i => i.item).join(', ')} - be especially thorough here.`);
    }
  }

  // Add over-identified items
  if (insights.commonlyOverIdentified.length > 0) {
    const topFalsePositives = insights.commonlyOverIdentified.slice(0, 5);
    const itemsList = topFalsePositives.map(i => `${i.item} (${i.frequency}x false positives)`).join(', ');
    
    improvements.push(`\n\n⚠️ CAUTION - False positives detected:
These items are sometimes incorrectly identified: ${itemsList}
Be MORE conservative - only identify these if you're 95%+ confident they're actually present and match the description.`);
  }

  // Add problematic rooms
  if (insights.problematicRooms.length > 0) {
    const topRooms = insights.problematicRooms.slice(0, 3);
    const roomsList = topRooms.map(r => `${r.room} (${r.errorRate.toFixed(1)}% error rate)`).join(', ');
    
    improvements.push(`\n\n🏠 FOCUS AREAS - High correction rate:
Users frequently make corrections in: ${roomsList}
Take extra care and double-check your analysis in these spaces.`);
  }

  // Add dimension accuracy guidance
  if (insights.dimensionIssues.itemsWithLargeErrors.length > 0) {
    const dimensionItems = insights.dimensionIssues.itemsWithLargeErrors.slice(0, 3);
    improvements.push(`\n\n📏 DIMENSION ACCURACY:
These items often have dimension errors: ${dimensionItems.map(i => `${i.item} (~${i.avgErrorPercent.toFixed(0)}% error)`).join(', ')}
Current overall dimension accuracy: ${insights.dimensionIssues.overallDimensionAccuracy.toFixed(1)}%
Be more precise with measurements for these item types.`);
  }

  return basePrompt + improvements.join('');
  } catch (error) {
    logger.error('Failed to generate RAG enhanced prompt', error as Error, {
      component: 'rag_enhancer'
    });
    return basePrompt;
  }
}

function getEmptyInsights(): RAGInsights {
  return {
    commonlyMissedItems: [],
    commonlyOverIdentified: [],
    problematicRooms: [],
    dimensionIssues: {
      itemsWithLargeErrors: [],
      overallDimensionAccuracy: 100
    },
    contextSpecificInsights: []
  };
}

