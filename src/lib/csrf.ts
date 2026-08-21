/**
 * CSRF token helpers for the double-submit-cookie pattern.
 *
 * The primary CSRF defence in this app is the cross-origin check in
 * src/middleware.ts (plus Clerk's SameSite=Lax session cookie and the built-in
 * origin check on Server Actions). These helpers exist for flows that need an
 * explicit token as well.
 *
 * NOTE: this module imports node:crypto via ./encryption, so it cannot be used
 * from the edge middleware runtime - only from Node.js route handlers.
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
  // Deliberately NOT HttpOnly: the double-submit pattern requires client-side
  // script to read this value and echo it back in a request header, which is
  // exactly what getCsrfTokenFromCookie() above does. The previous version set
  // HttpOnly, so the reader could never see the cookie and validation could
  // never succeed. Confidentiality is not required here - the token's purpose
  // is to prove same-origin script access, and SameSite=Strict + Secure keep it
  // off cross-site requests.
  return `${CSRF_COOKIE_NAME}=${encodeURIComponent(token)}; Max-Age=${maxAge}; Path=/; SameSite=Strict; Secure`;
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

