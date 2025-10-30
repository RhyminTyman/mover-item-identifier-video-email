"use server";

import { updateAppState, setError, updateProgress, setAnalysisResult, startAnalysis, getAppState, AnalysisItem } from './state-actions';
import { prisma } from '@/lib/db';
import { analyzeImages } from '@/lib/analysis';
import { processChunkedAnalysis } from '@/lib/chunked-analysis';
import { currentUser } from '@clerk/nextjs/server';
import { ensureUserExists } from '@/lib/user';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Analysis } from '@/types';
import { 
  generateSessionId, 
  createAnalysisSession, 
  addItemAnalytics, 
  updateAnalysisSession,
  type AnalysisSessionData,
  type ItemAnalyticsData 
} from '@/lib/analytics';
import { collectItemEditFeedback, ItemEdit } from '@/lib/ml-feedback';
import { collectTrainingData } from '@/lib/training-data-collector';

// Type definitions
interface FileData {
  name: string;
  type: string;
  preview?: string;
}

// Removed unused AnalysisItem interface


// File upload to S3
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function uploadToS3(fileData: FileData, signedUrl: string): Promise<void> {
  // Convert base64 or file data to blob
  let file: File;
  
  if (fileData instanceof File) {
    file = fileData;
  } else if (fileData.preview && fileData.preview.startsWith('blob:')) {
    // Convert blob URL to File
    const response = await fetch(fileData.preview);
    const blob = await response.blob();
    file = new File([blob], fileData.name, { type: fileData.type });
  } else {
    throw new Error('Invalid file data');
  }

  const response = await fetch(signedUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  });

  if (!response.ok) {
    throw new Error(`S3 upload failed: ${response.statusText}`);
  }
}

// Get S3 signed URL
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function getSignedUrl(fileName: string, fileType: string): Promise<string> {
  const response = await fetch('/api/s3/sign', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fileName,
      fileType,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to get signed URL');
  }

  const data = await response.json();
  return data.signedUrl;
}

// Analyze image with OpenAI
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function analyzeImage(imageUrl: string, roomName: string): Promise<Analysis> {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      imageUrl,
      roomName,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Analysis failed');
  }

  return response.json();
}

// Main analysis action (legacy - now calls the new function)
export async function analyzeFiles(): Promise<void> {
  const state = await getAppState();
  const files = state.files;
  
  if (files.length === 0) {
    throw new Error('No files to analyze');
  }

  try {
    // Get signed URL for first file
    const firstFile = files[0];
    const signedUrl = await getSignedUrl(firstFile.name, firstFile.type);
    
    // Upload file to S3
    await uploadToS3(firstFile as FileData, signedUrl);
    
    // Analyze the image
    const roomName = firstFile.roomName || 'Unknown Room';
    const analysisResult = await analyzeImage(signedUrl, roomName);
    
    // Debug: Log the raw AI response
    console.log('🔍 [ANALYSIS] Raw AI response:', JSON.stringify(analysisResult, null, 2));
    

    // Helper function to make item names plural when count > 1
    const makePlural = (name: string, count: number): string => {
      if (count <= 1) return name;
      
      // Handle common pluralization rules
      if (name.endsWith('y') && !name.endsWith('ey')) {
        return name.slice(0, -1) + 'ies';
      } else if (name.endsWith('s') || name.endsWith('sh') || name.endsWith('ch') || name.endsWith('x') || name.endsWith('z')) {
        return name; // Already plural, don't add 'es'
      } else if (name.endsWith('stool')) {
        return name + 's'; // "stool" -> "stools"
      } else {
        return name + 's';
      }
    };

    // Convert to AnalysisItem format with confidence and count
    const result = {
      ...analysisResult,
      items: analysisResult.items.map(item => {
        // Use the count directly from the AI response
        let finalCount = item.count || 1;
        
        // Check for count/description mismatches and fix them
        const description = item.description?.toLowerCase() || '';
        const hasCountInDescription = /\b(one|two|three|four|five|six|seven|eight|nine|ten|\d+)\b/.test(description);
        
        if (hasCountInDescription) {
          // Extract count from description if it doesn't match the AI count
          const countMatch = description.match(/\b(two|three|four|five|six|seven|eight|nine|ten|\d+)\b/);
          if (countMatch) {
            const numberMap: { [key: string]: number } = {
              'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
              'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
            };
            const extractedCount = numberMap[countMatch[1]] || parseInt(countMatch[1], 10);
            
            if (extractedCount && extractedCount !== finalCount) {
              console.log(`🔧 [FIX] Correcting count mismatch: "${item.shortName}" - AI said ${finalCount} but description says ${extractedCount}`);
              finalCount = extractedCount;
            }
          }
        }
        
        // Debug logging to check for count/description mismatches
        console.log('🔍 [ANALYSIS] Item processing:', {
          shortName: item.shortName,
          description: item.description,
          aiCount: item.count,
          finalCount: finalCount,
          hasMismatch: item.description?.toLowerCase().includes('two') && item.count === 1
        });
        
        return {
          ...item,
          shortName: makePlural(item.shortName, finalCount),
          confidence: 0.8, // Default confidence
          count: finalCount
        };
      })
    };
    
    // Set analysis result
    await setAnalysisResult(result);
  } catch (error) {
    console.error('Analysis error:', error);
    throw error;
  }
}

