/**
 * Training Data Collector for Custom Model Training
 * Collects comprehensive data for building our own mini vision-language model
 */

import { prisma } from './db';
import { logger } from './logger';
import type { Analysis } from '@/types';
import type { AnalysisItem } from '@/app/actions/state-actions';
import { Prisma } from '@prisma/client';

/**
 * Training Data Point Structure
 * Ready for fine-tuning vision-language models
 */
export interface TrainingDataPoint {
  // Input data (for training)
  image: {
    url?: string;
    base64?: string;
    embedding?: number[];  // Image embedding vector (optional, can compute later)
    metadata: {
      width: number;
      height: number;
      format: string;
      quality: 'high' | 'medium' | 'low';
      roomName?: string | null;
      fileTags?: string[];
    };
  };

  // AI prompt used
  prompt: {
    basePrompt: string;
    improvedPrompt?: string;  // If ML feedback was applied
    roomContext?: string[];
    feedbackInsights?: string[];
  };

  // AI predictions (before user edits)
  aiPrediction: {
    items: Array<{
      shortName: string;
      description: string;
      estimatedDimensions: {
        length: number | null;
        width: number | null;
        height: number | null;
      };
      roomName?: string | null;
      tags: string[];
      count: number;
      confidence?: number;
      boundingBox?: {
        x: number;
        y: number;
        width: number;
        height: number;
      } | null;
      sourceImageIndex?: number;
      notes?: string;
    }>;
    confidenceNote: string;
    modelInfo: {
      model: string;
      temperature?: number;
      maxTokens?: number;
      tokensUsed?: number;
      tokensPrompt?: number;
      tokensCompletion?: number;
    };
  };

  // Ground truth (after user edits)
  groundTruth: {
    items: Array<{
      shortName: string;
      description: string;
      estimatedDimensions: {
        length: number | null;
        width: number | null;
        height: number | null;
      };
      roomName?: string | null;
      tags: string[];
      count: number;
      boundingBox?: {
        x: number;
        y: number;
        width: number;
        height: number;
      } | null;
      sourceImageIndex?: number;
      notes?: string;
    }>;
    edits: Array<{
      editType: 'added' | 'removed' | 'modified';
      originalItem?: unknown;
      correctedItem: unknown;
      fieldsChanged: string[];
    }>;
  };

  // Training metadata
  metadata: {
    sessionId: string;
    timestamp: string;
    userId?: string;
    accuracyScore?: number;
    editCount?: number;
    analysisTime?: number;  // ms
    imageCount: number;
    itemCount: number;
  };

  // Format for training (instruction tuning format)
  trainingFormat?: {
    instruction: string;
    input: string;
    output: string;
  };
}

/**
 * Collect comprehensive training data from analysis session
 */
export async function collectTrainingData(
  sessionId: string,
  originalAnalysis: Analysis,
  finalAnalysis: Analysis,
  imageData: Array<{
    url?: string;
    base64?: string;
    width: number;
    height: number;
    format: string;
    roomName?: string | null;
    tags?: string[];
  }>,
  promptUsed: {
    basePrompt: string;
    improvedPrompt?: string;
    roomContext?: string[];
    feedbackInsights?: string[];
  },
  modelInfo: {
    model: string;
    temperature?: number;
    maxTokens?: number;
    tokensUsed?: number;
    tokensPrompt?: number;
    tokensCompletion?: number;
  },
  metadata: {
    userId?: string;
    analysisTime?: number;
  }
): Promise<void> {
  try {
    const edits = compareAnalysisResults(originalAnalysis, finalAnalysis);

    const trainingPoint: TrainingDataPoint = {
      image: {
        url: imageData[0]?.url,
        base64: imageData[0]?.base64,
        metadata: {
          width: imageData[0]?.width || 0,
          height: imageData[0]?.height || 0,
          format: imageData[0]?.format || 'unknown',
          quality: determineImageQuality(imageData[0]?.width || 0, imageData[0]?.height || 0),
          roomName: imageData[0]?.roomName || null,
          fileTags: imageData[0]?.tags || []
        }
      },
      prompt: promptUsed,
      aiPrediction: {
        items: originalAnalysis.items.map(item => ({
          shortName: item.shortName,
          description: item.description,
          estimatedDimensions: item.estimatedDimensionsInches,
          roomName: item.roomName,
          tags: item.tags || [],
          count: item.count,
          confidence: ('confidence' in item && typeof item.confidence === 'number') ? item.confidence : 0.8,
          boundingBox: item.boundingBox || null,
          sourceImageIndex: item.sourceImageIndex,
          notes: item.notes
        })),
        confidenceNote: originalAnalysis.confidenceNote,
        modelInfo
      },
      groundTruth: {
        items: finalAnalysis.items.map(item => ({
          shortName: item.shortName,
          description: item.description,
          estimatedDimensions: item.estimatedDimensionsInches,
          roomName: item.roomName,
          tags: item.tags || [],
          count: item.count,
          boundingBox: item.boundingBox || null,
          sourceImageIndex: item.sourceImageIndex,
          notes: item.notes
        })),
        edits
      },
      metadata: {
        sessionId,
        timestamp: new Date().toISOString(),
        userId: metadata.userId,
        accuracyScore: calculateAccuracyScore(edits, originalAnalysis.items.length),
        editCount: edits.length,
        analysisTime: metadata.analysisTime,
        imageCount: imageData.length,
        itemCount: finalAnalysis.items.length
      }
    };

    // Generate training format (instruction tuning)
    trainingPoint.trainingFormat = generateTrainingFormat(trainingPoint);

    // Store in database
    await storeTrainingDataPoint(sessionId, trainingPoint);

    logger.info('Training data collected', {
      component: 'training_data',
      sessionId,
      itemCount: trainingPoint.groundTruth.items.length,
      editCount: edits.length,
      accuracyScore: trainingPoint.metadata.accuracyScore
    });

  } catch (error) {
    logger.error('Failed to collect training data', error as Error, {
      component: 'training_data',
      sessionId
    });
  }
}

