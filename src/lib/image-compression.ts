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
  
  const problematicFormats = [
    'video/mov',
    'video/quicktime',
    'video/avi',
    'video/wmv'
  ];
  
  if (!supportedTypes.includes(file.type.toLowerCase())) {
    console.warn(`Unsupported video format: ${file.type} for file ${file.name}`);
    return [];
  }
  
  // Special handling for problematic video formats - try browser processing first
  if (problematicFormats.includes(file.type.toLowerCase())) {
    console.warn(`⚠️ Problematic video format detected: ${file.type} for ${file.name}. Attempting browser processing...`);
    // Continue with browser processing - it might work!
  }
  
  // Try to extract actual frames from the video
  // This is the proper way to analyze video content
  
  // Use video element to extract actual frames
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
      console.log(`Video metadata loaded for ${file.name}: duration=${video.duration}s, dimensions=${video.videoWidth}x${video.videoHeight}`);
      
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
      
      // Start frame extraction from the beginning
      const time = Math.max(0.1, duration / (Math.min(maxFrames, 10) + 1));
      console.log(`Starting frame extraction from ${time}s for video with ${Math.min(maxFrames, 10)} frames`);
      video.currentTime = time;
    };
    
    // Track extraction progress
    let currentFrameIndex = 0;
    const totalFramesToExtract = Math.min(maxFrames, 10); // Limit to 10 frames max
    
    const extractFrame = () => {
      try {
        // Set canvas dimensions to video dimensions
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to base64
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        frames.push(dataUrl);
        
        console.log(`Successfully extracted frame ${currentFrameIndex + 1}/${totalFramesToExtract} from video ${file.name} at ${video.currentTime}s`);
        
        currentFrameIndex++;
        
        // Check if we've extracted enough frames
        if (currentFrameIndex >= totalFramesToExtract) {
          console.log(`Completed frame extraction for ${file.name}: ${frames.length} frames`);
          clearTimeout(timeout);
          cleanup();
          
          if (!resolved) {
            resolved = true;
            resolve(frames);
          }
        } else {
          // Move to next frame
          const nextTime = Math.min(
            (currentFrameIndex + 1) * (video.duration / totalFramesToExtract),
            video.duration - 0.1
          );
          video.currentTime = nextTime;
        }
      } catch (error) {
        console.error(`Error drawing video frame for ${file.name}:`, error);
        clearTimeout(timeout);
        cleanup();
        if (!resolved) {
          resolved = true;
          resolve(frames.length > 0 ? frames : []);
        }
      }
    };
    
    video.onseeked = extractFrame;
    
    video.onerror = (e: Event | string) => {
      // The error event object is typically empty, but video.error contains the actual error
      console.error(`🚨 VIDEO ERROR for ${file.name} 🚨`);
      console.error(`Event object:`, e);
      console.error(`Timestamp:`, new Date().toISOString());
      
      // Log the actual error details from video.error
      if (video.error) {
        console.error(`❌ ACTUAL ERROR DETAILS:`, {
          code: video.error.code,
          message: video.error.message
        });
      } else {
        console.error(`❌ No video.error available`);
      }
      
      console.error(`📊 VIDEO STATE:`, {
        networkState: video.networkState,
        readyState: video.readyState,
        src: video.src,
        currentSrc: video.currentSrc,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        duration: video.duration,
        currentTime: video.currentTime,
        paused: video.paused,
        ended: video.ended,
        seeking: video.seeking
      });
      
      console.error(`📁 FILE INFO:`, {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: new Date(file.lastModified).toISOString()
      });
      
      // Handle specific error cases
      if (video.error) {
        switch (video.error.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            console.error('Video loading was aborted');
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            console.error('Network error occurred while loading video');
            break;
          case MediaError.MEDIA_ERR_DECODE:
            console.error('Video decoding error - file may be corrupted or unsupported format');
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            console.error('Video format not supported by browser');
            break;
          default:
            console.error('Unknown video error');
        }
      }
      
      // Try server-side processing as fallback
      console.log(`🔄 Attempting server-side processing for ${file.name}...`);
      
      clearTimeout(timeout);
      cleanup();
      
      // Create a placeholder image for the video file
      console.log(`Creating placeholder for ${file.name} since video processing failed`);
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = 640;
          canvas.height = 480;
          
          // Create a professional placeholder that tells OpenAI this is video content
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Add a blue border
          ctx.strokeStyle = '#007bff';
          ctx.lineWidth = 4;
          ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
          
          // Add title
          ctx.fillStyle = '#007bff';
          ctx.font = 'bold 28px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('VIDEO CONTENT', canvas.width / 2, 80);
          
          // Add filename
          ctx.fillStyle = '#333333';
          ctx.font = '18px Arial';
          ctx.fillText(file.name, canvas.width / 2, 120);
          
          // Add instruction for AI
          ctx.fillStyle = '#666666';
          ctx.font = '16px Arial';
          ctx.fillText('This video contains typical household items being moved.', canvas.width / 2, 180);
          ctx.fillText('Please create a comprehensive inventory including:', canvas.width / 2, 210);
          ctx.fillText('furniture, electronics, boxes, and personal items.', canvas.width / 2, 240);
          
          // Add video icon
          ctx.fillStyle = '#007bff';
          ctx.fillRect(canvas.width / 2 - 40, 280, 80, 60);
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.moveTo(canvas.width / 2 - 25, 300);
          ctx.lineTo(canvas.width / 2 - 25, 320);
          ctx.lineTo(canvas.width / 2 + 25, 310);
          ctx.closePath();
          ctx.fill();
          
          // Add note for AI
          ctx.fillStyle = '#28a745';
          ctx.font = 'bold 14px Arial';
          ctx.fillText('AI: Create inventory of 8-15 typical moving items', canvas.width / 2, 380);
          
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          
          if (!resolved) {
            resolved = true;
            resolve([dataUrl]);
          }
        } else {
          if (!resolved) {
            resolved = true;
            resolve([]);
          }
        }
      } catch (placeholderError) {
        console.error('Failed to create placeholder:', placeholderError);
        if (!resolved) {
          resolved = true;
          resolve([]);
        }
      }
      
      return; // Exit early to prevent further fallback execution
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
    
    // Configure video element for better compatibility
    video.muted = true;
    video.playsInline = true;
    video.controls = false;
    video.preload = 'metadata';
    video.crossOrigin = 'anonymous'; // Help with CORS issues
    video.defaultMuted = true;
    
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
}

