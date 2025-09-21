interface FrameExtractionOptions {
  intervalSeconds?: number;
  format?: 'jpg' | 'png' | 'webp';
  quality?: number;
  zip?: boolean;
}

interface FrameExtractionResponse {
  jobId: string;
  frames: string[];
  count: number;
}

class VideoFrameService {
  private baseUrl: string;
  private externalApiUrl: string;
  private apiKey: string;
  private readonly LARGE_FILE_THRESHOLD_MB = 4; // 4MB threshold for Vercel payload limit

  constructor() {
    this.baseUrl = '/api/video/extract-frames'; // Use our Next.js API route for small files
    this.externalApiUrl = process.env.NEXT_PUBLIC_VIDEO_FRAME_API_URI || 'http://localhost:3001';
    this.apiKey = ''; // Not needed for our API route
  }

  async extractFrames(
    videoFile: File,
    options: FrameExtractionOptions = {}
  ): Promise<FrameExtractionResponse> {
    const fileSizeMB = videoFile.size / (1024 * 1024);
    console.log('🔑 Video Frame Service Debug:', {
      baseUrl: this.baseUrl,
      externalApiUrl: this.externalApiUrl,
      fileName: videoFile.name,
      fileSize: videoFile.size,
      fileSizeMB: fileSizeMB.toFixed(2),
      fileType: videoFile.type,
      isLargeFile: fileSizeMB > this.LARGE_FILE_THRESHOLD_MB
    });

    // For large files, call external API directly to bypass Vercel payload limits
    if (fileSizeMB > this.LARGE_FILE_THRESHOLD_MB) {
      console.log('📤 Large file detected, calling external API directly...');
      return await this.extractFramesFromExternal(videoFile, options);
    }

    // For small files, use the regular Next.js API route
    console.log('📤 Small file, using regular API route...');
    const formData = new FormData();
    formData.append('video', videoFile);
    if (options.intervalSeconds) formData.append('intervalSeconds', options.intervalSeconds.toString());
    if (options.format) formData.append('format', options.format);
    if (options.quality) formData.append('quality', options.quality.toString());
    if (options.zip) formData.append('zip', '1');

    const url = this.baseUrl;
    console.log('🌐 Making request to:', url);

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to extract frames');
    }

    if (options.zip) {
      // Handle ZIP download
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `frames-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
      return { jobId: '', frames: [], count: 0 };
    }

    return await response.json();
  }

  private async extractFramesFromExternal(
    videoFile: File,
    options: FrameExtractionOptions = {}
  ): Promise<FrameExtractionResponse> {
    try {
      // Call external video frame API directly with the video file
      console.log('🎬 Calling external video frame API directly...');
      const externalFormData = new FormData();
      externalFormData.append('video', videoFile);
      if (options.intervalSeconds) externalFormData.append('intervalSeconds', options.intervalSeconds.toString());
      if (options.format) externalFormData.append('format', options.format);
      if (options.quality) externalFormData.append('quality', options.quality.toString());
      if (options.zip) externalFormData.append('zip', '1');

      const externalUrl = `${this.externalApiUrl}/api/frames`;
      console.log('🌐 Calling external API:', externalUrl);

      const externalResponse = await fetch(externalUrl, {
        method: 'POST',
        body: externalFormData,
      });

      if (!externalResponse.ok) {
        const errorText = await externalResponse.text();
        console.error('❌ External API error:', errorText);
        throw new Error(`External video processing failed: ${errorText}`);
      }

      if (options.zip) {
        // Handle ZIP download from external API
        const blob = await externalResponse.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `frames-${Date.now()}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
        return { jobId: '', frames: [], count: 0 };
      }

      const result = await externalResponse.json();
      console.log('✅ External API success:', { framesCount: result.frames?.length || 0 });

      return result;

    } catch (error) {
      console.error('❌ Error in external video processing:', error);
      throw new Error(`Failed to process large video: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      const data = await response.json();
      return data.ok === true;
    } catch {
      return false;
    }
  }

  private async generateHmacSignature(message: string, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(message);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    const hashArray = Array.from(new Uint8Array(signature));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}

export const videoFrameService = new VideoFrameService();
export type { FrameExtractionOptions, FrameExtractionResponse };
