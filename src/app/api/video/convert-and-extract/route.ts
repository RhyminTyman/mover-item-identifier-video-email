import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink, readFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting MOV to MP4 conversion and frame extraction');
    
    // Parse the form data
    const formData = await request.formData();
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
      
      // Convert MOV to MP4 using FFmpeg
      console.log('🔄 Converting MOV to MP4...');
      const convertCommand = `ffmpeg -i "${inputPath}" -c:v libx264 -c:a aac -movflags +faststart "${outputPath}" -y`;
      await execAsync(convertCommand);
      console.log('✅ MOV to MP4 conversion completed');
      
      // Extract frames from converted MP4
      console.log('🔄 Extracting frames from converted video...');
      const frameCommand = `ffmpeg -i "${outputPath}" -vf "fps=1/2" -q:v 2 "${framesDir}/frame_%03d.jpg" -y`;
      await execAsync(frameCommand);
      console.log('✅ Frame extraction completed');
      
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
