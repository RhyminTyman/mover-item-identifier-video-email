"use server";

import { updateAppState, setError, updateProgress, setAnalysisResult, startAnalysis, getAppState, AnalysisItem } from './state-actions';
import { prisma } from '@/lib/db';
import { analyzeImages } from '@/lib/analysis';
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
    
    // Convert to AnalysisItem format with confidence and count
    const result = {
      ...analysisResult,
      items: analysisResult.items.map(item => ({
        ...item,
        confidence: 0.8, // Default confidence
        count: item.count || 1 // Default count to 1 if not provided
      }))
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

    if (base64Images.length > 0 && base64Videos.length > 0) {
      // Process both images and videos
      await updateProgress(40, 'Analyzing images and videos with AI...');
      
      // For now, we'll process images and videos together
      // In the future, we could have separate processing for videos
      const allFiles = [...base64Images, ...base64Videos];
      analysisResult = await analyzeImages({
        base64Images: allFiles
      });
    } else if (base64Images.length > 0) {
      // Process only images
      await updateProgress(40, 'Analyzing images with AI...');
      analysisResult = await analyzeImages({
        base64Images: base64Images
      });
    } else {
      // Process only videos
      await updateProgress(40, 'Analyzing videos with AI...');
      analysisResult = await analyzeImages({
        base64Images: base64Videos
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
    const result = {
      ...analysisResult,
      items: analysisResult.items.map(item => ({
        ...item,
        confidence: 0.8, // Default confidence
        count: item.count || 1 // Default count to 1 if not provided
      }))
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
          // Ensure confidence and count are added to items
          analysisResult = {
            ...parsedResult,
            confidenceNote: parsedResult.confidenceNote || '',
            items: parsedResult.items.map((item) => ({
              shortName: item.shortName || '',
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


// Helper function to reset analysis
async function resetAnalysis() {
  const { resetAnalysis } = await import('./state-actions');
  return resetAnalysis();
}

// Removed unused setActiveTab function
