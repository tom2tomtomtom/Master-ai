/**
 * AchievementSystem - Legacy compatibility layer
 * 
 * This file now serves as a compatibility layer for the refactored achievement system.
 * The actual implementation has been moved to the ./achievement-system/ directory
 * for better maintainability and modularity.
 * 
 * MIGRATION GUIDE:
 * - Import from './achievement-system' instead of './achievement-system.ts'
 * - All functionality remains the same
 * - Types and interfaces are preserved
 */

// Re-export everything from the new modular system
export * from './achievement-system/index';
export { AchievementSystem, achievementSystem } from './achievement-system/index';