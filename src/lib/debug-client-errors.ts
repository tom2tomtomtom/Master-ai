// Client-Side Error Debugging Script
// Add this to your _app.tsx or layout.tsx temporarily

if (typeof window !== 'undefined') {
  // Capture all errors
  window.addEventListener('error', (event) => {
    console.error('🚨 Runtime Error:', {
      message: event.message,
      filename: event.filename,
      line: event.lineno,
      column: event.colno,
      error: event.error,
      stack: event.error?.stack
    });
    
    // Send to monitoring if available
    if (window.Sentry) {
      window.Sentry.captureException(event.error);
    }
  });

  // Capture unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('🚨 Unhandled Promise Rejection:', {
      reason: event.reason,
      promise: event.promise
    });
    
    // Send to monitoring if available
    if (window.Sentry) {
      window.Sentry.captureException(event.reason);
    }
  });

  // Log page visibility changes
  document.addEventListener('visibilitychange', () => {
    console.log('Page visibility:', document.visibilityState);
  });

  // Monitor React errors
  if (window.React) {
    const originalError = console.error;
    console.error = (...args) => {
      if (args[0]?.includes?.('React')) {
        console.log('🚨 React Error:', args);
      }
      originalError.apply(console, args);
    };
  }
}
