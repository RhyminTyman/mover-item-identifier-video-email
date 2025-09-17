import { NextRequest, NextResponse } from 'next/server';

const VIDEO_FRAME_API_URL = process.env.VIDEO_FRAME_API_URL || 'http://localhost:3001';

// Helper function to compress and convert Blob to base64 data URL
async function convertBlobToBase64(blob: Blob, maxSizeKB: number = 100): Promise<string> {
  try {
    // First, try to compress the image if it's too large
    let processedBlob = blob;
    const originalSizeKB = blob.size / 1024;
    
    if (originalSizeKB > maxSizeKB) {
      console.log(`📦 Compressing image from ${originalSizeKB.toFixed(1)}KB to target ${maxSizeKB}KB`);
      
      // Create a canvas to compress the image
      const canvas = new OffscreenCanvas(0, 0);
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      // Convert blob to image for compression
      const imageUrl = URL.createObjectURL(blob);
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });
      
      // Calculate compressed dimensions (maintain aspect ratio)
      const maxDimension = 800; // Max width or height
      let { width, height } = img;
      
      if (width > maxDimension || height > maxDimension) {
        const ratio = Math.min(maxDimension / width, maxDimension / height);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      
      // Convert to blob with compression
      const compressedBlob = await canvas.convertToBlob({
        type: 'image/jpeg',
        quality: 0.7 // 70% quality
      });
      
      processedBlob = compressedBlob;
      URL.revokeObjectURL(imageUrl);
      
      console.log(`✅ Compressed image to ${(compressedBlob.size / 1024).toFixed(1)}KB`);
    }
    
    const buffer = await processedBlob.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const mimeType = processedBlob.type || 'image/jpeg';
    const dataUrl = `data:${mimeType};base64,${base64}`;
    
    // Validate the base64 string
    if (!base64 || base64.length === 0) {
      throw new Error('Empty base64 string generated');
    }
    
    // Check if it looks like a valid data URL
    if (!dataUrl.startsWith('data:image/')) {
      throw new Error(`Invalid data URL format: ${dataUrl.substring(0, 50)}...`);
    }
    
    const finalSizeKB = (base64.length * 0.75) / 1024; // Base64 is ~33% larger than binary
    console.log(`✅ Generated compressed base64 data URL: ${mimeType}, ${finalSizeKB.toFixed(1)}KB`);
    return dataUrl;
  } catch (error) {
    console.error('❌ Error converting blob to base64:', error);
    throw new Error(`Failed to convert blob to base64: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Test endpoint to check a specific S3 URL
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const testUrl = searchParams.get('url');
  
  if (!testUrl) {
    return NextResponse.json({ error: 'Please provide a URL parameter' }, { status: 400 });
  }
  
  try {
    console.log(`🔍 Testing S3 URL: ${testUrl}`);
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; VideoFrameExtractor/1.0)',
        'Accept': 'image/*',
      }
    });
    
    const headers = Object.fromEntries(response.headers.entries());
    const blob = await response.blob();
    
    console.log(`📊 S3 test response:`, {
      status: response.status,
      statusText: response.statusText,
      headers,
      blobSize: blob.size,
      blobType: blob.type
    });
    
    return NextResponse.json({
      url: testUrl,
      status: response.status,
      statusText: response.statusText,
      headers,
      blobSize: blob.size,
      blobType: blob.type,
      isImage: blob.type.startsWith('image/'),
      isEmpty: blob.size === 0
    });
    
  } catch (error) {
    console.error('❌ S3 URL test failed:', error);
    return NextResponse.json({ 
      error: 'Failed to test S3 URL', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🎬 Video extract-frames API called');
    const formData = await request.formData();
    const videoFile = formData.get('video') as File;
    const intervalSeconds = formData.get('intervalSeconds') as string;
    const format = formData.get('format') as string;
    const quality = formData.get('quality') as string;

    console.log('📹 Video file details:', {
      name: videoFile?.name,
      size: videoFile?.size,
      type: videoFile?.type,
      intervalSeconds,
      format,
      quality
    });

    if (!videoFile) {
      console.error('❌ No video file provided');
      return NextResponse.json({ error: 'No video file provided' }, { status: 400 });
    }

    // Create FormData for the video frame service
    const serviceFormData = new FormData();
    serviceFormData.append('video', videoFile);

    // Build query parameters
    const params = new URLSearchParams();
    if (intervalSeconds) params.append('intervalSeconds', intervalSeconds);
    if (format) params.append('format', format);
    if (quality) params.append('quality', quality);
    
    console.log('📋 Query parameters being sent:', {
      intervalSeconds: intervalSeconds || 'default',
      format: format || 'default', 
      quality: quality || 'default'
    });

    const serviceUrl = `${VIDEO_FRAME_API_URL}/api/frames${params.toString() ? '?' + params.toString() : ''}`;

    console.log('🔄 Proxying request to video frame service:', serviceUrl);
    console.log('📤 FormData contents:', {
      videoFile: videoFile.name,
      videoSize: videoFile.size,
      videoType: videoFile.type,
      intervalSeconds,
      format,
      quality
    });

    const response = await fetch(serviceUrl, {
      method: 'POST',
      body: serviceFormData,
      // No authentication headers needed - service is configured without auth
    });

    console.log('📊 Service response status:', response.status);
    console.log('📊 Service response headers:', Object.fromEntries(response.headers.entries()));

    let result;
    try {
      result = await response.json();
      console.log('📊 Service response body:', result);
    } catch (jsonError) {
      console.error('❌ Failed to parse JSON response:', jsonError);
      const textResponse = await response.text();
      console.error('📄 Raw response text:', textResponse);
      return NextResponse.json({ 
        error: 'Invalid JSON response from video frame service',
        details: textResponse.substring(0, 500)
      }, { status: 500 });
    }

    if (!response.ok) {
      console.error('❌ Video frame service error:', result);
      return NextResponse.json(result, { status: response.status });
    }

    console.log('✅ Video frame extraction successful');
    
    // Check if we have frames in the response
    if (!result.frames) {
      console.error('❌ No frames property in response:', result);
      return NextResponse.json({ error: 'No frames property in video frame service response' }, { status: 500 });
    }
    
    if (!Array.isArray(result.frames)) {
      console.error('❌ Frames property is not an array:', result.frames);
      return NextResponse.json({ error: 'Frames property is not an array' }, { status: 500 });
    }
    
    if (result.frames.length === 0) {
      console.error('❌ Empty frames array in response:', result);
      return NextResponse.json({ error: 'No frames extracted from video' }, { status: 500 });
    }
    
    console.log(`📊 Video frame service returned ${result.frames.length} frames`);
    
    // Convert S3 URLs to base64 data URLs on the server side to avoid CORS issues
    if (result.frames && result.frames.length > 0) {
      console.log(`🔄 Converting ${result.frames.length} S3 URLs to base64 data URLs...`);
      const base64Frames: string[] = [];
      let emptyFrames = 0;
      let convertedFrames = 0;
      let totalSizeKB = 0;
      const MAX_TOTAL_SIZE_KB = 3000; // 3MB limit to stay under Vercel's 4.5MB limit
      const MAX_FRAMES = 5; // Limit number of frames to reduce payload size
      
      // Limit frames to reduce payload size
      const framesToProcess = result.frames.slice(0, MAX_FRAMES);
      console.log(`📊 Processing ${framesToProcess.length} frames (limited from ${result.frames.length})`);
      
      for (let i = 0; i < framesToProcess.length; i++) {
        // Check if we're approaching the size limit
        if (totalSizeKB > MAX_TOTAL_SIZE_KB) {
          console.log(`⚠️ Approaching size limit (${totalSizeKB.toFixed(1)}KB), stopping frame processing`);
          break;
        }
        
        try {
          const frameUrl = framesToProcess[i];
          console.log(`📥 Fetching frame ${i + 1}/${framesToProcess.length} from S3: ${frameUrl.substring(0, 100)}...`);
          
          const frameResponse = await fetch(frameUrl, {
            method: 'GET',
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; VideoFrameExtractor/1.0)',
              'Accept': 'image/*',
            }
          });
          
          if (!frameResponse.ok) {
            const errorText = await frameResponse.text();
            console.error(`❌ S3 fetch error for frame ${i + 1}:`, errorText);
            throw new Error(`Failed to fetch frame from S3: ${frameResponse.status} ${frameResponse.statusText}`);
          }
          
          const frameBlob = await frameResponse.blob();
          
          // Check if blob is empty
          if (frameBlob.size === 0) {
            console.warn(`⚠️ Frame ${i + 1} is empty (0 bytes) - skipping`);
            emptyFrames++;
            continue;
          }
          
          // Compress frame to reduce size
          const base64 = await convertBlobToBase64(frameBlob, 150); // Max 150KB per frame
          const frameSizeKB = (base64.length * 0.75) / 1024;
          
          // Check if adding this frame would exceed our limit
          if (totalSizeKB + frameSizeKB > MAX_TOTAL_SIZE_KB) {
            console.log(`⚠️ Frame ${i + 1} would exceed size limit, stopping processing`);
            break;
          }
          
          // Validate the base64 data URL before adding
          if (!base64.startsWith('data:image/')) {
            throw new Error(`Invalid base64 data URL generated: ${base64.substring(0, 50)}...`);
          }
          
          base64Frames.push(base64);
          convertedFrames++;
          totalSizeKB += frameSizeKB;
          
          console.log(`✅ Converted frame ${i + 1} to base64 (${frameSizeKB.toFixed(1)}KB, total: ${totalSizeKB.toFixed(1)}KB)`);
        } catch (error) {
          console.error(`❌ Failed to convert frame ${i + 1} to base64:`, error);
          // Continue with other frames instead of failing completely
        }
      }
      
      console.log(`📊 Frame conversion summary: ${convertedFrames} valid, ${emptyFrames} empty, ${framesToProcess.length} processed, ${totalSizeKB.toFixed(1)}KB total`);
      
      if (base64Frames.length === 0) {
        console.error('❌ No valid frames converted - all S3 URLs returned empty files');
        return NextResponse.json({ 
          error: `Failed to convert any frames from S3 URLs to base64. Summary: ${convertedFrames} valid, ${emptyFrames} empty, ${framesToProcess.length} processed.` 
        }, { status: 500 });
      }
      
      console.log(`✅ Successfully converted ${base64Frames.length} frames to base64 data URLs (${totalSizeKB.toFixed(1)}KB total)`);
      
      // Return the result with base64 frames instead of S3 URLs
      return NextResponse.json({
        ...result,
        frames: base64Frames,
        totalSizeKB: totalSizeKB,
        originalFrameCount: result.frames.length,
        processedFrameCount: base64Frames.length
      });
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Error extracting frames:', error);
    return NextResponse.json({ error: 'Failed to extract frames' }, { status: 500 });
  }
}
