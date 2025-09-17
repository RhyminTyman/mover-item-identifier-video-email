import { Analysis } from '@/types';

export interface ChunkedAnalysisOptions {
  maxChunkSize: number; // Maximum number of frames per chunk
  maxChunkSizeKB: number; // Maximum size per chunk in KB
}

export interface ChunkedAnalysisResult {
  items: any[];
  confidenceNote: string;
  chunkResults: Analysis[];
}

/**
 * Splits a large array of base64 images into chunks for processing
 */
export function chunkBase64Images(
  base64Images: Array<{ name: string; dataUrl: string; type: 'image' | 'video'; roomName?: string | null }>,
  options: ChunkedAnalysisOptions = {
    maxChunkSize: 8, // Max 8 frames per chunk
    maxChunkSizeKB: 4000 // Max 4MB per chunk
  }
): Array<{ name: string; dataUrl: string; type: 'image' | 'video'; roomName?: string | null }>[] {
  const chunks: Array<{ name: string; dataUrl: string; type: 'image' | 'video'; roomName?: string | null }>[] = [];
  let currentChunk: Array<{ name: string; dataUrl: string; type: 'image' | 'video'; roomName?: string | null }> = [];
  let currentChunkSizeKB = 0;

  for (const image of base64Images) {
    const imageSizeKB = (image.dataUrl.length * 0.75) / 1024; // Base64 is ~33% larger than binary
    
    // Check if adding this image would exceed limits
    if (
      currentChunk.length >= options.maxChunkSize || 
      currentChunkSizeKB + imageSizeKB > options.maxChunkSizeKB
    ) {
      // Start a new chunk
      if (currentChunk.length > 0) {
        chunks.push([...currentChunk]);
        currentChunk = [];
        currentChunkSizeKB = 0;
      }
    }

    currentChunk.push(image);
    currentChunkSizeKB += imageSizeKB;
  }

  // Add the last chunk if it has items
  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
}

/**
 * Merges results from multiple analysis chunks
 */
export function mergeChunkResults(chunkResults: Analysis[]): ChunkedAnalysisResult {
  const allItems: any[] = [];
  const confidenceNotes: string[] = [];

  for (const result of chunkResults) {
    allItems.push(...result.items);
    if (result.confidenceNote) {
      confidenceNotes.push(result.confidenceNote);
    }
  }

  // Remove duplicate items based on shortName and roomName
  const uniqueItems = allItems.reduce((acc: any[], item: any) => {
    const existingItem = acc.find(existing => 
      existing.shortName === item.shortName && 
      existing.roomName === item.roomName
    );

    if (existingItem) {
      // If item exists, combine counts and merge descriptions
      existingItem.count = (existingItem.count || 1) + (item.count || 1);
      existingItem.description = `${existingItem.description} (Additional: ${item.description})`;
    } else {
      acc.push(item);
    }

    return acc;
  }, []);

  return {
    items: uniqueItems,
    confidenceNote: confidenceNotes.length > 0 
      ? `Combined analysis from ${chunkResults.length} chunks: ${confidenceNotes.join('; ')}`
      : 'Analysis completed successfully',
    chunkResults
  };
}

/**
 * Processes a large array of base64 images in chunks
 */
export async function processChunkedAnalysis(
  base64Images: Array<{ name: string; dataUrl: string; type: 'image' | 'video'; roomName?: string | null }>,
  options?: ChunkedAnalysisOptions
): Promise<ChunkedAnalysisResult> {
  const chunks = chunkBase64Images(base64Images, options);
  
  if (chunks.length === 1) {
    // Single chunk, process normally
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        base64Images: chunks[0]
      }),
    });

    if (!response.ok) {
      throw new Error(`Analysis failed: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      items: result.items || [],
      confidenceNote: result.confidenceNote || 'Analysis completed',
      chunkResults: [result]
    };
  }

  // Multiple chunks, process each chunk
  const chunkPromises = chunks.map(async (chunk, index) => {
    const response = await fetch('/api/analyze/chunked', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        base64Images: chunk,
        chunkIndex: index,
        totalChunks: chunks.length
      }),
    });

    if (!response.ok) {
      throw new Error(`Chunk ${index + 1} analysis failed: ${response.statusText}`);
    }

    return response.json();
  });

  const chunkResults = await Promise.all(chunkPromises);
  return mergeChunkResults(chunkResults);
}
