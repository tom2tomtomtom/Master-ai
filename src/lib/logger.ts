/**
 * Comprehensive Structured Logging System - Backward Compatibility Layer
 * 
 * This file maintains 100% backward compatibility with the original logger implementation.
 * The actual implementation has been modularized into the ./logger/ directory for better
 * maintainability while preserving all existing functionality and exports.
 * 
 * IMPORTANT: This is critical infrastructure - all existing imports and usage
 * patterns continue to work exactly as before.
 * 
 * MIGRATION GUIDE (OPTIONAL):
 * - You can continue using this file exactly as before
 * - For new code, consider importing from './logger' for cleaner organization
 * - All functionality, types, and interfaces are preserved
 */

// Re-export everything from the new modular system to maintain backward compatibility
export * from './logger/index';

// Explicitly export the main instances to ensure they're available
export { appLogger, winstonLogger, PerformanceTimer, createTimer } from './logger/index';