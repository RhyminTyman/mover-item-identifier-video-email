/**
 * Type declarations for optional Sentry module
 * Allows the app to compile without Sentry installed
 */

declare module '@sentry/nextjs' {
  export function init(options: Record<string, unknown>): void;
  export function captureException(error: Error, options?: Record<string, unknown>): void;
  export function captureMessage(message: string, options?: Record<string, unknown>): void;
  export function setUser(user: Record<string, unknown> | null): void;
  export function addBreadcrumb(breadcrumb: Record<string, unknown>): void;
  export class BrowserTracing {
    constructor(options?: Record<string, unknown>);
  }
}