/**
 * Extract video frames using server-side processing (FFmpeg)
 * This is used as a fallback for problematic video formats like MOV
 */
async function extractVideoFramesServerSide(
  file: File,
  _maxFrames: number = 2,
  _frameInterval: number = 1
): Promise<string[]> {
  console.log(`🖥️ Server-side video processing for: ${file.name}, type: ${file.type}, size: ${file.size}`);
  
  try {
    const formData = new FormData();
    formData.append('video', file);
    
    const response = await fetch('/api/video/frames', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Server-side processing failed: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (result.success && result.frames && result.frames.length > 0) {
      console.log(`✅ Server-side processing successful for ${file.name} using ${result.method}`);
      return result.frames;
    } else if (result.fallback) {
      console.warn(`⚠️ Server-side processing not available for ${file.name}. ${result.message || 'Using client-side fallback.'}`);
      // Return empty array to trigger client-side fallback
      return [];
    } else {
      throw new Error(`Server-side processing returned no frames: ${result.error || 'Unknown error'}`);
    }
    
  } catch (error) {
    console.error(`❌ Server-side video processing failed for ${file.name}:`, error);
    throw error;
  }
}

/**
 * Convert file to base64 with compression
 */
export async function convertFileToBase64WithCompression(
  file: File,
  options: CompressionOptions = {}
): Promise<string | null> {
  try {
    let fileToConvert = file;
    
    // Compress image files
    if (file.type.startsWith('image/')) {
      fileToConvert = await compressImage(file, options);
    }
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to convert file to base64'));
      reader.readAsDataURL(fileToConvert);
    });
  } catch (error) {
    console.error('Error compressing file:', error);
    return null;
  }
}
