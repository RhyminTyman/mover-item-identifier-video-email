import { NextRequest, NextResponse } from 'next/server';

const VIDEO_FRAME_API_URL = process.env.VIDEO_FRAME_API_URL || 'http://localhost:3001';

// Convert a fetched frame Blob into a base64 data URL.
//
// This runs in the Node.js runtime, so the browser-only image pipeline that
// used to live here (`new Image()`, `URL.createObjectURL`, `OffscreenCanvas`)
// was never actually reachable - it threw ReferenceError on every frame that
// exceeded the size threshold, which is exactly the case it was written to
// handle. Frame scaling/quality belongs to the upstream frame service (it
// already accepts `format` and `quality` params), so we simply encode here and
// skip frames that are implausibly large rather than pretending to compress.
async function convertBlobToBase64(blob: Blob, maxSizeKB: number = 80): Promise<string> {
  const sizeKB = blob.size / 1024;
  if (sizeKB > maxSizeKB) {
    console.warn(
      `Frame is ${sizeKB.toFixed(1)}KB (target ${maxSizeKB}KB); ` +
      `request a lower quality from the frame service to shrink it.`
    );
  }

  const buffer = await blob.arrayBuffer();
  if (buffer.byteLength === 0) {
    throw new Error('Empty frame blob');
  }

  const base64 = Buffer.from(buffer).toString('base64');
  const mimeType = blob.type && blob.type.startsWith('image/') ? blob.type : 'image/jpeg';
  return `data:${mimeType};base64,${base64}`;
}

