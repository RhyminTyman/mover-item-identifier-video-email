/**
 * Input sanitization utilities
 * Prevents XSS, SQL injection, and other security vulnerabilities
 */

/**
 * Sanitize HTML to prevent XSS attacks
 */
export function sanitizeHtml(input: string): string {
  if (!input) return '';

  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize user input for database queries
 * Note: Prisma already handles SQL injection, but this adds extra safety
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';

  // Remove potentially dangerous characters
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .substring(0, 10000); // Limit length
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(email: string): string {
  if (!email) return '';

  const cleaned = email.toLowerCase().trim();
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleaned)) {
    throw new Error('Invalid email format');
  }

  return cleaned;
}

/**
 * Sanitize phone number
 */
export function sanitizePhone(phone: string): string {
  if (!phone) return '';

  // Remove all non-numeric characters except + and spaces
  return phone.replace(/[^\d+\s()-]/g, '').trim();
}

/**
 * Sanitize URL
 */
export function sanitizeUrl(url: string): string {
  if (!url) return '';

  try {
    const parsed = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Invalid URL protocol');
    }

    return parsed.toString();
  } catch {
    throw new Error('Invalid URL format');
  }
}

/**
 * Sanitize filename
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return '';

  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace special chars with underscore
    .replace(/\.{2,}/g, '.') // Remove multiple dots
    .replace(/^\./, '') // Remove leading dot
    .substring(0, 255); // Limit length
}

/**
 * Sanitize JSON input
 */
export function sanitizeJson<T>(input: unknown): T {
  if (!input) return input as T;

  // If it's a string, try to parse it
  if (typeof input === 'string') {
    try {
      input = JSON.parse(input);
    } catch {
      throw new Error('Invalid JSON format');
    }
  }

  // Recursively sanitize object values
  if (typeof input === 'object' && input !== null) {
    if (Array.isArray(input)) {
      return input.map(item => sanitizeJson(item)) as T;
    }

    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      if (typeof value === 'string') {
        sanitized[key] = sanitizeInput(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeJson(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized as T;
  }

  return input as T;
}

/**
 * Validate and sanitize pagination parameters
 */
export function sanitizePagination(page?: string | number, limit?: string | number): {
  page: number;
  limit: number;
  skip: number;
} {
  const sanitizedPage = Math.max(1, parseInt(String(page || 1)));
  const sanitizedLimit = Math.min(100, Math.max(1, parseInt(String(limit || 10))));
  const skip = (sanitizedPage - 1) * sanitizedLimit;

  return {
    page: sanitizedPage,
    limit: sanitizedLimit,
    skip
  };
}

/**
 * Sanitize search query
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query) return '';

  return query
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/[%_]/g, '\\$&') // Escape SQL wildcards
    .substring(0, 200); // Limit length
}

/**
 * Validate and sanitize sort parameters
 */
export function sanitizeSortParams(
  sortBy?: string,
  sortOrder?: string,
  allowedFields: string[] = []
): { sortBy: string; sortOrder: 'asc' | 'desc' } {
  const sanitizedSortBy = sortBy && allowedFields.includes(sortBy) 
    ? sortBy 
    : allowedFields[0] || 'createdAt';
  
  const sanitizedSortOrder = sortOrder?.toLowerCase() === 'desc' ? 'desc' : 'asc';

  return {
    sortBy: sanitizedSortBy,
    sortOrder: sanitizedSortOrder
  };
}

/**
 * Strip dangerous tags from HTML (allow only safe tags)
 */
export function stripDangerousTags(html: string): string {
  if (!html) return '';

  const allowedTags = ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'a', 'span'];
  const tagRegex = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;

  return html.replace(tagRegex, (match, tag) => {
    return allowedTags.includes(tag.toLowerCase()) ? match : '';
  });
}

/**
 * Sanitize object keys (prevent prototype pollution)
 */
export function sanitizeObjectKeys<T extends Record<string, unknown>>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj;

  const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (!dangerousKeys.includes(key)) {
      sanitized[key] = typeof value === 'object' && value !== null
        ? sanitizeObjectKeys(value as Record<string, unknown>)
        : value;
    }
  }

  return sanitized as T;
}

