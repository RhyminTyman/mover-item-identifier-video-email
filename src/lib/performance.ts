/**
 * Performance optimization utilities
 * Includes caching, memoization, and performance monitoring
 */

import { logger } from './logger';

/**
 * Simple in-memory cache with TTL
 */
class SimpleCache {
  private cache: Map<string, { value: unknown; expires: number }> = new Map();
  private readonly defaultTTL: number;

  constructor(defaultTTLSeconds: number = 300) {
    this.defaultTTL = defaultTTLSeconds * 1000;
  }

  set(key: string, value: unknown, ttlSeconds?: number): void {
    const ttl = ttlSeconds ? ttlSeconds * 1000 : this.defaultTTL;
    const expires = Date.now() + ttl;
    this.cache.set(key, { value, expires });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }

    return item.value as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key);
      }
    }
  }
}

// Global cache instances
export const apiCache = new SimpleCache(300); // 5 minutes
export const queryCache = new SimpleCache(60); // 1 minute

// Cleanup expired cache entries every 5 minutes
if (typeof window === 'undefined') {
  setInterval(() => {
    apiCache.cleanup();
    queryCache.cleanup();
  }, 5 * 60 * 1000);
}

/**
 * Cache decorator for async functions
 */
export function cached<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  options: { ttl?: number; keyPrefix?: string } = {}
): T {
  return (async (...args: unknown[]) => {
    const key = `${options.keyPrefix || fn.name}:${JSON.stringify(args)}`;
    
    // Check cache
    const cached = apiCache.get(key);
    if (cached !== null) {
      return cached;
    }

    // Execute function
    const result = await fn(...args);
    
    // Store in cache
    apiCache.set(key, result, options.ttl);
    
    return result;
  }) as T;
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: unknown[]) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Measure function execution time
 */
export async function measurePerformance<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  
  try {
    const result = await fn();
    const duration = performance.now() - start;
    
    logger.debug(`Performance: ${name}`, {
      component: 'performance',
      operation: name,
      duration: Math.round(duration),
      unit: 'ms'
    });
    
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    logger.error(`Performance: ${name} failed`, error as Error, {
      component: 'performance',
      operation: name,
      duration: Math.round(duration),
      unit: 'ms'
    });
    throw error;
  }
}

/**
 * Batch multiple requests together
 */
export class RequestBatcher<T, R> {
  private queue: Array<{
    item: T;
    resolve: (value: R) => void;
    reject: (error: unknown) => void;
  }> = [];
  private timeout: NodeJS.Timeout | null = null;
  private readonly batchFn: (items: T[]) => Promise<R[]>;
  private readonly delay: number;
  private readonly maxBatchSize: number;

  constructor(
    batchFn: (items: T[]) => Promise<R[]>,
    options: { delay?: number; maxBatchSize?: number } = {}
  ) {
    this.batchFn = batchFn;
    this.delay = options.delay || 50;
    this.maxBatchSize = options.maxBatchSize || 100;
  }

  add(item: T): Promise<R> {
    return new Promise((resolve, reject) => {
      this.queue.push({ item, resolve, reject });

      if (this.queue.length >= this.maxBatchSize) {
        this.flush();
      } else if (!this.timeout) {
        this.timeout = setTimeout(() => this.flush(), this.delay);
      }
    });
  }

  private async flush(): Promise<void> {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }

    if (this.queue.length === 0) return;

    const batch = this.queue.splice(0, this.queue.length);
    const items = batch.map(b => b.item);

    try {
      const results = await this.batchFn(items);
      batch.forEach((b, i) => b.resolve(results[i]));
    } catch (error) {
      batch.forEach(b => b.reject(error));
    }
  }
}

/**
 * Lazy load component (for code splitting)
 */
export async function lazyLoad<T extends React.ComponentType<Record<string, unknown>>>(
  factory: () => Promise<{ default: T }>
): Promise<React.LazyExoticComponent<T>> {
  const React = await import('react');
  return React.lazy(factory);
}

/**
 * Preload images
 */
export function preloadImages(urls: string[]): Promise<void[]> {
  return Promise.all(
    urls.map(url => {
      return new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = url;
      });
    })
  );
}

/**
 * Optimize image URL (for Next.js Image component)
 */
export function optimizeImageUrl(url: string, width?: number, quality?: number): string {
  if (!url) return '';
  
  // If it's already a Next.js optimized URL, return as is
  if (url.includes('/_next/image')) return url;
  
  // Build optimization parameters
  const params = new URLSearchParams();
  params.set('url', url);
  if (width) params.set('w', width.toString());
  if (quality) params.set('q', quality.toString());
  
  return `/_next/image?${params.toString()}`;
}

/**
 * Check if user is on slow connection
 */
export function isSlowConnection(): boolean {
  if (typeof navigator === 'undefined' || !('connection' in navigator)) {
    return false;
  }

  const connection = (navigator as { connection?: { effectiveType?: string; saveData?: boolean } }).connection;
  return connection?.effectiveType === 'slow-2g' || 
         connection?.effectiveType === '2g' ||
         connection?.saveData === true;
}

/**
 * Adaptive loading based on network speed
 */
export function shouldLoadHighQuality(): boolean {
  return !isSlowConnection();
}

