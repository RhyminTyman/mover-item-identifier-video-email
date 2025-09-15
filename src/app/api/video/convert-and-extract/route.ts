import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink, readFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { existsSync, chmodSync } from 'fs';
import ffmpeg from 'ffmpeg-static';
import ffprobe from 'ffprobe-static';

const execAsync = promisify(exec);

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
        details: error.message
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
    
    // Create temporary file paths
    const tempDir = tmpdir();
    const inputPath = join(tempDir, `input_${Date.now()}_${videoFile.name}`);
    const outputPath = join(tempDir, `output_${Date.now()}.mp4`);
    const framesDir = join(tempDir, `frames_${Date.now()}`);
    
    try {
      // Write uploaded file to temp location
      const buffer = Buffer.from(await videoFile.arrayBuffer());
      await writeFile(inputPath, buffer);
      console.log(`✅ Video file written to: ${inputPath}`);
      
      // Create frames directory
      await execAsync(`mkdir -p "${framesDir}"`);
      
      // Convert MOV to MP4 using system FFmpeg with high quality
      console.log('🔄 Converting MOV to MP4 with high quality...');
      
      // Use system FFmpeg for both development and production
      const ffmpegPath = '/opt/homebrew/bin/ffmpeg'; // Try Homebrew path first
      const fallbackFfmpegPath = '/usr/local/bin/ffmpeg'; // System path fallback
      const systemFfmpegPath = '/usr/bin/ffmpeg'; // System path fallback
      
      let actualFfmpegPath = ffmpegPath;
      if (!existsSync(ffmpegPath)) {
        if (existsSync(fallbackFfmpegPath)) {
          actualFfmpegPath = fallbackFfmpegPath;
        } else if (existsSync(systemFfmpegPath)) {
          actualFfmpegPath = systemFfmpegPath;
        } else {
          // Try the bundled FFmpeg as last resort
          actualFfmpegPath = ffmpeg;
        }
      }
      
      try {
        
        console.log('🔍 FFmpeg path:', actualFfmpegPath);
        console.log('🔍 Input path:', inputPath);
        console.log('🔍 Output path:', outputPath);
        
        // Check if FFmpeg binary exists
        if (!existsSync(actualFfmpegPath)) {
          throw new Error(`FFmpeg binary not found at: ${actualFfmpegPath}`);
        }
        
        // Make sure it's executable
        chmodSync(actualFfmpegPath, '755');
        
        const convertCommand = `"${actualFfmpegPath}" -i "${inputPath}" -c:v libx264 -crf 18 -preset fast -c:a aac -b:a 128k -movflags +faststart "${outputPath}" -y`;
        console.log('🔍 Convert command:', convertCommand);
        
        const result = await execAsync(convertCommand);
        console.log('✅ High-quality MOV to MP4 conversion completed');
        console.log('FFmpeg output:', result.stdout);
        if (result.stderr) console.log('FFmpeg stderr:', result.stderr);
      } catch (ffmpegError) {
        console.error('❌ FFmpeg conversion error:', ffmpegError);
        console.error('❌ FFmpeg stderr:', ffmpegError.stderr);
        console.error('❌ FFmpeg stdout:', ffmpegError.stdout);
        throw new Error(`FFmpeg conversion failed: ${ffmpegError.message}`);
      }
      
      // Extract frames from converted MP4 with better quality
      console.log('🔄 Extracting frames from converted video...');
      
      // Get video duration and extract frames using system FFmpeg
      console.log('🔄 Getting video duration and extracting frames...');
      
      // Get video duration using ffprobe
      const ffprobePath = '/opt/homebrew/bin/ffprobe'; // Try Homebrew path first
      const fallbackFfprobePath = '/usr/local/bin/ffprobe'; // System path fallback
      const systemFfprobePath = '/usr/bin/ffprobe'; // System path fallback
      
      let actualFfprobePath = ffprobePath;
      if (!existsSync(ffprobePath)) {
        if (existsSync(fallbackFfprobePath)) {
          actualFfprobePath = fallbackFfprobePath;
        } else if (existsSync(systemFfprobePath)) {
          actualFfprobePath = systemFfprobePath;
        } else {
          // Try the bundled FFprobe as last resort
          actualFfprobePath = ffprobe;
        }
      }
        
      console.log('🔍 FFprobe path:', actualFfprobePath);
      const durationCommand = `"${actualFfprobePath}" -v quiet -show_entries format=duration -of csv=p=0 "${outputPath}"`;
      console.log('🔍 Duration command:', durationCommand);
      
      const durationResult = await execAsync(durationCommand);
      console.log('🔍 Duration result:', durationResult.stdout);
      const duration = parseFloat(durationResult.stdout.trim());
      
      if (isNaN(duration) || duration <= 0) {
        throw new Error(`Invalid video duration: ${duration}`);
      }
      
      console.log(`Video duration: ${duration}s`);
      
      // Calculate frame extraction intervals for better coverage
      const frameCount = Math.min(maxFrames, 8); // Max 8 frames
      const interval = duration / frameCount;
      
      console.log(`Extracting ${frameCount} frames at ${interval}s intervals`);
      
      // Extract frames using system FFmpeg
      const frameCommand = `"${actualFfmpegPath}" -i "${outputPath}" -vf "fps=1/${interval}" -q:v 1 -qmin 1 -qmax 3 "${framesDir}/frame_%03d.jpg" -y`;
      await execAsync(frameCommand);
      console.log('✅ High-quality frame extraction completed');
      
      // Read extracted frame files
      const frames: string[] = [];
      const frameFiles = await execAsync(`ls "${framesDir}"/*.jpg`);
      const frameFileNames = frameFiles.stdout.trim().split('\n').filter(name => name.trim());
      
      // Limit to maxFrames
      const limitedFrameFiles = frameFileNames.slice(0, maxFrames);
      
      for (const frameFile of limitedFrameFiles) {
        try {
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
      
    } catch (ffmpegError) {
      console.error('FFmpeg error:', ffmpegError);
      
      // Clean up on error
      try {
        await unlink(inputPath).catch(() => {});
        await unlink(outputPath).catch(() => {});
        await execAsync(`rm -rf "${framesDir}"`).catch(() => {});
      } catch (cleanupError) {
        console.warn('Cleanup error:', cleanupError);
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Video conversion failed. FFmpeg may not be available or the video format is not supported.',
          details: ffmpegError instanceof Error ? ffmpegError.message : 'Unknown error'
        },
        { status: 500 }
      );
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
