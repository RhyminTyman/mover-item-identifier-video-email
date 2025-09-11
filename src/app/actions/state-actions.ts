"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

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

export type Analysis = {
  items: Array<{
    shortName: string;
    description: string;
    estimatedDimensionsInches: {
      length: number | null;
      width: number | null;
      height: number | null;
    };
    notes: string;
    tags: string[];
    roomName: string | null;
  }>;
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
};

// Server-side state storage using cookies
const STATE_COOKIE = 'app-state';

export async function getAppState(): Promise<AppState> {
  const cookieStore = await cookies();
  const stateCookie = cookieStore.get(STATE_COOKIE);
  
  if (!stateCookie) {
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
      customerId: null
    };
  }

  try {
    return JSON.parse(stateCookie.value);
  } catch {
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
      customerId: null
    };
  }
}

export async function updateAppState(updates: Partial<AppState>): Promise<void> {
  const currentState = await getAppState();
  const newState = { ...currentState, ...updates };
  
  const cookieStore = await cookies();
  cookieStore.set(STATE_COOKIE, JSON.stringify(newState), {
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

export async function setAnalysisResult(result: Analysis): Promise<void> {
  await updateAppState({
    result,
    phase: "complete",
    progress: 100
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

// Reset actions
export async function resetAnalysis(): Promise<void> {
  await updateAppState({
    files: [],
    result: null,
    phase: "idle",
    progress: 0,
    error: null,
    s3UploadFailed: false,
    customerId: null
  });
}

export async function resetApp(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(STATE_COOKIE);
  revalidatePath('/');
}
