import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Video conversion and frame extraction via Ittybit');
    
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
    const maxFrames = parseInt(formData.get('maxFrames') as string) || 20;
    
    if (!videoFile) {
      return NextResponse.json(
        { success: false, error: 'No video file provided' },
        { status: 400 }
      );
    }
    
    console.log(`📹 Processing video: ${videoFile.name}, maxFrames: ${maxFrames}`);
    
    // For Vercel deployment, we'll use Ittybit for video processing
    // This is much more reliable than FFmpeg.wasm
    
    return NextResponse.json({
      success: true,
      message: 'Video processing should be handled client-side with Ittybit',
      instructions: {
        method: 'client-side',
        service: 'ittybit',
        reason: 'Vercel serverless environment - use Ittybit for video processing',
        steps: [
          '1. Upload video to Ittybit using client-side API',
          '2. Create thumbnail extraction task',
          '3. Wait for task completion',
          '4. Download frames as base64 data URLs'
        ]
      },
      maxFrames,
      videoInfo: {
        name: videoFile.name,
        size: videoFile.size,
        type: videoFile.type
      }
    });
    
  } catch (error) {
    console.error('❌ Video processing error:', error);
    return NextResponse.json({
      success: false,
      error: 'Video processing failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}