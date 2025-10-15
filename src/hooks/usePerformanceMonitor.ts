/**
 * Performance monitoring hook
 * Tracks component render times and reports slow renders
 */

import { useEffect, useRef } from 'react';
import { logger } from '@/lib/logger';

interface PerformanceMetrics {
  componentName: string;
  renderTime: number;
  mountTime: number;
  updateCount: number;
}

/**
 * Monitor component performance
 */
export function usePerformanceMonitor(componentName: string, threshold: number = 100) {
  const renderCount = useRef(0);
  const mountTime = useRef<number>(0);
  const lastRenderTime = useRef<number>(0);

  // Track mount time
  useEffect(() => {
    mountTime.current = performance.now();
    
    return () => {
      const totalTime = performance.now() - mountTime.current;
      
      if (totalTime > threshold) {
        logger.warn(`Slow component unmount: ${componentName}`, {
          component: 'performance',
          componentName,
          totalTime: Math.round(totalTime),
          renderCount: renderCount.current
        });
      }
    };
  }, []);

  // Track render time
  useEffect(() => {
    renderCount.current++;
    const renderTime = performance.now() - lastRenderTime.current;
    lastRenderTime.current = performance.now();

    if (renderTime > threshold && renderCount.current > 1) {
      logger.warn(`Slow render: ${componentName}`, {
        component: 'performance',
        componentName,
        renderTime: Math.round(renderTime),
        renderCount: renderCount.current
      });
    }
  });

  return {
    renderCount: renderCount.current,
    logMetrics: () => {
      const totalTime = performance.now() - mountTime.current;
      logger.debug(`Component metrics: ${componentName}`, {
        component: 'performance',
        componentName,
        totalTime: Math.round(totalTime),
        renderCount: renderCount.current,
        avgRenderTime: Math.round(totalTime / renderCount.current)
      });
    }
  };
}

/**
 * Monitor API call performance
 */
export function useApiPerformance() {
  const measureApiCall = async <T,>(
    name: string,
    apiCall: () => Promise<T>
  ): Promise<T> => {
    const start = performance.now();
    
    try {
      const result = await apiCall();
      const duration = performance.now() - start;
      
      logger.api('API', name, 200, Math.round(duration));
      
      if (duration > 3000) {
        logger.warn(`Slow API call: ${name}`, {
          component: 'performance',
          api: name,
          duration: Math.round(duration)
        });
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      logger.error(`API call failed: ${name}`, error as Error, {
        component: 'performance',
        api: name,
        duration: Math.round(duration)
      });
      throw error;
    }
  };

  return { measureApiCall };
}

/**
 * Monitor page load performance
 */
export function usePageLoadPerformance(pageName: string) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Wait for page to fully load
    const measurePageLoad = () => {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (perfData) {
        const metrics = {
          dns: Math.round(perfData.domainLookupEnd - perfData.domainLookupStart),
          tcp: Math.round(perfData.connectEnd - perfData.connectStart),
          request: Math.round(perfData.responseStart - perfData.requestStart),
          response: Math.round(perfData.responseEnd - perfData.responseStart),
          dom: Math.round(perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart),
          load: Math.round(perfData.loadEventEnd - perfData.loadEventStart),
          total: Math.round(perfData.loadEventEnd - perfData.fetchStart)
        };

        logger.info(`Page load: ${pageName}`, {
          component: 'performance',
          page: pageName,
          ...metrics
        });

        // Warn on slow page loads
        if (metrics.total > 5000) {
          logger.warn(`Slow page load: ${pageName}`, {
            component: 'performance',
            page: pageName,
            totalTime: metrics.total
          });
        }
      }
    };

    // Measure after page is fully loaded
    if (document.readyState === 'complete') {
      measurePageLoad();
    } else {
      window.addEventListener('load', measurePageLoad);
      return () => window.removeEventListener('load', measurePageLoad);
    }
  }, [pageName]);
}

/**
 * Monitor memory usage (browser only)
 */
export function useMemoryMonitor(componentName: string, interval: number = 60000) {
  useEffect(() => {
    if (typeof window === 'undefined' || !(performance as any).memory) {
      return;
    }

    const checkMemory = () => {
      const memory = (performance as any).memory;
      const usedMB = Math.round(memory.usedJSHeapSize / 1048576);
      const totalMB = Math.round(memory.totalJSHeapSize / 1048576);
      const limitMB = Math.round(memory.jsHeapSizeLimit / 1048576);

      logger.debug(`Memory usage: ${componentName}`, {
        component: 'performance',
        componentName,
        usedMB,
        totalMB,
        limitMB,
        usagePercent: Math.round((usedMB / limitMB) * 100)
      });

      // Warn on high memory usage
      if (usedMB / limitMB > 0.9) {
        logger.warn(`High memory usage: ${componentName}`, {
          component: 'performance',
          componentName,
          usedMB,
          limitMB
        });
      }
    };

    const intervalId = setInterval(checkMemory, interval);
    return () => clearInterval(intervalId);
  }, [componentName, interval]);
}

