import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting MOV to MP4 conversion and frame extraction');
    
    // Check content type
    const contentType = request.headers.get('content-type');
    console.log('📋 Content-Type:', contentType);
    
    if (!contentType || (!contentType.includes('multipart/form-data') && !contentType.includes('application/x-www-form-urlencoded'))) {
      return NextResponse.json({
        success: false,
        error: 'Invalid content type',
        details: `Content-Type was not one of "multipart/form-data" or "application/x-www-form-urlencoded". Got: ${contentType}`
      }, { status: 400 });
    }
    
    // Parse the form data
    let formData;
    try {
      formData = await request.formData();
    } catch (error) {
      console.error('❌ FormData parsing error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to parse body as FormData.',
        details: error instanceof Error ? error.message : String(error)
      }, { status: 400 });
    }
    
    const videoFile = formData.get('video') as File;
    const maxFrames = parseInt(formData.get('maxFrames') as string) || 6;
    
    if (!videoFile) {
      return NextResponse.json(
        { success: false, error: 'No video file provided' },
        { status: 400 }
      );
    }
    
    console.log(`📹 Processing video: ${videoFile.name}, maxFrames: ${maxFrames}`);
    
    // For Vercel deployment, we'll use a different approach
    // Since FFmpeg.wasm needs to run in the browser, we'll return instructions
    // for client-side processing instead of server-side processing
    
    if (process.env.VERCEL === '1') {
      console.log('🌐 Vercel environment detected - using client-side processing approach');
      
      return NextResponse.json({
        success: true,
        message: 'Video processing will be handled client-side for Vercel compatibility',
        clientSideProcessing: true,
        instructions: {
          method: 'ffmpeg-wasm',
          maxFrames: maxFrames,
          originalFileName: videoFile.name
        }
      });
    }
    
    // For local development, we can still try to use system FFmpeg
    // but provide a fallback to client-side processing
    try {
      // Try to use system FFmpeg if available
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const { existsSync, chmodSync } = await import('fs');
      const ffmpeg = await import('ffmpeg-static');
      const ffprobe = await import('ffprobe-static');
      
      const execAsync = promisify(exec);
      
      // Create temporary file paths
      const tempDir = tmpdir();
      const inputPath = join(tempDir, `input_${Date.now()}_${videoFile.name}`);
      const outputPath = join(tempDir, `output_${Date.now()}.mp4`);
      const framesDir = join(tempDir, `frames_${Date.now()}`);
      
      // Write uploaded file to temp location
      const buffer = Buffer.from(await videoFile.arrayBuffer());
      await writeFile(inputPath, buffer);
      console.log(`✅ Video file written to: ${inputPath}`);
      
      // Create frames directory
      await execAsync(`mkdir -p "${framesDir}"`);
      
      // Convert MOV to MP4 using system FFmpeg
      console.log('🔄 Converting MOV to MP4 with high quality...');
      
      const ffmpegPath = '/opt/homebrew/bin/ffmpeg';
      const fallbackFfmpegPath = '/usr/local/bin/ffmpeg';
      const systemFfmpegPath = '/usr/bin/ffmpeg';
      
      let actualFfmpegPath = ffmpegPath;
      if (!existsSync(ffmpegPath)) {
        if (existsSync(fallbackFfmpegPath)) {
          actualFfmpegPath = fallbackFfmpegPath;
        } else if (existsSync(systemFfmpegPath)) {
          actualFfmpegPath = systemFfmpegPath;
        } else if (ffmpeg.default) {
          actualFfmpegPath = ffmpeg.default as string;
        } else {
          throw new Error('No FFmpeg binary found');
        }
      }
      
      // Check if FFmpeg binary exists
      if (!existsSync(actualFfmpegPath)) {
        throw new Error(`FFmpeg binary not found at: ${actualFfmpegPath}`);
      }
      
      // Make sure it's executable
      chmodSync(actualFfmpegPath, '755');
      
      const convertCommand = `"${actualFfmpegPath}" -i "${inputPath}" -c:v libx264 -crf 18 -preset fast -c:a aac -b:a 128k -movflags +faststart "${outputPath}" -y`;
      console.log('🔍 Convert command:', convertCommand);
      
      await execAsync(convertCommand);
      console.log('✅ High-quality MOV to MP4 conversion completed');
      
      // Extract frames
      console.log('🔄 Extracting frames from converted video...');
      
      const ffprobePath = '/opt/homebrew/bin/ffprobe';
      const fallbackFfprobePath = '/usr/local/bin/ffprobe';
      const systemFfprobePath = '/usr/bin/ffprobe';
      
      let actualFfprobePath = ffprobePath;
      if (!existsSync(ffprobePath)) {
        if (existsSync(fallbackFfprobePath)) {
          actualFfprobePath = fallbackFfprobePath;
        } else if (existsSync(systemFfprobePath)) {
          actualFfprobePath = systemFfprobePath;
        } else if (ffprobe.default) {
          actualFfprobePath = ffprobe.default as string;
        } else {
          throw new Error('No FFprobe binary found');
        }
      }
      
      const durationCommand = `"${actualFfprobePath}" -v quiet -show_entries format=duration -of csv=p=0 "${outputPath}"`;
      const durationResult = await execAsync(durationCommand);
      const duration = parseFloat(durationResult.stdout.trim());
      
      if (isNaN(duration) || duration <= 0) {
        throw new Error(`Invalid video duration: ${duration}`);
      }
      
      console.log(`Video duration: ${duration}s`);
      
      // Calculate frame extraction intervals
      const frameCount = Math.min(maxFrames, 8);
      const interval = duration / frameCount;
      
      console.log(`Extracting ${frameCount} frames at ${interval}s intervals`);
      
      // Extract frames
      const frameCommand = `"${actualFfmpegPath}" -i "${outputPath}" -vf "fps=1/${interval}" -q:v 1 -qmin 1 -qmax 3 "${framesDir}/frame_%03d.jpg" -y`;
      await execAsync(frameCommand);
      console.log('✅ High-quality frame extraction completed');
      
      // Read extracted frame files
      const frames: string[] = [];
      const frameFiles = await execAsync(`ls "${framesDir}"/*.jpg`);
      const frameFileNames = frameFiles.stdout.trim().split('\n').filter(name => name.trim());
      
      const limitedFrameFiles = frameFileNames.slice(0, maxFrames);
      
      for (const frameFile of limitedFrameFiles) {
        try {
          const { readFile } = await import('fs/promises');
          const frameBuffer = await readFile(frameFile.trim());
          const base64Frame = frameBuffer.toString('base64');
          const dataUrl = `data:image/jpeg;base64,${base64Frame}`;
          frames.push(dataUrl);
        } catch (frameError) {
          console.error(`Error reading frame file ${frameFile}:`, frameError);
        }
      }
      
      console.log(`✅ Successfully extracted ${frames.length} frames`);
      
      // Clean up temporary files
      try {
        await unlink(inputPath);
        await unlink(outputPath);
        await execAsync(`rm -rf "${framesDir}"`);
        console.log('✅ Temporary files cleaned up');
      } catch (cleanupError) {
        console.warn('Warning: Failed to clean up temporary files:', cleanupError);
      }
      
      return NextResponse.json({
        success: true,
        frames: frames,
        message: `Successfully converted MOV to MP4 and extracted ${frames.length} frames`,
        originalFileName: videoFile.name
      });
      
    } catch (localError) {
      console.warn('❌ Local FFmpeg processing failed, falling back to client-side processing:', localError);
      
      return NextResponse.json({
        success: true,
        message: 'Local processing failed, using client-side processing',
        clientSideProcessing: true,
        instructions: {
          method: 'ffmpeg-wasm',
          maxFrames: maxFrames,
          originalFileName: videoFile.name
        }
      });
    }
    
  } catch (error) {
    console.error('Server-side video conversion error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error during video processing',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}