/**
 * Compare original AI analysis with final user-corrected analysis
 */
function compareAnalysisResults(
  original: Analysis,
  final: Analysis
): Array<{
  editType: 'added' | 'removed' | 'modified';
  originalItem?: AnalysisItem;
  correctedItem: AnalysisItem;
  fieldsChanged: string[];
}> {
  const edits: Array<{
    editType: 'added' | 'removed' | 'modified';
    originalItem?: AnalysisItem;
    correctedItem: AnalysisItem;
    fieldsChanged: string[];
  }> = [];

  // Find removed items
  original.items.forEach(origItem => {
    const stillExists = final.items.find(
      item => item.shortName === origItem.shortName &&
        item.description === origItem.description &&
        ('sourceImageIndex' in origItem && 'sourceImageIndex' in item ? item.sourceImageIndex === origItem.sourceImageIndex : true)
    );

    if (!stillExists) {
      edits.push({
        editType: 'removed',
        originalItem: origItem as AnalysisItem,
        correctedItem: origItem as AnalysisItem,  // Will be empty in ground truth
        fieldsChanged: ['removed']
      });
    }
  });

  // Find added items
  final.items.forEach(finalItem => {
    const wasInOriginal = original.items.find(
      item => item.shortName === finalItem.shortName &&
        item.description === finalItem.description &&
        ('sourceImageIndex' in finalItem && 'sourceImageIndex' in item ? item.sourceImageIndex === finalItem.sourceImageIndex : true)
    );

    if (!wasInOriginal) {
      edits.push({
        editType: 'added',
        correctedItem: finalItem as AnalysisItem,
        fieldsChanged: ['added']
      });
    }
  });

  // Find modified items
  original.items.forEach(origItem => {
    const finalItem = final.items.find(
      item => item.shortName === origItem.shortName &&
        item.description === origItem.description &&
        ('sourceImageIndex' in origItem && 'sourceImageIndex' in item ? item.sourceImageIndex === origItem.sourceImageIndex : true)
    );

    if (finalItem) {
      const fieldsChanged: string[] = [];

      if (origItem.estimatedDimensionsInches.length !== finalItem.estimatedDimensionsInches.length ||
          origItem.estimatedDimensionsInches.width !== finalItem.estimatedDimensionsInches.width ||
          origItem.estimatedDimensionsInches.height !== finalItem.estimatedDimensionsInches.height) {
        fieldsChanged.push('dimensions');
      }

      if (origItem.roomName !== finalItem.roomName) {
        fieldsChanged.push('roomName');
      }

      if (JSON.stringify(origItem.tags) !== JSON.stringify(finalItem.tags)) {
        fieldsChanged.push('tags');
      }

      if (origItem.count !== finalItem.count) {
        fieldsChanged.push('count');
      }

      if (origItem.description !== finalItem.description) {
        fieldsChanged.push('description');
      }

      if (fieldsChanged.length > 0) {
        edits.push({
          editType: 'modified',
          originalItem: origItem as AnalysisItem,
          correctedItem: finalItem as AnalysisItem,
          fieldsChanged
        });
      }
    }
  });

  return edits;
}

/**
 * Calculate accuracy score
 */
