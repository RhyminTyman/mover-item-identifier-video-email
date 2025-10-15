/**
 * Sentry error tracking integration
 * Captures and reports errors to Sentry for monitoring
 */

interface SentryConfig {
  dsn: string;
  environment: string;
  tracesSampleRate: number;
  enabled: boolean;
}

class SentryClient {
  private config: SentryConfig;
  private initialized: boolean = false;

  constructor() {
    this.config = {
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || '',
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN
    };
  }

  async init(): Promise<void> {
    if (this.initialized || !this.config.enabled) {
      return;
    }

    try {
      // Dynamic import to avoid loading Sentry if not installed
      const Sentry = await import('@sentry/nextjs').catch(() => null);
      
      if (!Sentry) {
        console.log('ℹ️  Sentry not installed - error tracking disabled');
        return;
      }
      
      Sentry.init({
        dsn: this.config.dsn,
        environment: this.config.environment,
        tracesSampleRate: this.config.tracesSampleRate,
        
        // Performance monitoring
        integrations: [
          new Sentry.BrowserTracing({
            tracePropagationTargets: ['localhost', /^https:\/\/.*\.vercel\.app/],
          }),
        ],

        // Filter out sensitive data
        beforeSend(event: { request?: { cookies?: unknown; headers?: Record<string, unknown> } }) {
          // Remove sensitive data from error reports
          if (event.request) {
            delete event.request.cookies;
            if (event.request.headers) {
              delete event.request.headers['authorization'];
              delete event.request.headers['cookie'];
            }
          }
          return event;
        },

        // Ignore certain errors
        ignoreErrors: [
          'ResizeObserver loop limit exceeded',
          'Non-Error promise rejection captured',
          'Network request failed',
          'Failed to fetch',
        ],
      });

      this.initialized = true;
      console.log('✅ Sentry initialized');
    } catch (error) {
      console.error('Failed to initialize Sentry:', error);
    }
  }

  captureError(error: Error, context?: Record<string, unknown>): void {
    if (!this.config.enabled) {
      console.error('Error (Sentry disabled):', error, context);
      return;
    }

    import('@sentry/nextjs').then(Sentry => {
      if (Sentry) {
        Sentry.captureException(error, {
          extra: context
        });
      }
    }).catch(() => {
      console.error('Sentry not available:', error, context);
    });
  }

  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: Record<string, unknown>): void {
    if (!this.config.enabled) {
      console.log(`Message (Sentry disabled) [${level}]:`, message, context);
      return;
    }

    import('@sentry/nextjs').then(Sentry => {
      if (Sentry) {
        Sentry.captureMessage(message, {
          level,
          extra: context
        });
      }
    }).catch(() => {
      console.log('Sentry not available:', message, context);
    });
  }

  setUser(user: { id: string; email?: string; username?: string }): void {
    if (!this.config.enabled) return;

    import('@sentry/nextjs').then(Sentry => {
      if (Sentry) {
        Sentry.setUser(user);
      }
    }).catch(() => {});
  }

  clearUser(): void {
    if (!this.config.enabled) return;

    import('@sentry/nextjs').then(Sentry => {
      if (Sentry) {
        Sentry.setUser(null);
      }
    }).catch(() => {});
  }

  addBreadcrumb(message: string, category: string, data?: Record<string, unknown>): void {
    if (!this.config.enabled) return;

    import('@sentry/nextjs').then(Sentry => {
      if (Sentry) {
        Sentry.addBreadcrumb({
          message,
          category,
          data,
          level: 'info'
        });
      }
    }).catch(() => {});
  }
}

// Singleton instance
export const sentry = new SentryClient();

// Auto-initialize in browser
if (typeof window !== 'undefined') {
  sentry.init();
}

// Helper function to wrap async operations with error tracking
export async function withErrorTracking<T>(
  operation: () => Promise<T>,
  context?: Record<string, unknown>
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    sentry.captureError(error as Error, context);
    throw error;
  }
}

