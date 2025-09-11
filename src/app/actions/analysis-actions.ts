"use server";

import { updateAppState, setError, updateProgress, setAnalysisResult, startAnalysis, getAppState } from './state-actions';
import { prisma } from '@/lib/db';
import { analyzeImages } from '@/lib/analysis';
import { currentUser } from '@clerk/nextjs/server';
import { ensureUserExists } from '@/lib/user';
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

interface AnalysisItem {
  shortName: string;
  description: string;
  estimatedDimensionsInches: {
    length: number;
    width: number;
    height: number;
  };
  notes: string;
  tags: string[];
  roomName: string;
}

interface AnalysisResult {
  items: AnalysisItem[];
}

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
async function analyzeImage(imageUrl: string, roomName: string): Promise<AnalysisResult> {
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

  // This will be handled by the client-side component
  throw new Error('Please use the Analyze Files button to start analysis');
}

// New analysis action that accepts base64 images from client
export async function analyzeFilesWithImages(base64Images: Array<{ name: string; dataUrl: string }>): Promise<void> {
  const sessionId = generateSessionId();
  const startTime = Date.now();
  
  try {
    await startAnalysis();
    
    const state = await getAppState();
    const files = state.files;
    
    if (base64Images.length === 0) {
      throw new Error('No valid images found for analysis');
    }

    // Count file types
    const imageCount = files.filter(f => f.kind === 'image').length;
    const videoCount = files.filter(f => f.kind === 'video').length;

    await updateProgress(50, 'Sending images to AI for analysis...');

    // Call the analysis function directly
    const analysisResult = await analyzeImages({
      base64Images: base64Images
    });
    
    await updateProgress(90, 'Processing analysis results...');

    // Map the results to include room names
    const itemsWithRooms = analysisResult.items.map((item) => ({
      ...item,
      roomName: files.find(f => f.name === item.shortName?.split(' from ')[1])?.roomName || 'Unknown Room'
    }));

    const analysisDuration = Date.now() - startTime;

    // Create analytics session
    const sessionData: AnalysisSessionData = {
      totalImages: imageCount,
      totalVideos: videoCount,
      totalFiles: files.length,
      analysisDuration,
      aiModel: process.env.OPENAI_VISION_MODEL || 'gpt-4o-mini',
      totalItemsFound: itemsWithRooms.length,
      itemsEdited: 0,
      significantEdits: 0,
      feedbackSent: false,
      errorOccurred: false,
    };

    await createAnalysisSession(sessionId, sessionData);

    // Prepare item analytics data
    const itemAnalyticsData: ItemAnalyticsData[] = itemsWithRooms.map((item) => {
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
        processingTime: Math.floor(analysisDuration / itemsWithRooms.length),
        imageQuality: 'high', // Could be determined by image analysis
        itemComplexity: determineItemComplexity(item),
      };
    });

    // Add item analytics
    await addItemAnalytics(sessionId, itemAnalyticsData);

    // Set the final result
    await setAnalysisResult({
      items: itemsWithRooms,
      confidenceNote: analysisResult.confidenceNote || `Analysis completed for ${base64Images.length} file${base64Images.length !== 1 ? 's' : ''}`
    });

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

// Save inventory to database
export async function saveInventory(): Promise<void> {
  try {
    const state = await getAppState();
    
    if (!state.result) {
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
    await prisma.inventory.create({
      data: {
        title: state.title,
        note: state.note,
        userId: customerId,
        salesUserId: salesUserId,
        items: {
          create: state.result.items.map(item => ({
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
    
    // Redirect to inventories tab
    await setActiveTab('inventories');
    
  } catch (error) {
    console.error('Save error:', error);
    await setError(error instanceof Error ? error.message : 'Save failed');
  } finally {
    await updateAppState({ saving: false });
  }
}


// Helper function to reset analysis
async function resetAnalysis() {
  const { resetAnalysis } = await import('./state-actions');
  return resetAnalysis();
}

// Helper function to set active tab
async function setActiveTab(tab: 'analyze' | 'inventories') {
  const { setActiveTab } = await import('./state-actions');
  return setActiveTab(tab);
}
