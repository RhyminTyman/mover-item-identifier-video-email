/**
 * Image compression utility to reduce file sizes before sending to server
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeKB?: number;
}

const DEFAULT_OPTIONS: Required<CompressionOptions> = {
  maxWidth: 1280,
  maxHeight: 720,
  quality: 0.6,
  maxSizeKB: 200
};

/**
 * Compress an image file to reduce its size
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img;
      
      if (width > opts.maxWidth || height > opts.maxHeight) {
        const ratio = Math.min(opts.maxWidth / width, opts.maxHeight / height);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
      }
      
      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'));
            return;
          }
          
          // Check if we need further compression
          const sizeKB = blob.size / 1024;
          if (sizeKB > opts.maxSizeKB) {
            // Recursively compress with lower quality
            const newQuality = Math.max(0.1, opts.quality * 0.8);
            compressImage(file, { ...opts, quality: newQuality })
              .then(resolve)
              .catch(reject);
            return;
          }
          
          // Create new file with compressed data
          const compressedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: file.lastModified
          });
          
          resolve(compressedFile);
        },
        file.type,
        opts.quality
      );
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Compress multiple images
 */
export async function compressImages(
  files: File[],
  options: CompressionOptions = {}
): Promise<File[]> {
  const compressionPromises = files.map(file => {
    // Only compress image files
    if (file.type.startsWith('image/')) {
      return compressImage(file, options);
    }
    // Return video files as-is
    return Promise.resolve(file);
  });
  
  return Promise.all(compressionPromises);
}

/**
 * Extract a single frame from video file (simplified version)
 */
