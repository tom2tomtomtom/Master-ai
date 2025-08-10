'use client'

import { useEffect } from 'react';

export default function DebugLogger() {
  useEffect(() => {
    // Log all unhandled errors
    const handleError = (event: ErrorEvent) => {
      console.error('🚨 UNHANDLED ERROR:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
        stack: event.error?.stack,
        timestamp: new Date().toISOString()
      });
      
      // Store in window for debugging
      (window as any).lastUnhandledError = {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
        stack: event.error?.stack,
        timestamp: new Date().toISOString()
      };
    };

    // Log unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('🚨 UNHANDLED PROMISE REJECTION:', {
        reason: event.reason,
        promise: event.promise,
        timestamp: new Date().toISOString()
      });
      
      // Store in window for debugging
      (window as any).lastUnhandledRejection = {
        reason: event.reason,
        promise: event.promise,
        timestamp: new Date().toISOString()
      };
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Log successful mount
    console.log('🔧 Debug logger mounted successfully');

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return null;
}