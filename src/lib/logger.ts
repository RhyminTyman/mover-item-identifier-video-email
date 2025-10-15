/**
 * Production-grade logging utility
 * Provides structured logging with different levels and context
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

interface LogContext {
  [key: string]: string | number | boolean | Record<string, unknown> | undefined;
  userId?: string;
  requestId?: string;
  component?: string;
  action?: string;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
}

class Logger {
  private isDevelopment: boolean;
  private isProduction: boolean;
  private minLevel: LogLevel;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isProduction = process.env.NODE_ENV === 'production';
    this.minLevel = this.isProduction ? 'info' : 'debug';
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error', 'fatal'];
    const minLevelIndex = levels.indexOf(this.minLevel);
    const currentLevelIndex = levels.indexOf(level);
    return currentLevelIndex >= minLevelIndex;
  }

  private formatEntry(level: LogLevel, message: string, context?: LogContext, error?: Error): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context
    };

    if (error) {
      entry.error = {
        message: error.message,
        stack: this.isProduction ? undefined : error.stack,
        code: (error as { code?: string }).code
      };
    }

    return entry;
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    if (!this.shouldLog(level)) return;

    const entry = this.formatEntry(level, message, context, error);

    if (this.isDevelopment) {
      // Pretty print in development
      const emoji = {
        debug: '🔍',
        info: 'ℹ️',
        warn: '⚠️',
        error: '❌',
        fatal: '💀'
      }[level];

      console.log(`${emoji} [${level.toUpperCase()}] ${message}`);
      
      if (context) {
        console.log('Context:', context);
      }
      
      if (error) {
        console.error(error);
      }
    } else {
      // Structured JSON in production for log aggregation
      const logFn = level === 'error' || level === 'fatal' ? console.error : console.log;
      logFn(JSON.stringify(entry));

      // TODO: Send to external logging service (Sentry, Datadog, etc.)
      // this.sendToLoggingService(entry);
    }
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.log('error', message, context, error);
  }

  fatal(message: string, error?: Error, context?: LogContext): void {
    this.log('fatal', message, context, error);
  }

  // Convenience methods for common logging scenarios
  api(method: string, path: string, status: number, duration: number, context?: LogContext): void {
    this.info(`API ${method} ${path} ${status}`, {
      ...context,
      method,
      path,
      status,
      duration,
      component: 'api'
    });
  }

  auth(action: string, userId?: string, success: boolean = true, context?: LogContext): void {
    const level = success ? 'info' : 'warn';
    this.log(level, `Auth ${action}: ${success ? 'success' : 'failed'}`, {
      ...context,
      userId,
      action,
      success,
      component: 'auth'
    });
  }

  database(operation: string, table: string, duration: number, context?: LogContext): void {
    this.debug(`DB ${operation} on ${table}`, {
      ...context,
      operation,
      table,
      duration,
      component: 'database'
    });
  }

  analytics(event: string, properties?: Record<string, unknown>, context?: LogContext): void {
    this.info(`Analytics: ${event}`, {
      ...context,
      event,
      properties,
      component: 'analytics'
    });
  }
}

// Singleton instance
export const logger = new Logger();

// Export for testing or custom instances
export { Logger };
export type { LogLevel, LogContext, LogEntry };

