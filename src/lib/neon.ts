import { neon } from '@neondatabase/serverless';
import { Pool } from '@neondatabase/serverless';

// Lazy initialization to avoid errors during build when DATABASE_URL is not available
let neonHttp: ReturnType<typeof neon> | null = null;
let pool: Pool | null = null;

// Get Neon HTTP client for serverless environments (Vercel Edge Functions)
export function getNeonHttp() {
  if (!neonHttp) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    neonHttp = neon(process.env.DATABASE_URL);
  }
  return neonHttp;
}

// Get Neon serverless client for Node.js environments
export function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }
  return pool;
}

// Health check function
export async function checkNeonConnection() {
  try {
    if (!process.env.DATABASE_URL) {
      return { success: false, error: 'DATABASE_URL environment variable is not set' };
    }
    
    const client = getNeonHttp();
    const result = await client`SELECT 1 as test`;
    return { success: true, data: result };
  } catch (error) {
    console.error('Neon connection error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Graceful shutdown
export async function closeNeonConnections() {
  try {
    if (pool) {
      await pool.end();
      console.log('Neon connections closed gracefully');
    }
  } catch (error) {
    console.error('Error closing Neon connections:', error);
  }
}

// Helper function to get the appropriate client based on environment
export function getNeonClient() {
  // Use HTTP client for Vercel Edge Functions
  if (process.env.VERCEL_ENV) {
    return getNeonHttp();
  }
  // Use pool for Node.js environments
  return getPool();
}
