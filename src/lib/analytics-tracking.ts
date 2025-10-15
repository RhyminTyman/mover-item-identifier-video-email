/**
 * Analytics tracking utility
 * Supports multiple analytics providers (PostHog, Google Analytics, etc.)
 */

import { logger } from './logger';

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  userId?: string;
  timestamp?: string;
}

class Analytics {
  private enabled: boolean;
  private userId: string | null = null;

  constructor() {
    this.enabled = typeof window !== 'undefined' && process.env.NODE_ENV === 'production';
  }

  /**
   * Initialize analytics
   */
  init(): void {
    if (!this.enabled) return;

    // TODO: Initialize PostHog, Google Analytics, etc.
    // Example:
    // if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    //   posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    //     api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST
    //   });
    // }

    logger.info('Analytics initialized', { component: 'analytics' });
  }

  /**
   * Identify user
   */
  identify(userId: string, traits?: Record<string, any>): void {
    if (!this.enabled) return;

    this.userId = userId;

    logger.analytics('User identified', {
      userId,
      traits
    });

    // TODO: Send to analytics provider
    // posthog.identify(userId, traits);
  }

  /**
   * Track event
   */
  track(eventName: string, properties?: Record<string, any>): void {
    if (!this.enabled) return;

    const event: AnalyticsEvent = {
      name: eventName,
      properties,
      userId: this.userId || undefined,
      timestamp: new Date().toISOString()
    };

    logger.analytics(eventName, properties);

    // TODO: Send to analytics provider
    // posthog.capture(eventName, properties);
  }

  /**
   * Track page view
   */
  page(pageName: string, properties?: Record<string, any>): void {
    this.track('Page View', {
      page: pageName,
      ...properties
    });
  }

  /**
   * Track user action
   */
  action(actionName: string, properties?: Record<string, any>): void {
    this.track('User Action', {
      action: actionName,
      ...properties
    });
  }

  /**
   * Reset analytics (on logout)
   */
  reset(): void {
    if (!this.enabled) return;

    this.userId = null;

    // TODO: Reset analytics provider
    // posthog.reset();
  }
}

// Singleton instance
export const analytics = new Analytics();

// Common event tracking functions
export const trackEvent = {
  // User events
  userSignUp: (userId: string, method: string) => {
    analytics.track('User Sign Up', { userId, method });
  },

  userSignIn: (userId: string, method: string) => {
    analytics.track('User Sign In', { userId, method });
  },

  userSignOut: (userId: string) => {
    analytics.track('User Sign Out', { userId });
  },

  // Inventory events
  inventoryCreated: (inventoryId: string, itemCount: number) => {
    analytics.track('Inventory Created', { inventoryId, itemCount });
  },

  inventoryAnalyzed: (inventoryId: string, imageCount: number, duration: number) => {
    analytics.track('Inventory Analyzed', { inventoryId, imageCount, duration });
  },

  inventoryExported: (inventoryId: string, format: 'pdf' | 'excel' | 'csv') => {
    analytics.track('Inventory Exported', { inventoryId, format });
  },

  // Quote events
  quoteRequested: (quoteId: string, companyId: string, totalCost: number) => {
    analytics.track('Quote Requested', { quoteId, companyId, totalCost });
  },

  quoteAccepted: (quoteId: string, totalCost: number) => {
    analytics.track('Quote Accepted', { quoteId, totalCost });
  },

  quoteRejected: (quoteId: string, reason?: string) => {
    analytics.track('Quote Rejected', { quoteId, reason });
  },

  // Company events
  companyRegistered: (companyId: string, companyName: string) => {
    analytics.track('Company Registered', { companyId, companyName });
  },

  crmIntegrated: (companyId: string, provider: string) => {
    analytics.track('CRM Integrated', { companyId, provider });
  },

  // Feature usage
  featureUsed: (featureName: string, details?: Record<string, any>) => {
    analytics.track('Feature Used', { feature: featureName, ...details });
  },

  // Errors
  errorOccurred: (errorType: string, errorMessage: string, context?: Record<string, any>) => {
    analytics.track('Error Occurred', { errorType, errorMessage, ...context });
  },

  // Performance
  slowPerformance: (operation: string, duration: number) => {
    analytics.track('Slow Performance', { operation, duration });
  }
};

// Initialize analytics on import (client-side only)
if (typeof window !== 'undefined') {
  analytics.init();
}
