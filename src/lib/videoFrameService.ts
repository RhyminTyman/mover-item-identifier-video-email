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
  private apiKey: string;

  constructor() {
    this.baseUrl = '/api/video/extract-frames'; // Use our Next.js API route
    this.apiKey = ''; // Not needed for our API route
  }

  async extractFrames(
    videoFile: File,
    options: FrameExtractionOptions = {}
  ): Promise<FrameExtractionResponse> {
    console.log('🔑 Video Frame Service Debug:', {
      baseUrl: this.baseUrl,
      apiKey: this.apiKey ? `${this.apiKey.substring(0, 8)}...` : 'NOT SET',
      fileName: videoFile.name,
      fileSize: videoFile.size,
      fileType: videoFile.type
    });

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
