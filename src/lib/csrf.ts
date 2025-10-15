/**
 * CSRF Protection
 * Generates and validates CSRF tokens for form submissions
 */

import { generateToken } from './encryption';

const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_NAME = 'csrf_token';

/**
 * Generate CSRF token
 */
export function generateCsrfToken(): string {
  return generateToken(CSRF_TOKEN_LENGTH);
}

/**
 * Validate CSRF token
 */
export function validateCsrfToken(token: string, expectedToken: string): boolean {
  if (!token || !expectedToken) {
    return false;
  }

  // Constant-time comparison to prevent timing attacks
  if (token.length !== expectedToken.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ expectedToken.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Get CSRF token from cookies (client-side)
 */
export function getCsrfTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;

  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === CSRF_COOKIE_NAME) {
      return decodeURIComponent(value);
    }
  }

  return null;
}

/**
 * Set CSRF token in cookie (server-side)
 */
export function setCsrfTokenCookie(token: string): string {
  const maxAge = 60 * 60 * 24; // 24 hours
  return `${CSRF_COOKIE_NAME}=${encodeURIComponent(token)}; Max-Age=${maxAge}; Path=/; SameSite=Strict; Secure; HttpOnly`;
}

/**
 * Verify request origin (additional CSRF protection)
 */
export function verifyRequestOrigin(origin: string | null, host: string): boolean {
  if (!origin) return false;

  try {
    const originUrl = new URL(origin);
    const expectedHost = host.split(':')[0]; // Remove port if present
    const originHost = originUrl.hostname;

    return originHost === expectedHost || 
           originHost === `www.${expectedHost}` ||
           expectedHost === `www.${originHost}`;
  } catch {
    return false;
  }
}

/**
 * Check if request is from same origin
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');

  if (!origin || !host) {
    // If no origin header, it might be a same-origin request
    // Check referer as fallback
    const referer = request.headers.get('referer');
    if (referer) {
      try {
        const refererUrl = new URL(referer);
        return refererUrl.host === host;
      } catch {
        return false;
      }
    }
    return false;
  }

  return verifyRequestOrigin(origin, host);
}