function calculateAccuracyScore(
  edits: Array<{ editType: string }>,
  totalItems: number
): number {
  if (totalItems === 0) return 100;

  const significantEdits = edits.filter(edit => 
    edit.editType === 'added' || edit.editType === 'removed'
  );

  const accuracyScore = ((totalItems - significantEdits.length) / totalItems) * 100;
  return Math.max(0, Math.min(100, accuracyScore));
}

/**
 * Determine image quality based on dimensions
 */
function determineImageQuality(
  width: number,
  height: number
): 'high' | 'medium' | 'low' {
  const megapixels = (width * height) / 1_000_000;

  if (megapixels >= 2) return 'high';
  if (megapixels >= 0.5) return 'medium';
  return 'low';
}

/**
 * Generate training format for instruction tuning
 */
function generateTrainingFormat(
  dataPoint: TrainingDataPoint
): {
  instruction: string;
  input: string;
  output: string;
} {
  const instruction = `Analyze the provided room image(s) and create a detailed inventory of ALL movable items. For each item, provide:
- shortName: Brief identifier
- description: Detailed description including count and characteristics
- estimatedDimensions: Length, width, height in inches (use null if unsure)
- roomName: Room where item is located
- tags: Relevant tags
- count: Number of instances
- boundingBox: Location in image (normalized 0-1 coordinates)`;

  const input = `Room Image(s): ${dataPoint.image.metadata.roomName || 'Unknown'}
Image Quality: ${dataPoint.image.metadata.quality}
Room Context: ${dataPoint.prompt.roomContext?.join(', ') || 'None'}

${dataPoint.prompt.feedbackInsights && dataPoint.prompt.feedbackInsights.length > 0 
  ? `\nLearning Insights:\n${dataPoint.prompt.feedbackInsights.join('\n')}`
  : ''}`;

  const output = JSON.stringify({
    items: dataPoint.groundTruth.items.map(item => ({
      shortName: item.shortName,
      description: item.description,
      estimatedDimensionsInches: item.estimatedDimensions,
      roomName: item.roomName,
      tags: item.tags,
      count: item.count,
      boundingBox: item.boundingBox,
      sourceImageIndex: item.sourceImageIndex,
      notes: item.notes || ''
    })),
    confidenceNote: `Analyzed ${dataPoint.groundTruth.items.length} items with user corrections applied.`
  }, null, 2);

  return { instruction, input, output };
}

/**
 * Store training data point in database
 */
async function storeTrainingDataPoint(
  sessionId: string,
  trainingPoint: TrainingDataPoint
): Promise<void> {
  try {
    // Store in TrainingData table
    await prisma.trainingData.upsert({
      where: { sessionId },
      update: {
        trainingDataPoint: JSON.parse(JSON.stringify(trainingPoint)) as Prisma.InputJsonValue,
        instructionFormat: trainingPoint.trainingFormat ? JSON.parse(JSON.stringify(trainingPoint.trainingFormat)) as Prisma.InputJsonValue : undefined,
        itemCount: trainingPoint.metadata.itemCount,
        editCount: trainingPoint.metadata.editCount || 0,
        accuracyScore: trainingPoint.metadata.accuracyScore,
        imageCount: trainingPoint.metadata.imageCount,
        imageQuality: trainingPoint.image.metadata.quality,
        analysisTime: trainingPoint.metadata.analysisTime,
        userId: trainingPoint.metadata.userId,
        modelVersion: trainingPoint.aiPrediction.modelInfo.model
      },
      create: {
        sessionId,
        trainingDataPoint: JSON.parse(JSON.stringify(trainingPoint)) as Prisma.InputJsonValue,
        instructionFormat: trainingPoint.trainingFormat ? JSON.parse(JSON.stringify(trainingPoint.trainingFormat)) as Prisma.InputJsonValue : undefined,
        itemCount: trainingPoint.metadata.itemCount,
        editCount: trainingPoint.metadata.editCount || 0,
        accuracyScore: trainingPoint.metadata.accuracyScore,
        imageCount: trainingPoint.metadata.imageCount,
        imageQuality: trainingPoint.image.metadata.quality,
        analysisTime: trainingPoint.metadata.analysisTime,
        userId: trainingPoint.metadata.userId,
        modelVersion: trainingPoint.aiPrediction.modelInfo.model,
        exported: false
      }
    });

  } catch (error) {
    logger.error('Failed to store training data point', error as Error, {
      component: 'training_data',
      sessionId
    });
  }
}

/**
 * Export training data in JSONL format (for fine-tuning)
 */
