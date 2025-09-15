import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink, readFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';

// Set FFmpeg and FFprobe paths
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

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
      
      // Convert MOV to MP4 using fluent-ffmpeg with high quality
      console.log('🔄 Converting MOV to MP4 with high quality...');
      await new Promise((resolve, reject) => {
        ffmpeg(inputPath)
          .videoCodec('libx264')
          .audioCodec('aac')
          .addOption('-crf', '18')
          .addOption('-preset', 'fast')
          .addOption('-movflags', '+faststart')
          .audioBitrate('128k')
          .output(outputPath)
          .on('end', () => {
            console.log('✅ High-quality MOV to MP4 conversion completed');
            resolve(true);
          })
          .on('error', (err) => {
            console.error('FFmpeg conversion error:', err);
            reject(err);
          })
          .run();
      });
      
      // Extract frames from converted MP4 with better quality
      console.log('🔄 Extracting frames from converted video...');
      
      // Get video duration and extract frames using fluent-ffmpeg
      console.log('🔄 Getting video duration and extracting frames...');
      
      await new Promise((resolve, reject) => {
        ffmpeg.ffprobe(outputPath, (err, metadata) => {
          if (err) {
            console.error('FFprobe error:', err);
            reject(err);
            return;
          }
          
          const duration = parseFloat(metadata.format.duration);
          
          if (isNaN(duration) || duration <= 0) {
            reject(new Error(`Invalid video duration: ${duration}`));
            return;
          }
          
          console.log(`Video duration: ${duration}s`);
          
          // Calculate frame extraction intervals for better coverage
          const frameCount = Math.min(maxFrames, 8); // Max 8 frames
          const interval = duration / frameCount;
          
          console.log(`Extracting ${frameCount} frames at ${interval}s intervals`);
          
          // Extract frames using fluent-ffmpeg
          ffmpeg(outputPath)
            .fps(1 / interval)
            .outputOptions(['-q:v 1', '-qmin 1', '-qmax 3'])
            .output(`${framesDir}/frame_%03d.jpg`)
            .on('end', () => {
              console.log('✅ High-quality frame extraction completed');
              resolve(true);
            })
            .on('error', (frameErr) => {
              console.error('Frame extraction error:', frameErr);
              reject(frameErr);
            })
            .run();
        });
      });
      
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
