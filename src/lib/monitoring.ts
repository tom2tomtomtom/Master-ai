/**
 * Monitoring and Error Tracking Configuration
 * 
 * This module provides centralized error tracking, performance monitoring,
 * and analytics configuration for the production application.
 */

// Type definitions for monitoring events
export interface MonitoringEvent {
  type: 'error' | 'performance' | 'user_action' | 'business_metric';
  name: string;
  data?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  timestamp?: Date;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'percent';
  tags?: Record<string, string>;
}

/**
 * Initialize monitoring services
 * This should be called in the app root (_app.tsx or layout.tsx)
 */
export function initializeMonitoring() {
  if (typeof window === 'undefined') return;

  // Initialize Sentry for error tracking
  initializeSentry();
  
  // Initialize PostHog for user analytics (if configured)
  initializePostHog();
  
  // Set up performance monitoring
  setupPerformanceMonitoring();
  
  // Set up unhandled error tracking
  setupGlobalErrorHandling();
}

/**
 * Sentry Error Tracking Setup
 */
function initializeSentry() {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
    console.warn('Sentry DSN not configured - error tracking disabled');
    return;
  }

  // Temporarily disabled to fix webpack module loading issues
  console.log('Sentry initialization temporarily disabled');
  return;

  // Dynamic import to avoid bundling Sentry in development
  import('@sentry/nextjs').then((Sentry) => {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      
      // Performance monitoring
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      
      // Release tracking
      release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      
      // Error filtering
      beforeSend(event) {
        // Filter out development errors
        if (process.env.NODE_ENV === 'development') {
          return null;
        }
        
        // Filter out known non-critical errors
        if (event.exception) {
          const error = event.exception.values?.[0];
          if (error?.type === 'ChunkLoadError' || 
              error?.type === 'ResizeObserver loop limit exceeded') {
            return null;
          }
        }
        
        return event;
      },
      
      // Remove problematic integrations for now
    });

    // Set user context when available
    if (typeof window !== 'undefined' && window.localStorage) {
      const userId = window.localStorage.getItem('userId');
      if (userId) {
        Sentry.setUser({ id: userId });
      }
    }
  }).catch((error) => {
    console.warn('Failed to initialize Sentry:', error);
  });
}

/**
 * PostHog Analytics Setup
 */
function initializePostHog() {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    console.warn('PostHog key not configured - user analytics disabled');
    return;
  }

  // Dynamic import to avoid bundling PostHog if not needed
  import('posthog-js').then(({ default: posthog }) => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
      
      // Privacy settings
      capture_pageview: true,
      capture_pageleave: true,
      
      // Development settings
      loaded: (posthog) => {
        if (process.env.NODE_ENV === 'development') {
          posthog.debug(true);
        }
      },
    });
  }).catch((error) => {
    console.warn('Failed to initialize PostHog:', error);
  });
}

/**
 * Performance Monitoring Setup
 */
function setupPerformanceMonitoring() {
  if (typeof window === 'undefined') return;

  // Web vitals tracking temporarily disabled for build compatibility
  console.log('Web vitals tracking disabled during debugging');

  // Track custom performance metrics
  setupCustomPerformanceTracking();
}

function _onPerfEntry(metric: any) {
  // Send to monitoring service
  reportPerformanceMetric({
    name: metric.name,
    value: (metric as any).value || 0,
    unit: 'ms',
    tags: {
      id: (metric as any).id || 'unknown',
      navigationType: (metric as any).navigationType || 'unknown',
    },
  });
}

function setupCustomPerformanceTracking() {
  // Track page load performance
  window.addEventListener('load', () => {
    const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (perfData) {
      reportPerformanceMetric({
        name: 'page_load_time',
        value: perfData.loadEventEnd - perfData.fetchStart,
        unit: 'ms',
      });
    }
  });

  // Track resource loading
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'resource') {
        const resource = entry as PerformanceResourceTiming;
        if (resource.duration > 1000) { // Only track slow resources
          reportPerformanceMetric({
            name: 'slow_resource_load',
            value: resource.duration,
            unit: 'ms',
            tags: {
              url: resource.name,
              type: resource.initiatorType,
            },
          });
        }
      }
    }
  });

  if ('observe' in observer) {
    observer.observe({ entryTypes: ['resource'] });
  }
}

/**
 * Global Error Handling
 */
function setupGlobalErrorHandling() {
  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logError('unhandled_promise_rejection', event.reason, {
      promise: event.promise,
    });
  });

  // Catch global JavaScript errors
  window.addEventListener('error', (event) => {
    logError('global_javascript_error', event.error, {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });
}

/**
 * Public API for logging errors
 */
export function logError(
  errorName: string, 
  error: Error | string | unknown, 
  context?: Record<string, any>
) {
  const errorData = {
    name: errorName,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    context,
    timestamp: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error logged:', errorData);
  }

  // Send to Sentry
  if (typeof window !== 'undefined' && (window as any).Sentry) {
    (window as any).Sentry.captureException(error, {
      tags: { errorName },
      extra: context,
    });
  }

  // Send to custom error tracking endpoint
  if (typeof window !== 'undefined') {
    fetch('/api/monitoring/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorData),
    }).catch(() => {
      // Silently fail - we don't want error logging to cause more errors
    });
  }
}

/**
 * Public API for tracking user events
 */
export function trackEvent(event: MonitoringEvent) {
  const eventData = {
    ...event,
    timestamp: event.timestamp || new Date(),
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Event tracked:', eventData);
  }

  // Send to PostHog
  if (typeof window !== 'undefined' && (window as any).posthog) {
    (window as any).posthog.capture(event.name, event.data);
  }

  // Send to custom analytics endpoint
  if (typeof window !== 'undefined') {
    fetch('/api/monitoring/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData),
    }).catch(() => {
      // Silently fail
    });
  }
}

/**
 * Public API for reporting performance metrics
 */
export function reportPerformanceMetric(metric: PerformanceMetric) {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Performance metric:', metric);
  }

  // Send to monitoring service
  if (typeof window !== 'undefined') {
    fetch('/api/monitoring/performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...metric,
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => {
      // Silently fail
    });
  }
}

/**
 * Business Metrics Tracking
 */
export function trackBusinessMetric(name: string, value: number, metadata?: Record<string, any>) {
  trackEvent({
    type: 'business_metric',
    name,
    data: {
      value,
      ...metadata,
    },
  });
}

// Convenient exports for common tracking scenarios
export const monitoring = {
  // Error tracking
  logError,
  
  // Event tracking
  trackEvent,
  trackUserSignup: (userId: string) => trackEvent({
    type: 'user_action',
    name: 'user_signup',
    userId,
  }),
  trackLessonCompleted: (userId: string, lessonId: string) => trackEvent({
    type: 'user_action',
    name: 'lesson_completed',
    userId,
    data: { lessonId },
  }),
  trackSubscriptionUpgrade: (userId: string, tier: string) => trackEvent({
    type: 'business_metric',
    name: 'subscription_upgrade',
    userId,
    data: { tier },
  }),
  
  // Performance tracking
  reportPerformanceMetric,
  
  // Business metrics
  trackBusinessMetric,
};