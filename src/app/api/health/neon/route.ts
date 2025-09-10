import { NextResponse } from 'next/server';
import { checkNeonConnection } from '@/lib/neon';

export async function GET() {
  try {
    console.log('🔍 [HEALTH NEON] Checking Neon database connection...');
    
    const result = await checkNeonConnection();
    
    if (result.success) {
      console.log('✅ [HEALTH NEON] Neon database connection successful');
      return NextResponse.json({
        status: 'healthy',
        database: 'neon',
        connection: 'active',
        timestamp: new Date().toISOString(),
        data: result.data
      });
    } else {
      console.error('❌ [HEALTH NEON] Neon database connection failed:', result.error);
      return NextResponse.json({
        status: 'unhealthy',
        database: 'neon',
        connection: 'failed',
        error: result.error,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
  } catch (error) {
    console.error('❌ [HEALTH NEON] Unexpected error:', error);
    return NextResponse.json({
      status: 'error',
      database: 'neon',
      connection: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