// New analysis action that accepts base64 files from client (both images and videos)
export async function analyzeFilesWithImages(base64Files: Array<{ name: string; dataUrl: string; type: 'image' | 'video'; roomName?: string | null }>): Promise<void> {
  console.log('🔍 [ANALYZE] analyzeFilesWithImages called with', base64Files.length, 'files');
  console.log('🔍 [ANALYZE] File details:', base64Files.map(f => ({ name: f.name, type: f.type, size: f.dataUrl?.length })));
  
  const sessionId = generateSessionId();
  const startTime = Date.now();
  
  try {
    await startAnalysis();
    
    const state = await getAppState();
    const files = state.files;
    
    if (base64Files.length === 0) {
      throw new Error('No valid files found for analysis');
    }

    // Count file types from the actual files being processed
    const imageCount = base64Files.filter(f => f.type === 'image').length;
    const videoCount = base64Files.filter(f => f.type === 'video').length;

    await updateProgress(20, `Processing ${base64Files.length} file${base64Files.length !== 1 ? 's' : ''} (${imageCount} photo${imageCount !== 1 ? 's' : ''}, ${videoCount} video${videoCount !== 1 ? 's' : ''})...`);

    // Separate images and videos for different processing, and map room information
    const base64Images = base64Files.filter(f => f.type === 'image').map(file => {
      const stateFile = files.find(f => f.name === file.name);
      return {
        ...file,
        roomName: stateFile?.roomName || file.roomName || null
      };
    });
    const base64Videos = base64Files.filter(f => f.type === 'video').map(file => {
      const stateFile = files.find(f => f.name === file.name);
      return {
        ...file,
        roomName: stateFile?.roomName || file.roomName || null
      };
    });

    let analysisResult: Analysis;

    // Combine all files for processing
    const allFiles = [...base64Images, ...base64Videos];
    
    // Check if we need chunked processing based on payload size
    const totalSizeKB = allFiles.reduce((total, file) => {
      return total + ((file.dataUrl.length * 0.75) / 1024); // Base64 is ~33% larger than binary
    }, 0);
    
    const needsChunkedProcessing = totalSizeKB > 30000; // 30MB threshold for chunked processing
    
    if (needsChunkedProcessing) {
      await updateProgress(40, `Analyzing ${allFiles.length} files with chunked processing (${totalSizeKB.toFixed(1)}KB total)...`);
      
      const chunkedResult = await processChunkedAnalysis(allFiles, {
        maxChunkSize: 8, // Max 8 frames per chunk for large payloads
        maxChunkSizeKB: 8000, // Max 8MB per chunk
        maxFileSizeMB: 50 // Warn if over 50MB
      });
      
      analysisResult = {
        items: chunkedResult.items,
        confidenceNote: chunkedResult.confidenceNote
      };
    } else {
      // Process normally for smaller payloads
      if (base64Images.length > 0 && base64Videos.length > 0) {
        await updateProgress(40, 'Analyzing images and videos with AI...');
      } else if (base64Images.length > 0) {
        await updateProgress(40, 'Analyzing images with AI...');
      } else {
        await updateProgress(40, 'Analyzing videos with AI...');
      }
      
      analysisResult = await analyzeImages({
        base64Images: allFiles
      });
    }
    
    await updateProgress(80, 'Processing analysis results...');

    const analysisDuration = Date.now() - startTime;

    // Get current user for analytics
    const clerkUser = await currentUser();
    const userId = clerkUser?.id;

    // Create analytics session
    const sessionData: AnalysisSessionData = {
      totalImages: imageCount,
      totalVideos: videoCount,
      totalFiles: base64Files.length,
      analysisDuration,
      aiModel: process.env.OPENAI_VISION_MODEL || 'gpt-4o-mini',
      totalItemsFound: analysisResult.items.length,
      itemsEdited: 0,
      significantEdits: 0,
      feedbackSent: false,
      errorOccurred: false,
    };

    await createAnalysisSession(sessionId, sessionData, userId);

    // Prepare item analytics data
    const itemAnalyticsData: ItemAnalyticsData[] = analysisResult.items.map((item) => {
      // Find the corresponding file to get its tags
      const correspondingFile = files.find(f => f.name === item.shortName?.split(' from ')[1]);
      
      return {
        shortName: item.shortName,
        description: item.description,
        roomName: item.roomName,
        tags: item.tags || [],
        fileTags: correspondingFile?.tags || [],
        aiLength: item.estimatedDimensionsInches?.length,
        aiWidth: item.estimatedDimensionsInches?.width,
        aiHeight: item.estimatedDimensionsInches?.height,
        aiConfidence: 0.8, // Default confidence, could be improved with actual AI confidence scores
        processingTime: Math.floor(analysisDuration / analysisResult.items.length),
        imageQuality: 'high', // Could be determined by image analysis
        itemComplexity: determineItemComplexity(item),
      };
    });

    // Add item analytics
    await addItemAnalytics(sessionId, itemAnalyticsData);


    // Convert to AnalysisItem format with confidence and count
    // Helper function to make item names plural when count > 1
    const makePlural = (name: string, count: number): string => {
      if (count <= 1) return name;
      
      // Handle common pluralization rules
      if (name.endsWith('y') && !name.endsWith('ey')) {
        return name.slice(0, -1) + 'ies';
      } else if (name.endsWith('s') || name.endsWith('sh') || name.endsWith('ch') || name.endsWith('x') || name.endsWith('z')) {
        return name; // Already plural, don't add 'es'
      } else if (name.endsWith('stool')) {
        return name + 's'; // "stool" -> "stools"
      } else {
        return name + 's';
      }
    };

    const result = {
      ...analysisResult,
      items: analysisResult.items.map(item => {
        // Use the count directly from the AI response
        let finalCount = item.count || 1;
        
        // Check for count/description mismatches and fix them
        const description = item.description?.toLowerCase() || '';
        const hasCountInDescription = /\b(one|two|three|four|five|six|seven|eight|nine|ten|\d+)\b/.test(description);
        
        if (hasCountInDescription) {
          // Extract count from description if it doesn't match the AI count
          const countMatch = description.match(/\b(two|three|four|five|six|seven|eight|nine|ten|\d+)\b/);
          if (countMatch) {
            const numberMap: { [key: string]: number } = {
              'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
              'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
            };
            const extractedCount = numberMap[countMatch[1]] || parseInt(countMatch[1], 10);
            
            if (extractedCount && extractedCount !== finalCount) {
              console.log(`🔧 [FIX] Correcting count mismatch: "${item.shortName}" - AI said ${finalCount} but description says ${extractedCount}`);
              finalCount = extractedCount;
            }
          }
        }
        
        // Debug logging to check for count/description mismatches
        console.log('🔍 [ANALYSIS] Item processing:', {
          shortName: item.shortName,
          description: item.description,
          aiCount: item.count,
          finalCount: finalCount,
          hasMismatch: item.description?.toLowerCase().includes('two') && item.count === 1
        });
        
        return {
          ...item,
          shortName: makePlural(item.shortName, finalCount),
          confidence: 0.8, // Default confidence
          count: finalCount
        };
      })
    };

    // Set the final result
    console.log('🔍 [ANALYSIS] Setting analysis result:', {
      itemsCount: result.items.length,
      confidenceNote: result.confidenceNote
    });
    await setAnalysisResult(result, sessionId);

    await updateProgress(100, 'Analysis complete!');

  } catch (error) {
    console.error('Analysis error:', error);
    
    // Record error in analytics
    try {
      await updateAnalysisSession(sessionId, {
        errorOccurred: true,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
    } catch (analyticsError) {
      console.error('Failed to record error in analytics:', analyticsError);
    }
    
    await setError(error instanceof Error ? error.message : 'Analysis failed');
  }
}

// Helper function to determine item complexity
function determineItemComplexity(item: { description?: string; tags?: string[] }): string {
  const description = (item.description || '').toLowerCase();
  const tags = (item.tags || []).join(' ').toLowerCase();
  const text = `${description} ${tags}`;
  
  // Simple heuristics for complexity
  if (text.includes('box') || text.includes('container') || text.includes('simple')) {
    return 'simple';
  } else if (text.includes('furniture') || text.includes('appliance') || text.includes('complex')) {
    return 'complex';
  } else {
    return 'moderate';
  }
}

// Save inventory to database (without redirect)
export async function saveInventoryToDatabase(): Promise<{ success: boolean; inventoryId?: string; error?: string }> {
  try {
    const state = await getAppState();
    
    console.log('🔍 [SAVE] Current state:', {
      hasResult: !!state.result,
      resultItems: state.result?.items?.length || 0,
      phase: state.phase,
      progress: state.progress,
      error: state.error
    });
    
    let analysisResult = state.result;
    
    // If no result in state, try to get it from database using session ID
    if (!analysisResult) {
      console.log('🔍 [SAVE] No result in state, trying to retrieve from database...');
      
      // Try to get the most recent analysis session for this user
      const clerkUser = await currentUser();
      if (clerkUser) {
        const recentSession = await prisma.analysisSession.findFirst({
          where: {
            userId: clerkUser.id
          },
          orderBy: {
            updatedAt: 'desc'
          }
        });
        
        if (recentSession?.analysisResult) {
          const parsedResult = JSON.parse(recentSession.analysisResult) as { items: Array<Partial<AnalysisItem> & { confidence?: number; count?: number }>; confidenceNote?: string; [key: string]: unknown };
          
          // Helper function to make item names plural when count > 1
          const makePlural = (name: string, count: number): string => {
            if (count <= 1) return name;
            
            // Simple pluralization rules
            if (name.endsWith('y')) {
              return name.slice(0, -1) + 'ies';
            } else if (name.endsWith('s') || name.endsWith('sh') || name.endsWith('ch') || name.endsWith('x') || name.endsWith('z')) {
              return name + 'es';
            } else {
              return name + 's';
            }
          };
          
          // Ensure confidence and count are added to items
          analysisResult = {
            ...parsedResult,
            confidenceNote: parsedResult.confidenceNote || '',
            items: parsedResult.items.map((item) => ({
              shortName: makePlural(item.shortName || '', item.count || 1),
              description: item.description || '',
              estimatedDimensionsInches: item.estimatedDimensionsInches || { length: null, width: null, height: null },
              notes: item.notes || '',
              tags: item.tags || [],
              roomName: item.roomName || null,
              confidence: item.confidence || 0.8,
              count: item.count || 1
            }))
          };
          console.log('🔍 [SAVE] Retrieved result from database:', {
            itemsCount: analysisResult?.items.length || 0
          });
        }
      }
    }
    
    if (!analysisResult) {
      console.error('❌ [SAVE] No analysis result found in state or database');
      throw new Error('No analysis result to save');
    }

    await updateAppState({ saving: true });

    // Get current user
    const clerkUser = await currentUser();
    if (!clerkUser) {
      throw new Error('User not authenticated');
    }

    // Ensure user exists in database (create if not found)
    const dbUser = await ensureUserExists(
      clerkUser.id,
      clerkUser.emailAddresses[0].emailAddress,
      clerkUser.firstName || '',
      clerkUser.lastName || '',
      'customer'
    );

    // Determine if this is a sales user creating inventory for a customer
    const isSalesUser = dbUser.role === 'sales' || dbUser.role === 'admin';
    const customerId = isSalesUser ? state.customerId : dbUser.id;
    const salesUserId = isSalesUser ? dbUser.id : null;

    // Collect ML feedback and training data before saving
    try {
      await collectMLFeedbackFromEdits(state);

      // Collect comprehensive training data for custom model development
      if (state.originalAnalysisResult && state.result && state.sessionId) {
        // Get analysis session to retrieve prompt and model info
        const analysisSession = await prisma.analysisSession.findUnique({
          where: { sessionId: state.sessionId }
        });

        // Prepare image data from state.files
        const imageData = state.files
          .filter(f => f.kind === 'image')
          .map(file => ({
            url: file.preview?.startsWith('http') ? file.preview : undefined,
            base64: file.preview?.startsWith('data:') ? file.preview : undefined,
            width: 1920, // Default, could be extracted from image metadata
            height: 1080, // Default, could be extracted from image metadata
            format: file.type.split('/')[1] || 'jpeg',
            roomName: file.roomName,
            tags: file.tags || []
          }));

        if (imageData.length > 0 && analysisSession) {
          await collectTrainingData(
            state.sessionId,
            state.originalAnalysisResult as Analysis,
            state.result as Analysis,
            imageData,
            {
              basePrompt: 'Analyze room photos and create inventory',
              improvedPrompt: undefined, // Could retrieve from session if stored
              roomContext: imageData.map(img => img.roomName || '').filter(Boolean),
              feedbackInsights: undefined
            },
            {
              model: analysisSession.aiModel || 'gpt-4o',
              maxTokens: 4000,
              tokensUsed: undefined, // Could track this
              tokensPrompt: undefined,
              tokensCompletion: undefined
            },
            {
              userId: clerkUser.id,
              analysisTime: analysisSession.analysisDuration || undefined
            }
          );

          console.log(`📊 [TRAINING_DATA] Collected training data for session ${state.sessionId}`);
        }
      }
    } catch (feedbackError) {
      console.error('Failed to collect ML feedback/training data:', feedbackError);
      // Continue with save even if feedback collection fails
    }

    // Create inventory in database
    const newInventory = await prisma.inventory.create({
      data: {
        title: state.title,
        note: state.note,
        userId: customerId,
        salesUserId: salesUserId,
        items: {
          create: analysisResult.items.map(item => ({
            shortName: item.shortName,
            description: item.description,
            notes: item.notes,
            lengthIn: item.estimatedDimensionsInches.length,
            widthIn: item.estimatedDimensionsInches.width,
            heightIn: item.estimatedDimensionsInches.height,
            count: item.count,
            tags: item.tags,
            roomName: item.roomName
          }))
        }
      }
    });

    // Reset the analysis state
    await resetAnalysis();
    
    // Force page refresh to show the inventories tab
    revalidatePath('/dashboard');
    
    return { success: true, inventoryId: newInventory.id };
    
  } catch (error) {
    console.error('Save error:', error);
    await setError(error instanceof Error ? error.message : 'Save failed');
    return { success: false, error: error instanceof Error ? error.message : 'Save failed' };
  } finally {
    await updateAppState({ saving: false });
  }
}

// Save inventory to database (with redirect for server components)
export async function saveInventory(): Promise<void> {
  const result = await saveInventoryToDatabase();
  if (result.success && result.inventoryId) {
    redirect(`/inventories/${result.inventoryId}`);
  } else {
    throw new Error(result.error || 'Save failed');
  }
}

/**
 * Collect ML feedback by comparing original AI results with final items
 */
async function collectMLFeedbackFromEdits(state: {
  originalAnalysisResult?: { items: AnalysisItem[]; confidenceNote: string } | null;
  analysisResult?: { items: AnalysisItem[]; confidenceNote: string } | null;
  sessionId?: string;
}): Promise<void> {
  if (!state.originalAnalysisResult || !state.analysisResult || !state.sessionId) {
    return; // No feedback to collect
  }

  const originalItems = state.originalAnalysisResult.items;
  const finalItems = state.analysisResult.items;

  const edits: ItemEdit[] = [];

  // Find removed items (in original but not in final)
  originalItems.forEach(originalItem => {
    const stillExists = finalItems.find(
      item => item.shortName === originalItem.shortName && 
      item.description === originalItem.description
    );

    if (!stillExists) {
      edits.push({
        originalItem: {
          shortName: originalItem.shortName,
          description: originalItem.description,
          dimensions: {
            length: originalItem.estimatedDimensionsInches.length,
            width: originalItem.estimatedDimensionsInches.width,
            height: originalItem.estimatedDimensionsInches.height
          },
          roomName: originalItem.roomName,
          tags: originalItem.tags || []
        },
        editedItem: {
          shortName: '',
          description: '',
          dimensions: { length: null, width: null, height: null },
          roomName: null,
          tags: []
        },
        editType: 'removed'
      });
    }
  });

  // Find added items (in final but not in original)
  finalItems.forEach(finalItem => {
    const wasInOriginal = originalItems.find(
      item => item.shortName === finalItem.shortName &&
      item.description === finalItem.description
    );

    if (!wasInOriginal) {
      edits.push({
        editedItem: {
          shortName: finalItem.shortName,
          description: finalItem.description,
          dimensions: {
            length: finalItem.estimatedDimensionsInches.length,
            width: finalItem.estimatedDimensionsInches.width,
            height: finalItem.estimatedDimensionsInches.height
          },
          roomName: finalItem.roomName,
          tags: finalItem.tags || []
        },
        editType: 'added'
      });
    }
  });

  // Find modified items (in both but with changes)
  originalItems.forEach(originalItem => {
    const finalItem = finalItems.find(
      item => item.shortName === originalItem.shortName &&
      item.description === originalItem.description
    );

    if (finalItem) {
      // Check if dimensions or other properties changed
      const dimensionsChanged = 
        originalItem.estimatedDimensionsInches.length !== finalItem.estimatedDimensionsInches.length ||
        originalItem.estimatedDimensionsInches.width !== finalItem.estimatedDimensionsInches.width ||
        originalItem.estimatedDimensionsInches.height !== finalItem.estimatedDimensionsInches.height;

      const roomChanged = originalItem.roomName !== finalItem.roomName;
      const tagsChanged = JSON.stringify(originalItem.tags) !== JSON.stringify(finalItem.tags);

      if (dimensionsChanged || roomChanged || tagsChanged) {
        edits.push({
          originalItem: {
            shortName: originalItem.shortName,
            description: originalItem.description,
            dimensions: {
              length: originalItem.estimatedDimensionsInches.length,
              width: originalItem.estimatedDimensionsInches.width,
              height: originalItem.estimatedDimensionsInches.height
            },
            roomName: originalItem.roomName,
            tags: originalItem.tags || []
          },
          editedItem: {
            shortName: finalItem.shortName,
            description: finalItem.description,
            dimensions: {
              length: finalItem.estimatedDimensionsInches.length,
              width: finalItem.estimatedDimensionsInches.width,
              height: finalItem.estimatedDimensionsInches.height
            },
            roomName: finalItem.roomName,
            tags: finalItem.tags || []
          },
          editType: 'modified'
        });
      }
    }
  });

  // Send feedback if there are any edits
  if (edits.length > 0) {
    await collectItemEditFeedback(state.sessionId, edits);
    console.log(`🤖 [ML_FEEDBACK] Collected ${edits.length} edits for AI improvement`);
  }
}


// Helper function to reset analysis
async function resetAnalysis() {
  const { resetAnalysis } = await import('./state-actions');
  return resetAnalysis();
}

// Removed unused setActiveTab function
