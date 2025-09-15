"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

// Types for state management
export type LocalFile = { 
  id: string; 
  name: string; 
  size: number; 
  type: string; 
  preview: string; 
  roomName: string | null; 
  kind: "image" | "video";
  tags: string[];
};

export type AnalysisItem = {
  shortName: string;
  description: string;
  estimatedDimensionsInches: {
    length: number | null;
    width: number | null;
    height: number | null;
  };
  notes: string;
  tags: string[];
  roomName?: string | null;
  confidence: number;
};

export type Analysis = {
  items: AnalysisItem[];
  confidenceNote: string;
};

export type AppState = {
  files: LocalFile[];
  result: Analysis | null;
  phase: string;
  progress: number;
  saving: boolean;
  error: string | null;
  title: string;
  note: string;
  s3UploadFailed: boolean;
  activeTab: 'analyze' | 'inventories';
  theme: 'light' | 'dark';
  customerId: string | null;
  workflowPhase: 'upload' | 'analysis' | 'edit' | 'pricing' | 'review' | 'complete';
  editedItems: AnalysisItem[] | null;
  pricingData: any | null;
};

// Server-side state storage using cookies
const STATE_COOKIE = 'app-state';

// Store analysis result in database temporarily
async function storeAnalysisResultInDB(sessionId: string, result: Analysis): Promise<void> {
  try {
    await prisma.analysisSession.upsert({
      where: { sessionId },
      update: { 
        analysisResult: JSON.stringify(result),
        updatedAt: new Date()
      },
      create: {
        sessionId,
        analysisResult: JSON.stringify(result),
        totalImages: 0,
        totalVideos: 0,
        totalFiles: 0,
        totalItemsFound: result.items.length,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    console.log('🔍 [STATE] Stored analysis result in database for session:', sessionId);
  } catch (error) {
    console.error('❌ [STATE] Failed to store analysis result in database:', error);
  }
}

// Removed unused getAnalysisResultFromDB function

export async function getAppState(): Promise<AppState> {
  const cookieStore = await cookies();
  const stateCookie = cookieStore.get(STATE_COOKIE);
  
  if (!stateCookie) {
    console.log('🔍 [STATE] No state cookie found, returning default state');
    return {
      files: [],
      result: null,
      phase: "idle",
      progress: 0,
      saving: false,
      error: null,
      title: "My Move",
      note: "",
      s3UploadFailed: false,
      activeTab: 'analyze',
      theme: 'light',
      customerId: null,
      workflowPhase: 'upload',
      editedItems: null,
      pricingData: null
    };
  }

  try {
    const state = JSON.parse(stateCookie.value);
    console.log('🔍 [STATE] Retrieved state:', {
      hasResult: !!state.result,
      resultItems: state.result?.items?.length || 0,
      phase: state.phase,
      progress: state.progress
    });
    return state;
  } catch (error) {
    console.error('❌ [STATE] Failed to parse state cookie:', error);
    return {
      files: [],
      result: null,
      phase: "idle",
      progress: 0,
      saving: false,
      error: null,
      title: "My Move",
      note: "",
      s3UploadFailed: false,
      activeTab: 'analyze',
      theme: 'light',
      customerId: null,
      workflowPhase: 'upload',
      editedItems: null,
      pricingData: null
    };
  }
}

export async function updateAppState(updates: Partial<AppState>): Promise<void> {
  const currentState = await getAppState();
  const newState = { ...currentState, ...updates };
  
  // Debug logging for state updates
  if (updates.result) {
    console.log('🔍 [STATE] Updating state with result:', {
      itemsCount: updates.result.items.length,
      wasNull: currentState.result === null
    });
  }
  
  const cookieStore = await cookies();
  const stateJson = JSON.stringify(newState);
  const stateSize = stateJson.length;
  
  console.log('🔍 [STATE] Cookie size:', stateSize, 'bytes');
  
  // Check if state is too large for cookie (4KB limit)
  if (stateSize > 4000) {
    console.warn('⚠️ [STATE] State size exceeds recommended cookie size:', stateSize, 'bytes');
  }
  
  cookieStore.set(STATE_COOKIE, stateJson, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 // 24 hours
  });
  
  revalidatePath('/');
}

// File management actions
export async function addFiles(newFiles: Omit<LocalFile, 'id'>[]): Promise<void> {
  const currentState = await getAppState();
  const filesWithIds = newFiles.map(file => ({
    ...file,
    id: crypto.randomUUID(),
    tags: file.tags || []
  }));
  
  await updateAppState({
    files: [...currentState.files, ...filesWithIds]
  });
}

export async function removeFile(fileId: string): Promise<void> {
  const currentState = await getAppState();
  const updatedFiles = currentState.files.filter(file => file.id !== fileId);
  
  await updateAppState({
    files: updatedFiles
  });
}

export async function updateFileRoom(fileId: string, roomName: string | null): Promise<void> {
  const currentState = await getAppState();
  const updatedFiles = currentState.files.map(file => 
    file.id === fileId ? { ...file, roomName } : file
  );
  
  await updateAppState({
    files: updatedFiles
  });
}

export async function updateFileTags(fileId: string, tags: string[]): Promise<void> {
  const currentState = await getAppState();
  const updatedFiles = currentState.files.map(file => 
    file.id === fileId ? { ...file, tags } : file
  );
  
  await updateAppState({
    files: updatedFiles
  });
}

// Analysis actions
export async function startAnalysis(): Promise<void> {
  await updateAppState({
    phase: "uploading",
    progress: 0,
    error: null
  });
}

export async function updateProgress(progress: number, phase: string): Promise<void> {
  await updateAppState({
    progress,
    phase
  });
}

export async function setAnalysisResult(result: Analysis, sessionId?: string): Promise<void> {
  console.log('🔍 [STATE] Setting analysis result:', {
    itemsCount: result.items.length,
    confidenceNote: result.confidenceNote,
    sessionId
  });
  
  // Store in database if sessionId is provided
  if (sessionId) {
    await storeAnalysisResultInDB(sessionId, result);
  }
  
  await updateAppState({
    result,
    phase: "complete",
    progress: 100
  });
  
  // Verify the result was set
  const updatedState = await getAppState();
  console.log('🔍 [STATE] Verification - result set:', {
    hasResult: !!updatedState.result,
    itemsCount: updatedState.result?.items?.length || 0
  });
}

export async function setError(error: string): Promise<void> {
  await updateAppState({
    error,
    phase: "error"
  });
}

export async function clearError(): Promise<void> {
  await updateAppState({
    error: null
  });
}

// Form actions
export async function updateTitle(title: string): Promise<void> {
  await updateAppState({ title });
}

export async function updateNote(note: string): Promise<void> {
  await updateAppState({ note });
}

// Tab management
export async function setActiveTab(tab: 'analyze' | 'inventories'): Promise<void> {
  await updateAppState({ activeTab: tab });
}

// Theme management
export async function setTheme(theme: 'light' | 'dark'): Promise<void> {
  await updateAppState({ theme });
}

export async function toggleTheme(): Promise<void> {
  const currentState = await getAppState();
  const newTheme = currentState.theme === 'light' ? 'dark' : 'light';
  await updateAppState({ theme: newTheme });
}

// Customer management
export async function setCustomerId(customerId: string | null): Promise<void> {
  await updateAppState({ customerId });
}

// Workflow management
export async function setWorkflowPhase(phase: 'upload' | 'analysis' | 'edit' | 'pricing' | 'review' | 'complete'): Promise<void> {
  await updateAppState({ workflowPhase: phase });
}

export async function setEditedItems(items: AnalysisItem[]): Promise<void> {
  await updateAppState({ editedItems: items });
}

export async function setPricingData(data: any): Promise<void> {
  await updateAppState({ pricingData: data });
}

export async function getCurrentItems(): Promise<AnalysisItem[]> {
  const state = await getAppState();
  return state.editedItems || state.result?.items || [];
}

// Reset actions
export async function resetAnalysis(): Promise<void> {
  console.log('🔍 [STATE] Resetting analysis state');
  await updateAppState({
    files: [],
    result: null,
    phase: "idle",
    progress: 0,
    error: null,
    s3UploadFailed: false,
    customerId: null,
    workflowPhase: 'upload',
    editedItems: null,
    pricingData: null
  });
}

export async function resetApp(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(STATE_COOKIE);
  revalidatePath('/');
}
