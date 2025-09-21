import { Redis } from "@upstash/redis";
import { Item } from "@/types";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;

export interface AnalysisJob {
  id: string;
  userId: string;
  data: { base64Images: Array<{ name: string; dataUrl: string; type: 'image' | 'video'; roomName?: string | null }> };
  priority: number;
  createdAt: number;
  retries: number;
  maxRetries: number;
}

export interface QueueConfig {
  maxConcurrentJobs: number;
  retryDelayMs: number;
  maxRetries: number;
  rateLimitPerMinute: number;
}

const DEFAULT_CONFIG: QueueConfig = {
  maxConcurrentJobs: 3, // Process max 3 analysis jobs concurrently
  retryDelayMs: 5000, // 5 second delay between retries
  maxRetries: 3,
  rateLimitPerMinute: 15 // Max 15 requests per minute to OpenAI
};

class AnalysisQueue {
  private config: QueueConfig;
  private processing = new Set<string>();
  private isProcessing = false;

  constructor(config: Partial<QueueConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async addJob(job: Omit<AnalysisJob, 'id' | 'createdAt' | 'retries'>): Promise<string> {
    if (!redis) {
      throw new Error('Redis not configured');
    }

    const jobId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullJob: AnalysisJob = {
      ...job,
      id: jobId,
      createdAt: Date.now(),
      retries: 0
    };

    // Add job to queue with priority
    await redis.zadd('analysis_queue', { score: fullJob.priority, member: JSON.stringify(fullJob) });
    
    // Start processing if not already running
    if (!this.isProcessing) {
      this.startProcessing();
    }

    return jobId;
  }

  async getJobStatus(jobId: string): Promise<'pending' | 'processing' | 'completed' | 'failed' | 'not_found'> {
    if (!redis) return 'not_found';

    // Check if job is currently processing
    if (this.processing.has(jobId)) {
      return 'processing';
    }

    // Check if job is in queue
    const queueJobs = await redis.zrange('analysis_queue', 0, -1) as string[];
    const isInQueue = queueJobs.some(jobStr => {
      const job = JSON.parse(jobStr) as AnalysisJob;
      return job.id === jobId;
    });

    if (isInQueue) {
      return 'pending';
    }

    // Check if job is completed or failed
    const result = await redis.get(`analysis_result_${jobId}`) as string | null;
    if (result) {
      const parsed = JSON.parse(result);
      return parsed.success ? 'completed' : 'failed';
    }

    return 'not_found';
  }

  async getJobResult(jobId: string): Promise<{ items: Item[]; confidenceNote: string } | null> {
    if (!redis) return null;

    const result = await redis.get(`analysis_result_${jobId}`) as string | null;
    if (result) {
      const parsed = JSON.parse(result);
      return parsed.data;
    }

    return null;
  }

  private async startProcessing(): Promise<void> {
    if (this.isProcessing || !redis) return;

    this.isProcessing = true;
    console.log('🚀 Starting analysis queue processing...');

    while (this.isProcessing) {
      try {
        // Check rate limit
        const rateLimitKey = `openai_rate_limit_${Math.floor(Date.now() / 60000)}`;
        const currentRequests = (await redis.get(rateLimitKey) as number) || 0;
        
        if (currentRequests >= this.config.rateLimitPerMinute) {
          console.log('⏳ Rate limit reached, waiting...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }

        // Get next job from queue
        const jobs = await redis.zrange('analysis_queue', 0, this.config.maxConcurrentJobs - this.processing.size - 1) as string[];
        
        if (jobs.length === 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }

        // Process jobs concurrently
        const jobPromises = jobs.map(jobStr => this.processJob(JSON.parse(jobStr) as AnalysisJob));
        await Promise.allSettled(jobPromises);

      } catch (error) {
        console.error('❌ Error in queue processing:', error);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }

  private async processJob(job: AnalysisJob): Promise<void> {
    if (this.processing.has(job.id) || !redis) return;

    this.processing.add(job.id);
    
    try {
      console.log(`🔄 Processing analysis job ${job.id} (attempt ${job.retries + 1})`);
      
      // Remove job from queue
      await redis.zrem('analysis_queue', JSON.stringify(job));

      // Check rate limit before making OpenAI call
      const rateLimitKey = `openai_rate_limit_${Math.floor(Date.now() / 60000)}`;
      await redis.incr(rateLimitKey);
      await redis.expire(rateLimitKey, 60);

      // Make the actual analysis call
      const result = await this.performAnalysis(job.data);
      
      // Store successful result
      if (redis) {
        await redis.setex(`analysis_result_${job.id}`, 3600, JSON.stringify({
          success: true,
          data: result,
          completedAt: Date.now()
        }));
      }

      console.log(`✅ Analysis job ${job.id} completed successfully`);

    } catch (error) {
      console.error(`❌ Analysis job ${job.id} failed:`, error);
      
      // Check if we should retry
      if (job.retries < job.maxRetries) {
        const retryJob = {
          ...job,
          retries: job.retries + 1,
          priority: job.priority - 1 // Lower priority for retries
        };
        
        // Add back to queue with delay
        setTimeout(async () => {
          if (redis) {
            await redis.zadd('analysis_queue', { score: retryJob.priority, member: JSON.stringify(retryJob) });
          }
        }, this.config.retryDelayMs);
        
        console.log(`🔄 Retrying analysis job ${job.id} in ${this.config.retryDelayMs}ms`);
      } else {
        // Store failed result
        if (redis) {
          await redis.setex(`analysis_result_${job.id}`, 3600, JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            failedAt: Date.now()
          }));
        }
        
        console.log(`💀 Analysis job ${job.id} failed permanently after ${job.maxRetries} retries`);
      }
    } finally {
      this.processing.delete(job.id);
    }
  }

  private async performAnalysis(data: { base64Images: Array<{ name: string; dataUrl: string; type: 'image' | 'video'; roomName?: string | null }> }): Promise<{ items: Item[]; confidenceNote: string }> {
    // This is where we make the actual OpenAI API call
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Analysis API failed: ${response.status} ${errorText}`);
    }

    return await response.json();
  }

  async stopProcessing(): Promise<void> {
    this.isProcessing = false;
    console.log('🛑 Stopping analysis queue processing...');
  }

  async getQueueStats(): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  }> {
    if (!redis) {
      return { pending: 0, processing: 0, completed: 0, failed: 0 };
    }

    const pending = await redis.zcard('analysis_queue');
    const processing = this.processing.size;
    
    // Count completed and failed jobs (this is approximate)
    const completed = 0; // Would need to track this separately
    const failed = 0; // Would need to track this separately

    return { pending, processing, completed, failed };
  }
}

export const analysisQueue = new AnalysisQueue();
