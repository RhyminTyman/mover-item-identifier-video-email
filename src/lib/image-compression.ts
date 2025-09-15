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
  
  // Try to convert MOV to web-compatible format first, then extract frames
  console.log(`Video file ${file.name} detected - attempting format conversion and frame extraction`);
  
  try {
    // Try to convert the video to a web-compatible format first
    const convertedVideo = await convertVideoToWebFormat(file);
    if (convertedVideo) {
      console.log('✅ Video converted to web format, attempting frame extraction');
      const frames = await extractFramesFromConvertedVideo(convertedVideo, maxFrames);
      if (frames.length > 0) {
        console.log(`✅ Extracted ${frames.length} frames from converted video`);
        return frames;
      }
    }
  } catch (error) {
    console.warn('Video conversion failed:', error);
  }
  
  // If conversion fails, try the most basic approach possible
  console.log('Trying most basic video frame extraction approach');
  return extractFramesBasicApproach(file, maxFrames);
  
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
 * Convert video to web-compatible format using MediaRecorder
 */
async function convertVideoToWebFormat(file: File): Promise<Blob | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      resolve(null);
      return;
    }
    
    video.onloadedmetadata = () => {
      console.log('Converting video to web format...');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Create a MediaRecorder to convert the video
      const stream = canvas.captureStream(30); // 30 FPS
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      });
      
      const chunks: BlobPart[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const convertedBlob = new Blob(chunks, { type: 'video/webm' });
        console.log('✅ Video converted to WebM format');
        resolve(convertedBlob);
      };
      
      // Start recording
      mediaRecorder.start();
      
      // Play video and record frames
      video.play().then(() => {
        const duration = video.duration;
        const interval = duration / 10; // 10 frames
        
        let currentTime = 0;
        const recordFrame = () => {
          if (currentTime < duration) {
            video.currentTime = currentTime;
            setTimeout(() => {
              ctx.drawImage(video, 0, 0);
              currentTime += interval;
              recordFrame();
            }, 100);
          } else {
            mediaRecorder.stop();
          }
        };
        
        recordFrame();
      }).catch(() => {
        resolve(null);
      });
    };
    
    video.onerror = () => {
      resolve(null);
    };
    
    video.src = URL.createObjectURL(file);
    video.muted = true;
  });
}

/**
 * Extract frames from converted video
 */
async function extractFramesFromConvertedVideo(convertedBlob: Blob, maxFrames: number): Promise<string[]> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      resolve([]);
      return;
    }
    
    const frames: string[] = [];
    
    video.onloadedmetadata = () => {
      const duration = video.duration;
      const frameCount = Math.min(maxFrames, 6);
      const interval = duration / frameCount;
      
      let currentFrame = 0;
      
      const extractFrame = () => {
        if (currentFrame >= frameCount) {
          resolve(frames);
          return;
        }
        
        const targetTime = currentFrame * interval;
        video.currentTime = targetTime;
        
        setTimeout(() => {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0);
          const dataUrl = canvas.toDataURL('image/png', 0.9);
          frames.push(dataUrl);
          currentFrame++;
          extractFrame();
        }, 500);
      };
      
      extractFrame();
    };
    
    video.onerror = () => {
      resolve([]);
    };
    
    video.src = URL.createObjectURL(convertedBlob);
    video.muted = true;
  });
}

/**
 * Most basic video frame extraction approach
 */
async function extractFramesBasicApproach(file: File, maxFrames: number): Promise<string[]> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      resolve([]);
      return;
    }
    
    const frames: string[] = [];
    let resolved = false;
    
    const timeout = setTimeout(() => {
      if (!resolved) {
        console.log(`Basic approach timed out, returning ${frames.length} frames`);
        resolved = true;
        resolve(frames.length > 0 ? frames : []);
      }
    }, 30000);
    
    const cleanup = () => {
      if (video.src) {
        URL.revokeObjectURL(video.src);
      }
    };
    
    // Try the most basic event possible
    video.oncanplay = () => {
      console.log('Basic approach - video can play');
      
      try {
        // Just try to get one frame at the beginning
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/png', 0.8);
          frames.push(dataUrl);
          
          console.log('✅ Basic approach - extracted 1 frame');
        }
      } catch (error) {
        console.error('Basic approach error:', error);
      }
      
      clearTimeout(timeout);
      cleanup();
      if (!resolved) {
        resolved = true;
        resolve(frames);
      }
    };
    
    video.onerror = () => {
      console.error('Basic approach video error');
      clearTimeout(timeout);
      cleanup();
      if (!resolved) {
        resolved = true;
        resolve([]);
      }
    };
    
    // Most basic settings
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';
    
    video.src = URL.createObjectURL(file);
  });
}

