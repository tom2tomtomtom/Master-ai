/**
 * CertificationEngine - Legacy compatibility layer
 * 
 * This file now serves as a compatibility layer for the refactored certification engine.
 * The actual implementation has been moved to the ./certification-engine/ directory
 * for better maintainability and modularity.
 * 
 * MIGRATION GUIDE:
 * - Import from './certification-engine' instead of './certification-engine.ts'
 * - All functionality remains the same
 * - Types and interfaces are preserved
 */

// Re-export everything from the new modular system
export * from './certification-engine/index';
export { CertificationEngine, certificationEngine } from './certification-engine/index';