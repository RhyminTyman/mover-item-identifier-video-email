import { neon } from '@neondatabase/serverless';
import { Pool } from '@neondatabase/serverless';

// Neon HTTP client for serverless environments (Vercel Edge Functions)
export const neonHttp = neon(process.env.DATABASE_URL!);

// Neon serverless client for Node.js environments
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Health check function
export async function checkNeonConnection() {
  try {
    const result = await neonHttp`SELECT 1 as test`;
    return { success: true, data: result };
  } catch (error) {
    console.error('Neon connection error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Graceful shutdown
export async function closeNeonConnections() {
  try {
    await pool.end();
    console.log('Neon connections closed gracefully');
  } catch (error) {
    console.error('Error closing Neon connections:', error);
  }
}

// Helper function to get the appropriate client based on environment
export function getNeonClient() {
  // Use HTTP client for Vercel Edge Functions
  if (process.env.VERCEL_ENV) {
    return neonHttp;
  }
  // Use pool for Node.js environments
  return pool;
}
