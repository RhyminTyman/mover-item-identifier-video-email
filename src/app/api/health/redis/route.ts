import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function GET() {
  try {
    console.log('🔍 [HEALTH REDIS] Checking Redis connection...');
    
    // Test basic Redis operations
    const testKey = 'health-check';
    const testValue = 'ok';
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const timestamp = Date.now();
    
    // Set a test value
    await redis.set(testKey, testValue, { ex: 60 }); // Expire in 60 seconds
    
    // Get the test value
    const retrievedValue = await redis.get(testKey);
    
    // Test increment operation
    const counter = await redis.incr('health-check-counter');
    
    // Get Redis info
    const info = await redis.ping();
    
    if (retrievedValue === testValue) {
      console.log('✅ [HEALTH REDIS] Redis connection successful');
      return NextResponse.json({
        status: 'healthy',
        service: 'redis',
        connection: 'active',
        timestamp: new Date().toISOString(),
        operations: {
          set: 'success',
          get: 'success',
          increment: 'success',
          ping: info
        },
        counter: counter,
        testKey: testKey,
        testValue: retrievedValue
      });
    } else {
      console.error('❌ [HEALTH REDIS] Redis data mismatch');
      return NextResponse.json({
        status: 'unhealthy',
        service: 'redis',
        connection: 'data_mismatch',
        error: 'Retrieved value does not match expected value',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('❌ [HEALTH REDIS] Redis connection failed:', error);
    return NextResponse.json({
      status: 'unhealthy',
      service: 'redis',
      connection: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
