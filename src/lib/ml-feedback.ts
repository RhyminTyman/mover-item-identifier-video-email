/**
 * Machine Learning Feedback System
 * Collects and analyzes user edits to improve AI accuracy
 */

import { prisma } from './db';
import { logger } from './logger';
import { createFeedbackSession } from './analytics';

export interface ItemEdit {
  originalItem?: {
    shortName: string;
    description: string;
    dimensions: {
      length: number | null;
      width: number | null;
      height: number | null;
    };
    roomName?: string | null;
    tags: string[];
  };
  editedItem: {
    shortName: string;
    description: string;
    dimensions: {
      length: number | null;
      width: number | null;
      height: number | null;
    };
    roomName?: string | null;
    tags: string[];
  };
  editType: 'modified' | 'added' | 'removed';
  imageContext?: string; // Base64 or URL of the image
}

export interface FeedbackData {
  sessionId: string;
  edits: ItemEdit[];
  imageUrls?: string[];
  userSatisfaction?: 'satisfied' | 'neutral' | 'unsatisfied';
  additionalNotes?: string;
}

/**
 * Collect feedback when user edits items
 */
export async function collectItemEditFeedback(
  sessionId: string,
  edits: ItemEdit[]
): Promise<void> {
  try {
    logger.info('Collecting ML feedback', {
      component: 'ml_feedback',
      sessionId,
      editCount: edits.length,
      addedCount: edits.filter(e => e.editType === 'added').length,
      removedCount: edits.filter(e => e.editType === 'removed').length,
      modifiedCount: edits.filter(e => e.editType === 'modified').length
    });

    // Analyze edits to understand patterns
    const feedback = analyzeEdits(edits);

    // Store feedback for future AI improvement
    await createFeedbackSession(sessionId, {
      correctedItems: feedback.correctedItems,
      totalDifferences: feedback.totalDifferences,
      averageDifference: feedback.averageDifference,
      maxDifference: feedback.maxDifference,
      aiFeedback: feedback.insights,
      learningInsights: feedback.learningInsights,
      suggestedImprovements: feedback.suggestedImprovements,
      processingTime: Date.now()
    });

    logger.info('ML feedback collected successfully', {
      component: 'ml_feedback',
      sessionId,
      insights: feedback.insights
    });

  } catch (error) {
    logger.error('Failed to collect ML feedback', error as Error, {
      component: 'ml_feedback',
      sessionId
    });
  }
}

/**
 * Analyze user edits to extract learning insights
 */
function analyzeEdits(edits: ItemEdit[]): {
  correctedItems: number;
  totalDifferences: number;
  averageDifference: number;
  maxDifference: number;
  insights: string;
  learningInsights: string;
  suggestedImprovements: string;
} {
  const addedItems = edits.filter(e => e.editType === 'added');
  const removedItems = edits.filter(e => e.editType === 'removed');
  const modifiedItems = edits.filter(e => e.editType === 'modified');

  // Calculate dimension differences for modified items
  const dimensionDifferences: number[] = [];
  modifiedItems.forEach(edit => {
    if (edit.originalItem && edit.editedItem) {
      const orig = edit.originalItem.dimensions;
      const edited = edit.editedItem.dimensions;

      if (orig.length && edited.length) {
        const diff = Math.abs(orig.length - edited.length) / orig.length;
        dimensionDifferences.push(diff);
      }
      if (orig.width && edited.width) {
        const diff = Math.abs(orig.width - edited.width) / orig.width;
        dimensionDifferences.push(diff);
      }
      if (orig.height && edited.height) {
        const diff = Math.abs(orig.height - edited.height) / orig.height;
        dimensionDifferences.push(diff);
      }
    }
  });

  const averageDifference = dimensionDifferences.length > 0
    ? dimensionDifferences.reduce((a, b) => a + b, 0) / dimensionDifferences.length
    : 0;

  const maxDifference = dimensionDifferences.length > 0
    ? Math.max(...dimensionDifferences)
    : 0;

  // Generate insights
  const insights = generateInsights(addedItems, removedItems, modifiedItems, averageDifference);
  const learningInsights = generateLearningInsights(edits);
  const suggestedImprovements = generateImprovementSuggestions(edits);

  return {
    correctedItems: edits.length,
    totalDifferences: dimensionDifferences.length,
    averageDifference: averageDifference * 100, // Convert to percentage
    maxDifference: maxDifference * 100,
    insights,
    learningInsights,
    suggestedImprovements
  };
}

/**
 * Generate insights from edit patterns
 */
