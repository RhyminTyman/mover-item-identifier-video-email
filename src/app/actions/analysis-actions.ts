"use server";

import { updateAppState, setError, updateProgress, setAnalysisResult, startAnalysis, getAppState } from './state-actions';
import { prisma } from '@/lib/db';

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

// Main analysis action
export async function analyzeFiles(): Promise<void> {
  try {
    await startAnalysis();
    
    const state = await getAppState();
    const files = state.files;
    
    if (files.length === 0) {
      throw new Error('No files to analyze');
    }

    // Convert files to base64 data URLs for analysis
    const base64Images: Array<{ name: string; dataUrl: string }> = [];
    
    for (const file of files) {
      if (file.preview && file.kind === 'image') {
        // Convert blob URL to base64
        try {
          const response = await fetch(file.preview);
          const blob = await response.blob();
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          
          base64Images.push({
            name: file.name,
            dataUrl: base64
          });
        } catch (error) {
          console.error(`Error converting ${file.name} to base64:`, error);
        }
      }
    }

    if (base64Images.length === 0) {
      throw new Error('No valid images found for analysis');
    }

    await updateProgress(50, 'Sending images to AI for analysis...');

    // Call the analysis API with base64 images
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        base64Images: base64Images
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Analysis failed');
    }

    const analysisResult = await response.json();
    
    await updateProgress(90, 'Processing analysis results...');

    // Map the results to include room names
    const itemsWithRooms = analysisResult.items.map((item: any) => ({
      ...item,
      roomName: files.find(f => f.name === item.shortName?.split(' from ')[1])?.roomName || 'Unknown Room'
    }));

    // Set the final result
    await setAnalysisResult({
      items: itemsWithRooms,
      confidenceNote: analysisResult.confidenceNote || `Analysis completed for ${files.length} file${files.length !== 1 ? 's' : ''}`
    });

    await updateProgress(100, 'Analysis complete!');

  } catch (error) {
    console.error('Analysis error:', error);
    await setError(error instanceof Error ? error.message : 'Analysis failed');
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

    // Create inventory in database
    await prisma.inventory.create({
      data: {
        title: state.title,
        note: state.note,
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
