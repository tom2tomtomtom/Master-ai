/**
 * BackgroundJobs - Legacy compatibility layer
 * 
 * This file now serves as a compatibility layer for the refactored background jobs system.
 * The actual implementation has been moved to the ./background-jobs/ directory
 * for better maintainability and modularity.
 * 
 * MIGRATION GUIDE:
 * - Import from './background-jobs' instead of './background-jobs.ts'
 * - All functionality remains the same
 * - Types and interfaces are preserved
 */

// Re-export everything from the new modular system
export * from './background-jobs/index';
export { 
  BackgroundJobSystem, 
  backgroundJobSystem, 
  runBackgroundJobs, 
  updateAllUserStats 
} from './background-jobs/index';