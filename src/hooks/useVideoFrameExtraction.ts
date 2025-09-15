import { useState, useCallback } from 'react';
import { videoFrameService, FrameExtractionOptions, FrameExtractionResponse } from '@/lib/videoFrameService';

interface UseVideoFrameExtractionReturn {
  extractFrames: (file: File, options?: FrameExtractionOptions) => Promise<void>;
  frames: string[];
  jobId: string | null;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  reset: () => void;
}

export function useVideoFrameExtraction(): UseVideoFrameExtractionReturn {
  const [frames, setFrames] = useState<string[]>([]);
  const [jobId, setJobId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractFrames = useCallback(async (file: File, options?: FrameExtractionOptions) => {
    setLoading(true);
    setError(null);
    setFrames([]);
    setJobId(null);

    try {
      const result = await videoFrameService.extractFrames(file, options);
      setFrames(result.frames);
      setJobId(result.jobId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract frames');
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setFrames([]);
    setJobId(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    extractFrames,
    frames,
    jobId,
    loading,
    error,
    clearError,
    reset,
  };
}