/**
 * Extract frames using WebCodecs API (modern browsers)
 */
async function extractFramesWithWebCodecs(file: File, maxFrames: number): Promise<string[]> {
  return new Promise((resolve) => {
    const frames: string[] = [];
    
    // Create video element for WebCodecs
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      console.error('Could not get canvas context for WebCodecs');
      resolve([]);
      return;
    }
    
    video.onloadedmetadata = () => {
      console.log(`WebCodecs video loaded: ${video.duration}s`);
      
      const duration = video.duration;
      if (isNaN(duration) || duration <= 0) {
        resolve([]);
        return;
      }
      
      // Extract frames using WebCodecs
      const frameCount = Math.min(maxFrames, 8);
      const interval = duration / frameCount;
      
      let currentFrame = 0;
      
      const extractFrame = () => {
        if (currentFrame >= frameCount) {
          console.log(`WebCodecs extracted ${frames.length} frames`);
          resolve(frames);
          return;
        }
        
        const targetTime = currentFrame * interval;
        video.currentTime = targetTime;
        
        // Wait for seek and extract frame
        setTimeout(() => {
          try {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0);
            const dataUrl = canvas.toDataURL('image/png', 0.9);
            frames.push(dataUrl);
            currentFrame++;
            setTimeout(extractFrame, 200);
          } catch (error) {
            console.error('WebCodecs frame extraction error:', error);
            resolve(frames);
          }
        }, 300);
      };
      
      extractFrame();
    };
    
    video.onerror = () => {
      console.error('WebCodecs video error');
      resolve([]);
    };
    
    video.muted = true;
    video.crossOrigin = 'anonymous';
    video.src = URL.createObjectURL(file);
  });
}

/**
 * Extract frames using traditional video element with optimized settings
 */
async function extractFramesWithTraditionalMethod(file: File, maxFrames: number): Promise<string[]> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      console.error('Could not get canvas context');
      resolve([]);
      return;
    }
    
    const frames: string[] = [];
    let resolved = false;
    
    const timeout = setTimeout(() => {
      if (!resolved) {
        console.log(`Traditional method timed out, returning ${frames.length} frames`);
        resolved = true;
        resolve(frames.length > 0 ? frames : []);
      }
    }, 20000);
    
    const cleanup = () => {
      if (video.src) {
        URL.revokeObjectURL(video.src);
      }
    };
    
    video.oncanplaythrough = () => {
      console.log(`Traditional method - video can play through: ${video.duration}s`);
      
      const duration = video.duration;
      if (isNaN(duration) || duration <= 0) {
        clearTimeout(timeout);
        cleanup();
        if (!resolved) {
          resolved = true;
          resolve([]);
        }
        return;
      }
      
      // Try to extract frames with very conservative approach
      const frameCount = Math.min(maxFrames, 4); // Reduce to 4 frames max
      const interval = duration / frameCount;
      
      let currentFrame = 0;
      
      const extractFrame = () => {
        if (currentFrame >= frameCount) {
          console.log(`Traditional method extracted ${frames.length} frames`);
          clearTimeout(timeout);
          cleanup();
          if (!resolved) {
            resolved = true;
            resolve(frames);
          }
          return;
        }
        
        const targetTime = currentFrame * interval;
        console.log(`Traditional method - extracting frame ${currentFrame + 1} at ${targetTime.toFixed(1)}s`);
        
        // Set time and wait longer
        video.currentTime = targetTime;
        
        setTimeout(() => {
          try {
            if (video.videoWidth > 0 && video.videoHeight > 0) {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              const dataUrl = canvas.toDataURL('image/png', 0.8);
              frames.push(dataUrl);
              
              console.log(`✅ Traditional method - extracted frame ${currentFrame + 1}`);
              currentFrame++;
              
              // Wait longer between frames
              setTimeout(extractFrame, 2000);
            } else {
              console.error('Invalid video dimensions in traditional method');
              clearTimeout(timeout);
              cleanup();
              if (!resolved) {
                resolved = true;
                resolve(frames);
              }
            }
          } catch (error) {
            console.error('Traditional method frame extraction error:', error);
            clearTimeout(timeout);
            cleanup();
            if (!resolved) {
              resolved = true;
              resolve(frames);
            }
          }
        }, 3000); // Wait 3 seconds for video to settle
      };
      
      extractFrame();
    };
    
    video.onerror = () => {
      console.error('Traditional method video error');
      clearTimeout(timeout);
      cleanup();
      if (!resolved) {
        resolved = true;
        resolve([]);
      }
    };
    
    // Optimize video element settings
    video.muted = true;
    video.playsInline = true;
    video.controls = false;
    video.preload = 'auto';
    video.crossOrigin = 'anonymous';
    
    // Load video
    video.src = URL.createObjectURL(file);
  });
}