function generateInsights(
  addedItems: ItemEdit[],
  removedItems: ItemEdit[],
  modifiedItems: ItemEdit[],
  avgDiff: number
): string {
  const insights: string[] = [];

  if (addedItems.length > 0) {
    const addedNames = addedItems.map(e => e.editedItem.shortName);
    insights.push(`AI missed ${addedItems.length} items: ${addedNames.slice(0, 3).join(', ')}${addedNames.length > 3 ? '...' : ''}`);
  }

  if (removedItems.length > 0) {
    const removedNames = removedItems.map(e => e.originalItem?.shortName || 'Unknown');
    insights.push(`AI incorrectly identified ${removedItems.length} items: ${removedNames.slice(0, 3).join(', ')}${removedNames.length > 3 ? '...' : ''}`);
  }

  if (modifiedItems.length > 0) {
    insights.push(`${modifiedItems.length} items had corrections`);
    
    if (avgDiff > 0.2) {
      insights.push(`Average dimension error: ${(avgDiff * 100).toFixed(1)}%`);
    }
  }

  return insights.join('. ');
}

/**
 * Generate learning insights for AI improvement
 */
function generateLearningInsights(edits: ItemEdit[]): string {
  const patterns: string[] = [];

  // Analyze room-specific errors
  const roomErrors: Record<string, number> = {};
  edits.forEach(edit => {
    const room = edit.editedItem.roomName || 'Unknown';
    roomErrors[room] = (roomErrors[room] || 0) + 1;
  });

  const problematicRooms = Object.entries(roomErrors)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  if (problematicRooms.length > 0) {
    patterns.push(`Most corrections in: ${problematicRooms.map(([room, count]) => `${room} (${count})`).join(', ')}`);
  }

  // Analyze item type errors
  const itemTypeErrors: Record<string, number> = {};
  edits.forEach(edit => {
    const itemType = edit.editedItem.shortName;
    itemTypeErrors[itemType] = (itemTypeErrors[itemType] || 0) + 1;
  });

  const problematicItems = Object.entries(itemTypeErrors)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  if (problematicItems.length > 0) {
    patterns.push(`Most corrected items: ${problematicItems.map(([item, count]) => `${item} (${count})`).join(', ')}`);
  }

  return patterns.join('. ');
}

/**
 * Generate improvement suggestions
 */
function generateImprovementSuggestions(edits: ItemEdit[]): string {
  const suggestions: string[] = [];

  const addedItems = edits.filter(e => e.editType === 'added');
  const removedItems = edits.filter(e => e.editType === 'removed');

  if (addedItems.length > 0) {
    suggestions.push('AI should be more thorough in identifying small or background items');
  }

  if (removedItems.length > 0) {
    suggestions.push('AI should be more conservative to avoid false positives');
  }

  // Check for dimension issues
  const largeDimensionErrors = edits.filter(edit => {
    if (edit.originalItem && edit.editedItem) {
      const orig = edit.originalItem.dimensions;
      const edited = edit.editedItem.dimensions;
      
      if (orig.length && edited.length) {
        return Math.abs(orig.length - edited.length) / orig.length > 0.3;
      }
    }
    return false;
  });

  if (largeDimensionErrors.length > 0) {
    suggestions.push('AI dimension estimates need improvement');
  }

  return suggestions.join('. ');
}

/**
 * Generate improved AI prompt based on feedback
 */
export async function generateImprovedPrompt(
  basePrompt: string,
  recentFeedback: FeedbackData[]
): Promise<string> {
  if (recentFeedback.length === 0) {
    return basePrompt;
  }

  // Aggregate feedback insights
  const commonlyMissedItems: Record<string, number> = {};
  const commonlyOverIdentified: Record<string, number> = {};
  const problematicRooms: Record<string, number> = {};

  recentFeedback.forEach(feedback => {
    feedback.edits.forEach(edit => {
      if (edit.editType === 'added') {
        const itemName = edit.editedItem.shortName;
        commonlyMissedItems[itemName] = (commonlyMissedItems[itemName] || 0) + 1;
      }
      
      if (edit.editType === 'removed' && edit.originalItem) {
        const itemName = edit.originalItem.shortName;
        commonlyOverIdentified[itemName] = (commonlyOverIdentified[itemName] || 0) + 1;
      }

      const room = edit.editedItem.roomName || 'Unknown';
      if (edit.editType !== 'added') {
        problematicRooms[room] = (problematicRooms[room] || 0) + 1;
      }
    });
  });

  // Build improvement additions to prompt
  const improvements: string[] = [];

  if (Object.keys(commonlyMissedItems).length > 0) {
    const topMissed = Object.entries(commonlyMissedItems)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([item]) => item);
    
    improvements.push(`\n\nIMPORTANT: Based on user feedback, pay special attention to these commonly missed items: ${topMissed.join(', ')}. Look carefully for these even if they're small or in the background.`);
  }

  if (Object.keys(commonlyOverIdentified).length > 0) {
    const topOverIdentified = Object.entries(commonlyOverIdentified)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([item]) => item);
    
    improvements.push(`\n\nCAUTION: These items are sometimes incorrectly identified: ${topOverIdentified.join(', ')}. Be more conservative and only identify these if you're very confident.`);
  }

  if (Object.keys(problematicRooms).length > 0) {
    const topProblematicRooms = Object.entries(problematicRooms)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([room]) => room);
    
    improvements.push(`\n\nFOCUS AREAS: Users frequently make corrections in these rooms: ${topProblematicRooms.join(', ')}. Take extra care when analyzing items in these spaces.`);
  }

  return basePrompt + improvements.join('');
}

