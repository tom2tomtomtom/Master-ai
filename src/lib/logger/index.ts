/**
 * Logger System - Modular Architecture with Full Backward Compatibility
 * 
 * This maintains 100% backward compatibility with the original logger.ts file
 * while providing a cleaner, more maintainable structure.
 */

import { createWinstonLogger } from './config';
import { StructuredLogger, EnhancedPerformanceTimer } from './structured-logger';

// Export utilities for advanced usage
export * from './utils';
export * from './config';
export { StructuredLogger } from './structured-logger';

// Create the logger instances exactly as before
const logger = createWinstonLogger();
const appLogger = new StructuredLogger(logger);

// Export everything exactly as the original file did for backward compatibility
export { logger as winstonLogger };
export { appLogger };

// Export utility functions exactly as before
export {
  generateRequestId,
  setRequestContext,
  getRequestContext,
  clearRequestContext,
  extractRequestMetadata,
  createTimer
} from './utils';

// Enhanced timer that can integrate with logger
export function createTimerWithLogger(operation: string): EnhancedPerformanceTimer {
  return new EnhancedPerformanceTimer(operation, appLogger);
}

// Legacy export for PerformanceTimer class (backward compatibility)
export { PerformanceTimer } from './utils';