/**
 * Extract frames from video blob using alternative method
 */
async function extractFramesFromVideoBlob(videoUrl: string, maxFrames: number): Promise<string[]> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      console.error('Could not get canvas context');
      resolve([]);
      return;
    }
    
    const frames: string[] = [];
    let resolved = false;
    
    // Set a timeout
    const timeout = setTimeout(() => {
      if (!resolved) {
        console.log(`Video frame extraction timed out, returning ${frames.length} frames`);
        resolved = true;
        resolve(frames.length > 0 ? frames : []);
      }
    }, 15000);
    
    const cleanup = () => {
      URL.revokeObjectURL(videoUrl);
    };
    
    video.onloadedmetadata = () => {
      console.log(`Video metadata loaded: duration=${video.duration}s, dimensions=${video.videoWidth}x${video.videoHeight}`);
      
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
      
      // Try to extract frames using a different approach
      extractFramesWithTimeouts(video, canvas, ctx, duration, maxFrames, frames, () => {
        clearTimeout(timeout);
        cleanup();
        if (!resolved) {
          resolved = true;
          resolve(frames);
        }
      });
    };
    
    video.onerror = (e) => {
      console.error(`Video error:`, video.error);
      clearTimeout(timeout);
      cleanup();
      if (!resolved) {
        resolved = true;
        resolve([]);
      }
    };
    
    // Configure video element
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';
    video.preload = 'metadata';
    
    // Load video
    video.src = videoUrl;
    video.load();
  });
}

/**
 * Extract frames using timeout-based approach
 */
async function extractFramesWithTimeouts(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  duration: number,
  maxFrames: number,
  frames: string[],
  onComplete: () => void
) {
  const frameCount = Math.min(maxFrames, 6);
  const interval = duration / frameCount;
  
  let currentFrame = 0;
  
  const extractNextFrame = () => {
    if (currentFrame >= frameCount) {
      console.log(`✅ Finished extracting ${frames.length} frames`);
      onComplete();
      return;
    }
    
    const targetTime = currentFrame * interval;
    console.log(`Extracting frame ${currentFrame + 1}/${frameCount} at ${targetTime.toFixed(1)}s`);
    
    // Set video time
    video.currentTime = targetTime;
    
    // Wait for seek to complete, then extract frame
    setTimeout(() => {
      try {
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          // Draw current frame
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/png', 0.9);
          frames.push(dataUrl);
          
          console.log(`✅ Extracted frame ${currentFrame + 1} at ${video.currentTime.toFixed(1)}s`);
          currentFrame++;
          
          // Extract next frame after a delay
          setTimeout(extractNextFrame, 500);
        } else {
          console.error(`Invalid video dimensions: ${video.videoWidth}x${video.videoHeight}`);
          onComplete();
        }
      } catch (error) {
        console.error(`Error extracting frame ${currentFrame + 1}:`, error);
        onComplete();
      }
    }, 1000); // Wait 1 second for video to settle
  };
  
  // Start extraction
  extractNextFrame();
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
