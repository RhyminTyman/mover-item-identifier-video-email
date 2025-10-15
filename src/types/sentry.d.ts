/**
 * Type declarations for optional Sentry module
 * Allows the app to compile without Sentry installed
 */

declare module '@sentry/nextjs' {
  export function init(options: any): void;
  export function captureException(error: Error, options?: any): void;
  export function captureMessage(message: string, options?: any): void;
  export function setUser(user: any): void;
  export function addBreadcrumb(breadcrumb: any): void;
  export class BrowserTracing {
    constructor(options?: any);
  }
}

