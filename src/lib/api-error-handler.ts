/**
 * API Error Handler
 * Standardizes error responses and logging across all API routes
 */

import { NextResponse } from 'next/server';
import { logger } from './logger';
import { sentry } from './sentry';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ErrorResponse {
  error: string;
  code?: string;
  details?: unknown;
  timestamp: string;
  path?: string;
}

/**
 * Handle API errors consistently
 */
export function handleApiError(
  error: unknown,
  path?: string,
  context?: Record<string, unknown>
): NextResponse<ErrorResponse> {
  // Log error
  logger.error('API Error', error as Error, {
    component: 'api',
    path,
    ...context
  });

  // Track in Sentry
  sentry.captureError(error as Error, {
    path,
    ...context
  });

  // Handle different error types
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        details: error.details,
        timestamp: new Date().toISOString(),
        path
      },
      { status: error.statusCode }
    );
  }

  // Prisma errors
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as { code: string; meta?: Record<string, unknown> };
    
    if (prismaError.code === 'P2002') {
      return NextResponse.json(
        {
          error: 'A record with this value already exists',
          code: 'DUPLICATE_RECORD',
          timestamp: new Date().toISOString(),
          path
        },
        { status: 409 }
      );
    }

    if (prismaError.code === 'P2025') {
      return NextResponse.json(
        {
          error: 'Record not found',
          code: 'NOT_FOUND',
          timestamp: new Date().toISOString(),
          path
        },
        { status: 404 }
      );
    }
  }

  // Generic error
  const message = error instanceof Error ? error.message : 'An unexpected error occurred';
  
  return NextResponse.json(
    {
      error: process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred' 
        : message,
      code: 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? error : undefined,
      timestamp: new Date().toISOString(),
      path
    },
    { status: 500 }
  );
}

/**
 * Wrap API route handler with error handling
 */
export function withErrorHandler<T extends (...args: unknown[]) => Promise<NextResponse>>(
  handler: T,
  path?: string
): T {
  return (async (...args: unknown[]) => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error, path);
    }
  }) as T;
}

/**
 * Common API errors
 */
export const ApiErrors = {
  Unauthorized: () => new ApiError(401, 'Unauthorized', 'UNAUTHORIZED'),
  Forbidden: (message = 'Forbidden') => new ApiError(403, message, 'FORBIDDEN'),
  NotFound: (resource = 'Resource') => new ApiError(404, `${resource} not found`, 'NOT_FOUND'),
  BadRequest: (message = 'Bad request') => new ApiError(400, message, 'BAD_REQUEST'),
  Conflict: (message = 'Conflict') => new ApiError(409, message, 'CONFLICT'),
  RateLimitExceeded: () => new ApiError(429, 'Rate limit exceeded', 'RATE_LIMIT'),
  InternalError: (message = 'Internal server error') => new ApiError(500, message, 'INTERNAL_ERROR'),
  ServiceUnavailable: (service: string) => new ApiError(503, `${service} is unavailable`, 'SERVICE_UNAVAILABLE'),
};

/**
 * Validate request body
 */
export function validateRequestBody<T>(
  body: unknown,
  requiredFields: (keyof T)[]
): asserts body is T {
  if (!body || typeof body !== 'object') {
    throw new ApiError(400, 'Request body is required', 'VALIDATION_ERROR');
  }
  
  const bodyObj = body as Record<string, unknown>;
  const missing = requiredFields.filter(field => !(String(field) in bodyObj) || bodyObj[String(field)] === undefined || bodyObj[String(field)] === null);
  
  if (missing.length > 0) {
    throw new ApiError(
      400,
      `Missing required fields: ${missing.join(', ')}`,
      'VALIDATION_ERROR',
      { missingFields: missing }
    );
  }
}

/**
 * Validate query parameters
 */
export function validateQueryParams(
  searchParams: URLSearchParams,
  requiredParams: string[]
): void {
  const missing = requiredParams.filter(param => !searchParams.has(param));
  
  if (missing.length > 0) {
    throw new ApiError(
      400,
      `Missing required query parameters: ${missing.join(', ')}`,
      'VALIDATION_ERROR',
      { missingParams: missing }
    );
  }
}

