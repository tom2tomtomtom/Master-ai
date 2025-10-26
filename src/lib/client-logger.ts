/**
 * Client-Side Logging Utility
 * 
 * This module provides client-side error logging and user activity tracking
 * that sends logs to the server-side logging infrastructure.
 */

// Browser detection
const isBrowser = typeof window !== 'undefined';

interface ClientLogData {
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  category: string;
  event: string;
  metadata?: Record<string, any>;
  timestamp?: string;
  url?: string;
  userAgent?: string;
  userId?: string;
  sessionId?: string;
}

interface ClientErrorData extends Omit<ClientLogData, 'level'> {
  error: {
    name: string;
    message: string;
    stack?: string;
  };
  context?: Record<string, any>;
}

/**
 * Client-side logger that sends logs to server endpoints
 */
class ClientLogger {
  private userId?: string;
  private sessionId: string;
  private baseUrl: string;
  private queue: Array<ClientLogData | ClientErrorData> = [];
  private flushInterval: number = 5000; // 5 seconds
  private maxQueueSize: number = 100;
  private isOnline: boolean = true;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.baseUrl = isBrowser ? window.location.origin : '';
    
    if (isBrowser) {
      this.setupBrowserLogging();
      this.startPeriodicFlush();
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupBrowserLogging() {
    // Track online/offline status
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushLogs();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Global error handler
    window.addEventListener('error', (event) => {
      this.logError('global_javascript_error', event.error || new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.logError('unhandled_promise_rejection', event.reason, {
        promise: 'Promise rejection'
      });
    });

    // Page visibility change tracking
    document.addEventListener('visibilitychange', () => {
      this.logEvent('user_activity', 'page_visibility_change', {
        visibilityState: document.visibilityState,
        hidden: document.hidden
      });
    });

    // Page performance tracking
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (perfData) {
          this.logPerformance('page_load', {
            loadTime: perfData.loadEventEnd - perfData.fetchStart,
            domContentLoaded: perfData.domContentLoadedEventEnd - perfData.fetchStart,
            firstPaint: this.getFirstPaint(),
            firstContentfulPaint: this.getFirstContentfulPaint()
          });
        }
      }, 0);
    });
  }

  private getFirstPaint(): number | null {
    const paintEntries = performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
    return firstPaint ? firstPaint.startTime : null;
  }

  private getFirstContentfulPaint(): number | null {
    const paintEntries = performance.getEntriesByType('paint');
    const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    return fcp ? fcp.startTime : null;
  }

  private startPeriodicFlush() {
    setInterval(() => {
      if (this.queue.length > 0) {
        this.flushLogs();
      }
    }, this.flushInterval);
  }

  /**
   * Set user context for logging
   */
  setUser(userId: string) {
    this.userId = userId;
  }

  /**
   * Log an error with context
   */
  logError(errorName: string, error: Error | string | unknown, context?: Record<string, any>) {
    const errorData: ClientErrorData = {
      category: 'error',
      event: errorName,
      message: 'Client error occurred',
      error: {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      context,
      timestamp: new Date().toISOString(),
      url: isBrowser ? window.location.href : undefined,
      userAgent: isBrowser ? navigator.userAgent : undefined,
      userId: this.userId,
      sessionId: this.sessionId
    };

    this.queueLog(errorData);
  }

  /**
   * Log a user activity event
   */
  logEvent(category: string, event: string, metadata?: Record<string, any>) {
    const logData: ClientLogData = {
      level: 'info',
      category,
      event,
      message: `${category}:${event}`,
      metadata,
      timestamp: new Date().toISOString(),
      url: isBrowser ? window.location.href : undefined,
      userAgent: isBrowser ? navigator.userAgent : undefined,
      userId: this.userId,
      sessionId: this.sessionId
    };

    this.queueLog(logData);
  }

  /**
   * Log performance metrics
   */
  logPerformance(metric: string, data: Record<string, any>) {
    this.logEvent('performance', metric, data);
  }

  /**
   * Log user interactions
   */
  logUserInteraction(interaction: string, element?: string, metadata?: Record<string, any>) {
    this.logEvent('user_interaction', interaction, {
      element,
      ...metadata
    });
  }

  /**
   * Log authentication events
   */
  logAuth(event: 'login' | 'logout' | 'signup' | 'password_reset', metadata?: Record<string, any>) {
    this.logEvent('authentication', event, metadata);
  }

  /**
   * Log page views
   */
  logPageView(path: string, metadata?: Record<string, any>) {
    this.logEvent('navigation', 'page_view', {
      path,
      referrer: isBrowser ? document.referrer : undefined,
      ...metadata
    });
  }

  /**
   * Log custom events
   */
  logCustom(level: 'error' | 'warn' | 'info' | 'debug', message: string, metadata?: Record<string, any>) {
    const logData: ClientLogData = {
      level,
      category: 'custom',
      event: 'custom_log',
      message,
      metadata,
      timestamp: new Date().toISOString(),
      url: isBrowser ? window.location.href : undefined,
      userAgent: isBrowser ? navigator.userAgent : undefined,
      userId: this.userId,
      sessionId: this.sessionId
    };

    this.queueLog(logData);
  }

  private queueLog(logData: ClientLogData | ClientErrorData) {
    this.queue.push(logData);

    // Flush immediately for errors or if queue is full
    if ('error' in logData || this.queue.length >= this.maxQueueSize) {
      this.flushLogs();
    }
  }

  private async flushLogs() {
    if (!this.isOnline || this.queue.length === 0) return;

    const logsToSend = this.queue.splice(0, this.maxQueueSize);
    
    try {
      const endpoint = 'error' in logsToSend[0] ? '/api/monitoring/errors' : '/api/monitoring/events';
      
      await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ logs: logsToSend })
      });
    } catch (error) {
      // If sending fails, put logs back in queue (but limit to prevent infinite growth)
      if (this.queue.length < this.maxQueueSize) {
        this.queue.unshift(...logsToSend.slice(0, this.maxQueueSize - this.queue.length));
      }
      
      console.warn('Failed to send logs to server:', error);
    }
  }

  /**
   * Manually flush all pending logs
   */
  flush() {
    return this.flushLogs();
  }
}

// Create singleton instance
export const clientLogger = new ClientLogger();

// Helper functions for common logging scenarios
export const logUserAction = (action: string, metadata?: Record<string, any>) => {
  clientLogger.logUserInteraction(action, undefined, metadata);
};

export const logError = (error: Error | string, context?: Record<string, any>) => {
  clientLogger.logError('application_error', error, context);
};

export const logPageView = (path?: string) => {
  const currentPath = path || (isBrowser ? window.location.pathname : '');
  clientLogger.logPageView(currentPath);
};

export const logPerformance = (metric: string, data: Record<string, any>) => {
  clientLogger.logPerformance(metric, data);
};

export const setUserId = (userId: string) => {
  clientLogger.setUser(userId);
};

// React Hook for easy integration
export const useClientLogger = () => {
  return {
    logError: clientLogger.logError.bind(clientLogger),
    logEvent: clientLogger.logEvent.bind(clientLogger),
    logUserInteraction: clientLogger.logUserInteraction.bind(clientLogger),
    logAuth: clientLogger.logAuth.bind(clientLogger),
    logPageView: clientLogger.logPageView.bind(clientLogger),
    logCustom: clientLogger.logCustom.bind(clientLogger),
    setUser: clientLogger.setUser.bind(clientLogger),
    flush: clientLogger.flush.bind(clientLogger)
  };
};

export default clientLogger;