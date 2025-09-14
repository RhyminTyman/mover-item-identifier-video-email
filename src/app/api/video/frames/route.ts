import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Check if we're in a Vercel environment
const isVercel = process.env.VERCEL === '1';
const isProduction = process.env.NODE_ENV === 'production';

// Check if FFmpeg is available
async function checkFFmpegAvailable(): Promise<boolean> {
  try {
    await execAsync('ffmpeg -version');
    return true;
  } catch (error) {
    console.warn('FFmpeg not available:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('video') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No video file provided' }, { status: 400 });
    }

    console.log(`Processing video on server: ${file.name}, type: ${file.type}, size: ${file.size}`);
    console.log(`Environment: Vercel=${isVercel}, Production=${isProduction}`);

    // For Vercel deployment without FFmpeg, return a placeholder response
    if (isVercel && !await checkFFmpegAvailable()) {
      console.warn('FFmpeg not available in Vercel environment, returning placeholder');
      return NextResponse.json({
        success: false,
        error: 'Video processing not available in this environment',
        message: 'Please convert MOV files to MP4 format for browser compatibility',
        fallback: true
      });
    }

    // Create temporary directory for processing
    const tempDir = isVercel ? join('/tmp', 'video-processing') : join(process.cwd(), 'tmp', 'video-processing');
    await mkdir(tempDir, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const inputPath = join(tempDir, `input_${timestamp}_${file.name}`);
    const outputPath = join(tempDir, `output_${timestamp}_frame.jpg`);

    try {
      // Save uploaded file
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(inputPath, buffer);

      // Extract frame using FFmpeg (most reliable method)
      const ffmpegCommand = `ffmpeg -i "${inputPath}" -ss 1 -vframes 1 -q:v 2 "${outputPath}" -y`;
      
      console.log(`Running FFmpeg command: ${ffmpegCommand}`);
      const { stderr } = await execAsync(ffmpegCommand);

      if (stderr && !stderr.includes('frame=')) {
        console.warn('FFmpeg stderr:', stderr);
      }

      // Read the extracted frame
      const frameBuffer = await import('fs').then(fs => fs.promises.readFile(outputPath));
      const base64Frame = frameBuffer.toString('base64');
      const dataUrl = `data:image/jpeg;base64,${base64Frame}`;

      // Clean up temporary files
      await Promise.all([
        unlink(inputPath).catch(() => {}),
        unlink(outputPath).catch(() => {})
      ]);

      console.log(`Successfully extracted frame from ${file.name} on server`);

      return NextResponse.json({
        success: true,
        frames: [dataUrl],
        method: 'server-side-ffmpeg'
      });

    } catch (ffmpegError) {
      console.error('FFmpeg processing failed:', ffmpegError);
      
      // Clean up on error
      await Promise.all([
        unlink(inputPath).catch(() => {}),
        unlink(outputPath).catch(() => {})
      ]);

      // Try alternative approach with different FFmpeg options
      try {
        const alternativeCommand = `ffmpeg -i "${inputPath}" -ss 0.5 -vframes 1 -f image2 "${outputPath}" -y`;
        console.log(`Trying alternative FFmpeg command: ${alternativeCommand}`);
        
        await writeFile(inputPath, Buffer.from(await file.arrayBuffer()));
        const { stderr } = await execAsync(alternativeCommand);
        
        if (stderr && !stderr.includes('frame=')) {
          console.warn('Alternative FFmpeg stderr:', stderr);
        }

        const frameBuffer = await import('fs').then(fs => fs.promises.readFile(outputPath));
        const base64Frame = frameBuffer.toString('base64');
        const dataUrl = `data:image/jpeg;base64,${base64Frame}`;

        // Clean up
        await Promise.all([
          unlink(inputPath).catch(() => {}),
          unlink(outputPath).catch(() => {})
        ]);

        return NextResponse.json({
          success: true,
          frames: [dataUrl],
          method: 'server-side-ffmpeg-alternative'
        });

      } catch (alternativeError) {
        console.error('Alternative FFmpeg processing also failed:', alternativeError);
        
        // Clean up on error
        await Promise.all([
          unlink(inputPath).catch(() => {}),
          unlink(outputPath).catch(() => {})
        ]);

        return NextResponse.json({
          success: false,
          error: 'Server-side video processing failed',
          details: ffmpegError.message
        }, { status: 500 });
      }
    }

  } catch (error) {
    console.error('Server-side video processing error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Health check endpoint
export async function GET() {
  try {
    const ffmpegAvailable = await checkFFmpegAvailable();
    
    return NextResponse.json({
      status: ffmpegAvailable ? 'healthy' : 'limited',
      ffmpeg: ffmpegAvailable ? 'available' : 'unavailable',
      environment: {
        vercel: isVercel,
        production: isProduction,
        nodeEnv: process.env.NODE_ENV
      },
      message: ffmpegAvailable 
        ? 'Video processing service is ready'
        : 'Video processing limited - MOV files will fallback to client-side processing',
      fallback: !ffmpegAvailable
    });
  } catch (err) {
    return NextResponse.json({
      status: 'unhealthy',
      ffmpeg: 'unavailable',
      environment: {
        vercel: isVercel,
        production: isProduction,
        nodeEnv: process.env.NODE_ENV
      },
      error: 'Video processing service error',
      fallback: true
    }, { status: 503 });
  }
}