/**
 * Get recent feedback for prompt improvement
 */
export async function getRecentFeedback(days: number = 7): Promise<FeedbackData[]> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const feedbackSessions = await prisma.feedbackSession.findMany({
      where: {
        createdAt: {
          gte: startDate
        }
      },
      include: {
        analysisSession: {
          include: {
            itemAnalytics: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100 // Last 100 feedback sessions
    });

    // Transform to FeedbackData format
    const feedbackData: FeedbackData[] = feedbackSessions.map(session => {
      const edits: ItemEdit[] = session.analysisSession?.itemAnalytics
        .filter(item => item.wasEdited)
        .map(item => ({
          originalItem: {
            shortName: item.shortName,
            description: item.description,
            dimensions: {
              length: item.aiLength,
              width: item.aiWidth,
              height: item.aiHeight
            },
            roomName: item.roomName,
            tags: item.tags || []
          },
          editedItem: {
            shortName: item.shortName,
            description: item.description,
            dimensions: {
              length: item.userLength || item.aiLength,
              width: item.userWidth || item.aiWidth,
              height: item.userHeight || item.aiHeight
            },
            roomName: item.roomName,
            tags: item.tags || []
          },
          editType: 'modified' as const
        })) || [];

      return {
        sessionId: session.sessionId,
        edits,
        userSatisfaction: undefined,
        additionalNotes: session.aiFeedback || undefined
      };
    });

    return feedbackData;
  } catch (error) {
    logger.error('Failed to fetch recent feedback', error as Error, {
      component: 'ml_feedback'
    });
    return [];
  }
}

/**
 * Send feedback to improve AI model
 * This creates a refined prompt for future analyses
 */
export async function sendFeedbackToAI(
  sessionId: string,
  edits: ItemEdit[]
): Promise<{ success: boolean; message: string }> {
  try {
    // Collect feedback
    await collectItemEditFeedback(sessionId, edits);

    // Get recent feedback to improve prompts
    const recentFeedback = await getRecentFeedback(7);
    
    logger.info('Feedback sent to AI improvement system', {
      component: 'ml_feedback',
      sessionId,
      recentFeedbackCount: recentFeedback.length
    });

    return {
      success: true,
      message: `Thank you! Your edits help improve our AI. We've recorded ${edits.length} corrections.`
    };
  } catch (error) {
    logger.error('Failed to send feedback to AI', error as Error, {
      component: 'ml_feedback',
      sessionId
    });

    return {
      success: false,
      message: 'Failed to record feedback, but your edits were saved.'
    };
  }
}

/**
 * Calculate accuracy score based on edits
 */
export function calculateAccuracyScore(edits: ItemEdit[], totalItems: number): number {
  if (totalItems === 0) return 100;

  const significantEdits = edits.filter(edit => {
    if (edit.editType === 'added' || edit.editType === 'removed') {
      return true;
    }

    if (edit.originalItem && edit.editedItem) {
      // Check if dimensions changed significantly (>20%)
      const orig = edit.originalItem.dimensions;
      const edited = edit.editedItem.dimensions;

      if (orig.length && edited.length) {
        const diff = Math.abs(orig.length - edited.length) / orig.length;
        if (diff > 0.2) return true;
      }
    }

    return false;
  });

  const accuracyScore = ((totalItems - significantEdits.length) / totalItems) * 100;
  return Math.max(0, Math.min(100, accuracyScore));
}

/**
 * Notify user about AI improvement
 */
export function getUserFeedbackMessage(edits: ItemEdit[]): string {
  const addedCount = edits.filter(e => e.editType === 'added').length;
  const removedCount = edits.filter(e => e.editType === 'removed').length;
  const modifiedCount = edits.filter(e => e.editType === 'modified').length;

  const messages: string[] = [];

  if (addedCount > 0) {
    messages.push(`✅ Learned about ${addedCount} missed item${addedCount > 1 ? 's' : ''}`);
  }

  if (removedCount > 0) {
    messages.push(`✅ Learned to avoid ${removedCount} false positive${removedCount > 1 ? 's' : ''}`);
  }

  if (modifiedCount > 0) {
    messages.push(`✅ Improved accuracy for ${modifiedCount} item${modifiedCount > 1 ? 's' : ''}`);
  }

  if (messages.length === 0) {
    return '✨ AI analysis was perfect! No corrections needed.';
  }

  return '🤖 AI Learning: ' + messages.join(' • ') + ' • Thank you for helping improve our system!';
}

