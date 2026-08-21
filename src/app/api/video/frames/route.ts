import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { execFile } from 'child_process';
import { randomUUID } from 'crypto';
import { promisify } from 'util';

// execFile does NOT spawn a shell: arguments are passed as an argv array, so a
// hostile upload filename cannot break out into shell metacharacters.
const execFileAsync = promisify(execFile);

// Hard ceiling so a single upload cannot pin a worker indefinitely.
const FFMPEG_TIMEOUT_MS = 30_000;
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

// Check if we're in a Vercel environment
const isVercel = process.env.VERCEL === '1';
const isProduction = process.env.NODE_ENV === 'production';

// Check if FFmpeg is available
async function checkFFmpegAvailable(): Promise<boolean> {
  try {
    await execFileAsync('ffmpeg', ['-version'], { timeout: FFMPEG_TIMEOUT_MS });
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

    if (file.size > MAX_VIDEO_BYTES) {
      return NextResponse.json({ error: 'Video file too large' }, { status: 413 });
    }

    console.log(`Processing video on server: type=${file.type}, size=${file.size}`);
    console.log(`Environment: Vercel=${isVercel}, Production=${isProduction}`);

    // For Vercel deployment, return a simple response
    if (isVercel) {
      console.warn('Vercel environment detected, providing fallback response');
      return NextResponse.json({
        success: false,
        error: 'Server-side video processing not available',
        message: 'Please convert MOV files to MP4 format for better browser compatibility',
        fallback: true,
        suggestion: 'Try converting your video to MP4 format using an online converter or video editing software'
      });
    }

    // Create temporary directory for processing
    const tempDir = isVercel ? join('/tmp', 'video-processing') : join(process.cwd(), 'tmp', 'video-processing');
    await mkdir(tempDir, { recursive: true });

    // Never build a path from the client-supplied filename: it is attacker
    // controlled and would allow both path traversal and (previously, via the
    // shell) command injection. A server-generated id is sufficient.
    const jobId = `${Date.now()}_${randomUUID()}`;
    const inputPath = join(tempDir, `input_${jobId}`);
    const outputPath = join(tempDir, `output_${jobId}_frame.jpg`);

    try {
      // Save uploaded file
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(inputPath, buffer);

      // Extract frame using FFmpeg (most reliable method)
      const { stderr } = await execFileAsync(
        'ffmpeg',
        ['-i', inputPath, '-ss', '1', '-vframes', '1', '-q:v', '2', outputPath, '-y'],
        { timeout: FFMPEG_TIMEOUT_MS }
      );

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

      console.log('Successfully extracted frame on server');

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
        console.log('Trying alternative FFmpeg invocation');

        await writeFile(inputPath, Buffer.from(await file.arrayBuffer()));
        const { stderr } = await execFileAsync(
          'ffmpeg',
          ['-i', inputPath, '-ss', '0.5', '-vframes', '1', '-f', 'image2', outputPath, '-y'],
          { timeout: FFMPEG_TIMEOUT_MS }
        );
        
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
          details: ffmpegError instanceof Error ? ffmpegError.message : 'Unknown error'
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
  } catch {
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