export async function exportTrainingDataJSONL(
  startDate?: Date,
  endDate?: Date,
  minAccuracy?: number,
  exportedOnly = false
): Promise<string> {
  try {
    const where: {
      createdAt?: { gte?: Date; lte?: Date };
      accuracyScore?: { gte: number };
      exported?: boolean;
    } = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    if (minAccuracy !== undefined) {
      where.accuracyScore = { gte: minAccuracy };
    }

    if (exportedOnly) {
      where.exported = false;
    }

    const trainingData = await prisma.trainingData.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    const trainingLines: string[] = [];

    for (const data of trainingData) {
      if (!data.instructionFormat) {
        // Fallback to generating from trainingDataPoint
        const trainingPoint = data.trainingDataPoint as unknown as TrainingDataPoint;
        if (trainingPoint.trainingFormat) {
          trainingLines.push(JSON.stringify(trainingPoint.trainingFormat));
        }
      } else {
        trainingLines.push(JSON.stringify(data.instructionFormat));
      }

      // Mark as exported
      if (!exportedOnly) {
        await prisma.trainingData.update({
          where: { id: data.id },
          data: {
            exported: true,
            exportedAt: new Date(),
            exportFormat: 'jsonl'
          }
        });
      }
    }

    return trainingLines.join('\n');

  } catch (error) {
    logger.error('Failed to export training data', error as Error);
    return '';
  }
}

/**
 * Get training data statistics
 */
export async function getTrainingDataStats(): Promise<{
  totalSessions: number;
  totalItems: number;
  averageAccuracy: number;
  totalEdits: number;
  dateRange: { start: string; end: string } | null;
  qualityDistribution: Record<string, number>;
}> {
  try {
    const trainingDataRecords = await prisma.trainingData.findMany({
      orderBy: { createdAt: 'asc' }
    });

    let totalItems = 0;
    let totalAccuracy = 0;
    let totalEdits = 0;
    const qualityDistribution: Record<string, number> = {};

    trainingDataRecords.forEach((record: { itemCount: number; accuracyScore: number | null; editCount: number; imageQuality: string | null }) => {
      totalItems += record.itemCount;
      totalAccuracy += record.accuracyScore || 0;
      totalEdits += record.editCount;

      const quality = record.imageQuality || 'unknown';
      qualityDistribution[quality] = (qualityDistribution[quality] || 0) + 1;
    });

    const averageAccuracy = trainingDataRecords.length > 0 ? totalAccuracy / trainingDataRecords.length : 0;

    const dateRange = trainingDataRecords.length > 0 ? {
      start: trainingDataRecords[0].createdAt.toISOString(),
      end: trainingDataRecords[trainingDataRecords.length - 1].createdAt.toISOString()
    } : null;

    return {
      totalSessions: trainingDataRecords.length,
      totalItems,
      averageAccuracy,
      totalEdits,
      dateRange,
      qualityDistribution
    };

  } catch (error) {
    logger.error('Failed to get training data stats', error as Error);
    return {
      totalSessions: 0,
      totalItems: 0,
      averageAccuracy: 0,
      totalEdits: 0,
      dateRange: null,
      qualityDistribution: {}
    };
  }
}

/**
 * Generate dataset summary for model training
 */
export async function generateDatasetSummary(): Promise<{
  summary: string;
  recommendations: string[];
}> {
  const stats = await getTrainingDataStats();

  const summary = `
TRAINING DATASET SUMMARY
========================
Total Sessions: ${stats.totalSessions}
Total Items: ${stats.totalItems}
Average Accuracy: ${stats.averageAccuracy.toFixed(2)}%
Total Edits: ${stats.totalEdits}

Date Range: ${stats.dateRange ? `${stats.dateRange.start} to ${stats.dateRange.end}` : 'N/A'}

Image Quality Distribution:
- High: ${stats.qualityDistribution.high || 0}
- Medium: ${stats.qualityDistribution.medium || 0}
- Low: ${stats.qualityDistribution.low || 0}
`;

  const recommendations: string[] = [];

  if (stats.totalSessions < 100) {
    recommendations.push('Need at least 100 training sessions for meaningful model training');
  }

  if (stats.totalItems < 1000) {
    recommendations.push('Aim for at least 1,000 total items for robust training');
  }

  if (stats.averageAccuracy < 70) {
    recommendations.push('AI accuracy is low - consider collecting more high-quality examples');
  }

  if ((stats.qualityDistribution.high || 0) < stats.totalSessions * 0.5) {
    recommendations.push('Increase proportion of high-quality images (50%+)');
  }

  if (stats.totalEdits / stats.totalItems < 0.1) {
    recommendations.push('More user corrections needed - current edit rate is too low');
  }

  return { summary, recommendations };
}

