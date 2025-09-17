import { NextRequest, NextResponse } from 'next/server';

const VIDEO_FRAME_API_URL = process.env.VIDEO_FRAME_API_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Video frame extraction service');
    
    // Parse the form data
    const formData = await request.formData();
    const videoFile = formData.get('video') as File;
    const maxFrames = parseInt(formData.get('maxFrames') as string) || 8;
    
    if (!videoFile) {
      return NextResponse.json(
        { success: false, error: 'No video file provided' },
        { status: 400 }
      );
    }
    
    console.log(`📹 Processing video: ${videoFile.name}, maxFrames: ${maxFrames}`);
    
    // Create FormData for the external video frame service
    const serviceFormData = new FormData();
    serviceFormData.append('video', videoFile);
    
    // Build query parameters for frame extraction
    const params = new URLSearchParams();
    params.append('intervalSeconds', '2'); // Extract frames every 2 seconds
    params.append('format', 'jpg');
    params.append('quality', '80');
    
    const serviceUrl = `${VIDEO_FRAME_API_URL}/api/frames?${params.toString()}`;
    
    console.log('🔄 Calling external video frame service:', serviceUrl);
    
    const response = await fetch(serviceUrl, {
      method: 'POST',
      body: serviceFormData,
    });
    
    console.log('📊 Service response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Video frame service error:', errorText);
      throw new Error(`Video frame service failed: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('📊 Service response:', result);
    
    if (!result.frames || !Array.isArray(result.frames) || result.frames.length === 0) {
      throw new Error('No frames extracted from video');
    }
    
    console.log(`✅ Successfully extracted ${result.frames.length} frames`);
    
    return NextResponse.json({
      success: true,
      frames: result.frames,
      message: `Successfully extracted ${result.frames.length} frames from video`,
      originalFileName: videoFile.name,
      maxFrames
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