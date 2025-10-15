/**
 * Rate Limit Configuration
 * Centralized rate limiting rules for different API endpoints
 */

export interface RateLimitRule {
  points: number;      // Number of requests allowed
  windowSec: number;   // Time window in seconds
  cost?: number;       // Cost per request (default: 1)
}

/**
 * Rate limit rules for different endpoint types
 */
export const rateLimitRules = {
  // Authentication endpoints
  auth: {
    signIn: { points: 5, windowSec: 300 },      // 5 attempts per 5 minutes
    signUp: { points: 3, windowSec: 3600 },     // 3 attempts per hour
    passwordReset: { points: 3, windowSec: 3600 } // 3 attempts per hour
  },

  // Analysis endpoints
  analysis: {
    analyze: { points: 12, windowSec: 60 },     // 12 requests per minute
    queued: { points: 20, windowSec: 60 },      // 20 requests per minute
    video: { points: 5, windowSec: 300 }        // 5 videos per 5 minutes
  },

  // Data export endpoints
  export: {
    data: { points: 5, windowSec: 3600 },       // 5 exports per hour
    pdf: { points: 20, windowSec: 300 },        // 20 PDFs per 5 minutes
    excel: { points: 20, windowSec: 300 }       // 20 Excel files per 5 minutes
  },

  // Quote endpoints
  quotes: {
    submit: { points: 10, windowSec: 3600 },    // 10 quotes per hour
    create: { points: 30, windowSec: 3600 },    // 30 quotes per hour (company admin)
    update: { points: 50, windowSec: 3600 }     // 50 updates per hour
  },

  // Upload endpoints
  upload: {
    image: { points: 30, windowSec: 300 },      // 30 images per 5 minutes
    video: { points: 5, windowSec: 600 }        // 5 videos per 10 minutes
  },

  // Admin endpoints
  admin: {
    users: { points: 100, windowSec: 60 },      // 100 requests per minute
    companies: { points: 100, windowSec: 60 },  // 100 requests per minute
    settings: { points: 50, windowSec: 60 }     // 50 requests per minute
  },

  // Public endpoints
  public: {
    health: { points: 60, windowSec: 60 },      // 60 requests per minute
    companies: { points: 30, windowSec: 60 }    // 30 requests per minute
  },

  // Default for unspecified endpoints
  default: { points: 30, windowSec: 60 }        // 30 requests per minute
};

/**
 * Get rate limit rule for an endpoint
 */
export function getRateLimitRule(category: string, endpoint: string): RateLimitRule {
  const categoryRules = rateLimitRules[category as keyof typeof rateLimitRules];
  
  if (categoryRules && typeof categoryRules === 'object') {
    const rule = categoryRules[endpoint as keyof typeof categoryRules];
    if (rule) return rule as RateLimitRule;
  }

  return rateLimitRules.default;
}

/**
 * Get rate limit key for a request
 */
export function getRateLimitKey(
  endpoint: string,
  identifier: string,
  category?: string
): string {
  const prefix = category || 'api';
  return `${prefix}:${endpoint}:${identifier}`;
}

/**
 * Calculate retry-after header value
 */
export function getRetryAfter(windowSec: number, usedPoints: number, maxPoints: number): number {
  if (usedPoints >= maxPoints) {
    return windowSec;
  }
  return 0;
}

/**
 * Format rate limit headers
 */
export function getRateLimitHeaders(
  limit: number,
  remaining: number,
  reset: number
): Record<string, string> {
  return {
    'X-RateLimit-Limit': limit.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': reset.toString(),
  };
}

/**
 * Check if IP is whitelisted (for internal services)
 */
export function isWhitelistedIp(ip: string): boolean {
  const whitelist = [
    '127.0.0.1',
    'localhost',
    '::1'
  ];

  return whitelist.includes(ip);
}

/**
 * Get client identifier from request
 */
export function getClientIdentifier(request: Request, userId?: string): string {
  // Prefer userId if available
  if (userId) return userId;

  // Fall back to IP address
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  
  return ip;
}