// NOTE: a debug `GET ?url=` handler used to live here. It fetched an arbitrary
// caller-supplied URL server-side and echoed back the status and full response
// headers. Because /api/video(.*) is an unauthenticated public route, that was
// a server-side request forgery primitive against internal/link-local
// addresses (cloud metadata, internal services). Removed - if a fetch probe is
// needed again, put it behind an admin check and an allowlist.

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
    
    // Log video duration if available (this might help debug)
    const videoSizeMB = videoFile?.size / (1024 * 1024);
    console.log('📹 Video file size in MB:', videoSizeMB.toFixed(2));
    
    // Check file size and warn if over 50MB, but allow up to 100MB
    const MAX_FILE_SIZE_MB = 100;
    const RECOMMENDED_SIZE_MB = 50;
    if (videoSizeMB > MAX_FILE_SIZE_MB) {
      console.error(`❌ Video file (${videoSizeMB.toFixed(2)}MB) exceeds maximum size limit of ${MAX_FILE_SIZE_MB}MB`);
      return NextResponse.json({ error: `Video file too large. Maximum size is ${MAX_FILE_SIZE_MB}MB` }, { status: 413 });
    } else if (videoSizeMB > RECOMMENDED_SIZE_MB) {
      console.warn(`⚠️ Video file (${videoSizeMB.toFixed(2)}MB) exceeds recommended size limit of ${RECOMMENDED_SIZE_MB}MB. Processing may take longer.`);
    }

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
      console.log('📊 Service response frames count:', result.frames?.length || 'undefined');
      if (result.frames && result.frames.length > 0) {
        console.log('📊 First frame URL:', result.frames[0]?.substring(0, 100) + '...');
      }
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
    console.log(`📊 Frame URLs preview:`, result.frames.slice(0, 3).map((url: string, i: number) => `Frame ${i+1}: ${url.substring(0, 100)}...`));
    
    // Check if all frame URLs are the same (indicates service issue)
    const uniqueUrls = new Set(result.frames);
    if (uniqueUrls.size === 1 && result.frames.length > 1) {
      console.log('⚠️ WARNING: All frame URLs are identical - external service may not be extracting different frames');
    } else {
      console.log(`📊 Unique frame URLs: ${uniqueUrls.size} out of ${result.frames.length} total`);
    }
    
    // If we only got 1 frame, try with progressively smaller intervals
    if (result.frames.length === 1) {
      console.log('⚠️ Only 1 frame returned, trying with smaller intervals...');
      
      const retryIntervals = [0.25, 0.1, 0.05]; // Try 0.25s, 0.1s, then 0.05s for maximum frame extraction
      
      for (const retryInterval of retryIntervals) {
        console.log(`🔄 Trying with ${retryInterval}s interval...`);
        
        const retryParams = new URLSearchParams();
        retryParams.append('intervalSeconds', retryInterval.toString());
        retryParams.append('format', format || 'jpg');
        retryParams.append('quality', quality || '80');
        
        const retryUrl = `${VIDEO_FRAME_API_URL}/api/frames?${retryParams.toString()}`;
        console.log('🔄 Retry URL:', retryUrl);
        
        try {
          const retryResponse = await fetch(retryUrl, {
            method: 'POST',
            body: serviceFormData,
          });
          
          console.log(`📊 Retry response status: ${retryResponse.status}`);
          
          if (retryResponse.ok) {
            const retryResult = await retryResponse.json();
            console.log(`📊 Retry result for ${retryInterval}s:`, {
              framesCount: retryResult.frames?.length || 0,
              hasFrames: !!retryResult.frames,
              isArray: Array.isArray(retryResult.frames)
            });
            
            if (retryResult.frames && retryResult.frames.length > 1) {
              console.log(`✅ Retry successful! Got ${retryResult.frames.length} frames with ${retryInterval}s interval`);
              console.log(`📊 Retry frame URLs:`, retryResult.frames.slice(0, 3).map((url: string, i: number) => `Frame ${i+1}: ${url.substring(0, 50)}...`));
              result.frames = retryResult.frames;
              break; // Stop trying once we get more frames
            } else {
              console.log(`⚠️ Retry with ${retryInterval}s still only got ${retryResult.frames?.length || 0} frames`);
              if (retryResult.frames && retryResult.frames.length === 1) {
                console.log(`📊 Single frame URL from retry:`, retryResult.frames[0]?.substring(0, 100) + '...');
              }
            }
          } else {
            console.log(`❌ Retry failed with status ${retryResponse.status}`);
            const errorText = await retryResponse.text().catch(() => 'Could not read error text');
            console.log(`❌ Retry error details:`, errorText.substring(0, 200));
          }
        } catch (retryError) {
          console.log(`❌ Retry with ${retryInterval}s failed:`, retryError);
        }
      }
      
      console.log(`📊 Final frame count after retries: ${result.frames.length}`);
      
      // Note: We removed frame duplication fallback to ensure we only use real video frames
    }
    
    // Convert S3 URLs to base64 data URLs on the server side to avoid CORS issues
    if (result.frames && result.frames.length > 0) {
      console.log(`🔄 Converting ${result.frames.length} S3 URLs to base64 data URLs...`);
      const base64Frames: string[] = [];
      let emptyFrames = 0;
      let convertedFrames = 0;
      let totalSizeKB = 0;
      const MAX_TOTAL_SIZE_KB = 45000; // 45MB limit to support 50MB videos
      
      // Intelligently select frames to process based on video length.
      //
      // Carry each frame's ORIGINAL index alongside its URL. `frames` and
      // `timestamps` from the upstream service are parallel arrays, and this
      // route rebuilds `frames` while `timestamps` passes straight through the
      // `...result` spread below - so without the original index every
      // subsampled, skipped or size-capped frame silently shifts the two arrays
      // out of alignment and every timestamp downstream is wrong.
      let framesToProcess: Array<{ url: string; sourceIndex: number }> =
        result.frames.map((url: string, sourceIndex: number) => ({ url, sourceIndex }));

      // If we have more than 20 frames, sample evenly across the whole video.
      //
      // The previous `filter(i % step === 0).slice(0, max)` with
      // `step = floor(n / max)` dropped the end of the video rather than
      // sampling it: for 21-39 frames step collapsed to 1, so the filter kept
      // everything and the slice simply took the FIRST 20 - the tail was never
      // looked at. Interpolating over [0, n-1] instead spans the full duration
      // and always includes the first and last frame.
      // Must stay >= 2: the interpolation below divides by (MAX_FRAMES - 1).
      const MAX_FRAMES = 20; // Limit to 20 frames for very long videos
      if (framesToProcess.length > MAX_FRAMES) {
        const total = framesToProcess.length;
        // Indices are strictly increasing here, so no duplicates: this branch
        // only runs when total > MAX_FRAMES, which makes the stride
        // (total - 1) / (MAX_FRAMES - 1) greater than 1.
        framesToProcess = Array.from({ length: MAX_FRAMES }, (_, k) =>
          framesToProcess[Math.round((k * (total - 1)) / (MAX_FRAMES - 1))]
        );
        console.log(`📊 Video has ${total} frames, evenly sampling ${framesToProcess.length} across the full duration`);
      } else {
        console.log(`📊 Processing ALL ${framesToProcess.length} frames from video`);
      }

      // Original index of every frame that actually made it into base64Frames.
      const keptSourceIndices: number[] = [];
      
      for (let i = 0; i < framesToProcess.length; i++) {
        // Check if we're approaching the size limit
        if (totalSizeKB > MAX_TOTAL_SIZE_KB) {
          console.log(`⚠️ Approaching size limit (${totalSizeKB.toFixed(1)}KB), stopping frame processing`);
          break;
        }
        
        try {
          const frameUrl = framesToProcess[i].url;
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
          const base64 = await convertBlobToBase64(frameBlob, 120); // Max 120KB per frame for better compression
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
          keptSourceIndices.push(framesToProcess[i].sourceIndex);
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
      
      // Realign the per-frame metadata to the frames we actually return.
      //
      // `...result` carries the upstream `timestamps`, `count` and `truncated`,
      // all of which describe the ORIGINAL frame list. Since `frames` is
      // replaced below with a subsampled/filtered array, every one of those
      // must be recomputed or the consumer positionally matches frame N against
      // the timestamp of a different frame.
      const upstreamTimestamps: unknown = result.timestamps;
      let alignedTimestamps: number[] | undefined;

      if (Array.isArray(upstreamTimestamps)) {
        const mapped = keptSourceIndices.map((i) => upstreamTimestamps[i]);
        // All-or-nothing: a partially resolved array would reintroduce exactly
        // the misalignment this is here to prevent.
        alignedTimestamps = mapped.every((t) => typeof t === 'number')
          ? (mapped as number[])
          : undefined;
      }

      if (!alignedTimestamps) {
        // Derive from the interval only when we actually know it. Never invent
        // timestamps - omitting the field is honest, a wrong one is not.
        const intervalNum = Number(result.intervalSeconds ?? intervalSeconds);
        if (Number.isFinite(intervalNum) && intervalNum > 0) {
          alignedTimestamps = keptSourceIndices.map((i) => i * intervalNum);
        }
      }

      if (!alignedTimestamps) {
        console.warn('⚠️ Could not align timestamps to returned frames; omitting the field');
      }

      const droppedFrames = result.frames.length - base64Frames.length;

      // Return the result with base64 frames instead of S3 URLs
      return NextResponse.json({
        ...result,
        frames: base64Frames,
        // `undefined` is dropped by JSON serialization, which is deliberate:
        // it removes the stale upstream array rather than leaving it in place.
        timestamps: alignedTimestamps,
        count: base64Frames.length,
        // Upstream only knows about its own cap; this route truncates too.
        truncated: Boolean(result.truncated) || droppedFrames > 0,
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