export async function extractVideoFrames(
  file: File,
  maxFrames: number = 2,
  frameInterval: number = 1
): Promise<string[]> {
  console.log(`extractVideoFrames called for: ${file.name}, type: ${file.type}, size: ${file.size}`);
  
  // Log browser information for debugging
  console.log(`🌐 Browser info:`, {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    cookieEnabled: navigator.cookieEnabled,
    onLine: navigator.onLine
  });
  
  // Check if file type is supported
  const supportedTypes = [
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/avi',
    'video/mov',
    'video/quicktime'
  ];
  
  console.log(`🔍 Video file type check: ${file.type} for ${file.name}`);
  console.log(`🔍 Supported types:`, supportedTypes);
  
  if (!supportedTypes.includes(file.type.toLowerCase())) {
    console.warn(`Unsupported video format: ${file.type} for file ${file.name}`);
    throw new Error(`Unsupported video format: ${file.type}. Supported formats: ${supportedTypes.join(', ')}`);
  }
  
  console.log(`✅ Video format ${file.type} is supported`);
  
  // Use the new video frame extraction service
  console.log(`📹 Video file ${file.name} detected - using video frame extraction service`);
  console.log('🔄 Extracting frames with video frame service...');
  
  try {
    // Import the video frame service
    const { videoFrameService } = await import('./videoFrameService');
    
    // Process video and extract frames using the video frame service
    const result = await videoFrameService.extractFrames(file, {
      intervalSeconds: frameInterval,
      format: 'jpg',
      quality: 80
    });
    
    if (result.frames && result.frames.length > 0) {
      // Limit frames to maxFrames if specified
      const frames = maxFrames > 0 ? result.frames.slice(0, maxFrames) : result.frames;
      console.log(`✅ Successfully processed and extracted ${frames.length} frames from ${file.name}`);
      return frames;
    } else {
      console.error(`❌ Video frame service completed but no frames extracted from ${file.name}`);
      throw new Error(`No frames were extracted from video ${file.name}. This may be due to video format issues or processing errors.`);
    }
  } catch (error) {
    console.error(`❌ Video frame extraction failed for ${file.name}:`, error);
    
    // Re-throw the error instead of returning empty array
    throw new Error(`Video processing failed for ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  // Use video element to extract actual frames (commented out due to MOV compatibility issues)
  /*
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      console.error('Could not get canvas context');
      reject(new Error('Could not get canvas context'));
      return;
    }
    
    const frames: string[] = [];
    let resolved = false;
    
    // Set a timeout to prevent hanging
    const timeout = setTimeout(() => {
      if (!resolved) {
        console.log(`Video frame extraction timed out for ${file.name}, returning ${frames.length} frames`);
        resolved = true;
        resolve(frames.length > 0 ? frames : []);
      }
    }, 10000); // 10 second timeout
    
    const cleanup = () => {
      if (video.src) {
        URL.revokeObjectURL(video.src);
      }
    };
    
    
    video.onloadedmetadata = () => {
      console.log(`Video metadata loaded for ${file.name}: duration=${video.duration}s`);
      
      const duration = video.duration;
      if (isNaN(duration) || duration <= 0) {
        console.error(`Invalid video duration: ${duration}`);
        clearTimeout(timeout);
        cleanup();
        if (!resolved) {
          resolved = true;
          resolve([]);
        }
        return;
      }
      
      // Extract multiple frames using video element's seeked event without playback
      let currentFrameIndex = 0;
      const frameTimes = [0, 2, 4, 6, 8, 10];
      
      video.onseeked = () => {
        try {
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            // Extract frame immediately after seek completes
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/png');
            frames.push(dataUrl);
            
            currentFrameIndex++;
            console.log(`✅ Extracted frame ${currentFrameIndex}/${frameTimes.length} from video ${file.name} at ${video.currentTime.toFixed(1)}s`);
            
            if (currentFrameIndex < frameTimes.length) {
              // Seek to next frame time
              video.currentTime = frameTimes[currentFrameIndex];
            } else {
              // All frames extracted
              console.log(`✅ Finished extracting ${frames.length} frames from video ${file.name}`);
              clearTimeout(timeout);
              cleanup();
              if (!resolved) {
                resolved = true;
                resolve(frames);
              }
            }
          } else {
            console.error(`Invalid video dimensions: ${video.videoWidth}x${video.videoHeight}`);
            clearTimeout(timeout);
            cleanup();
            if (!resolved) {
              resolved = true;
              resolve([]);
            }
          }
        } catch (error) {
          console.error(`Error extracting frame from ${file.name}:`, error);
          clearTimeout(timeout);
          cleanup();
          if (!resolved) {
            resolved = true;
            resolve(frames.length > 0 ? frames : []);
          }
        }
      };
      
      // Start with first frame
      video.currentTime = frameTimes[0];
    };
    
    video.onerror = (e: Event | string) => {
      console.error(`Video error for ${file.name}:`, video.error);
      clearTimeout(timeout);
      cleanup();
      if (!resolved) {
        resolved = true;
        resolve([]);
      }
    };
    
    video.oncanplay = () => {
      console.log(`Video can play for ${file.name}`);
    };
    
    video.onloadstart = () => {
      console.log(`Video load started for ${file.name}`);
    };
    
    video.onprogress = () => {
      console.log(`Video loading progress for ${file.name}: ${video.buffered.length > 0 ? video.buffered.end(0) : 0}s`);
    };
    
    video.onload = () => {
      console.log(`Video load completed for ${file.name}`);
    };
    
    video.onabort = () => {
      console.warn(`Video loading aborted for ${file.name}`);
    };
    
    video.onstalled = () => {
      console.warn(`Video loading stalled for ${file.name}`);
    };
    
    video.onsuspend = () => {
      console.warn(`Video loading suspended for ${file.name}`);
    };
    
    // Configure video element
    video.muted = true;
    video.playsInline = true;
    video.controls = false;
    video.preload = 'metadata';
    
    // Load video
    try {
      const objectURL = URL.createObjectURL(file);
      video.src = objectURL;
      
      console.log(`Loading video ${file.name} from object URL: ${objectURL}`);
      console.log(`Video file details:`, {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: new Date(file.lastModified).toISOString(),
        objectURL: objectURL
      });
      
      video.load();
    } catch (loadError) {
      console.error(`Failed to load video ${file.name}:`, loadError);
      clearTimeout(timeout);
      cleanup();
      if (!resolved) {
        resolved = true;
        resolve([]);
      }
    }
  });
  */
}

/**
 * Convert MOV to MP4 on server and extract frames
 */
// Removed unused extractFramesEnhancedClientSide function

// Removed convertMovToMp4AndExtractFrames - now using client-side FFmpeg.wasm

/**
 * Convert video to web-compatible format using MediaRecorder
 */
// Removed unused convertVideoToWebFormat function

/**
 * Extract frames from converted video
 */
// Removed unused extractFramesFromConvertedVideo function

/**
 * Most basic video frame extraction approach
 */
// Removed unused extractFramesBasicApproach function

/**
 * Extract frames using WebCodecs API (modern browsers)
 */
// Removed unused extractFramesWithWebCodecs function

/**
 * Extract frames using traditional video element with optimized settings
 */
// Removed unused extractFramesWithTraditionalMethod function

/**
 * Extract frames from video blob using alternative method
 */
// Removed unused extractFramesFromVideoBlob function

/**
 * Extract frames using timeout-based approach
 */
// Removed unused extractFramesWithTimeouts function

/**
 * Extract video frames using server-side processing (FFmpeg)
 * This is used as a fallback for problematic video formats like MOV
 */
// Removed unused extractVideoFramesServerSide function

/**
 * Convert file to base64 with compression
 */
// Removed unused convertFileToBase64WithCompression function
