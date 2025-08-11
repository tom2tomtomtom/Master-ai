/**
 * Certification Engine - Modular Architecture
 * 
 * Main entry point for the certification engine with clean exports
 */

import { PrismaClient } from '@prisma/client';
import { CertificationEngineService } from './service';

// Export types
export * from './types';

// Export services for advanced usage
export { CertificationEngineService } from './service';
export { CertificationEligibilityService } from './eligibility';
export { CertificationAwardsService } from './awards';
export { CertificationVerificationService } from './verification';

// Create and export main service class (maintains backward compatibility)
export class CertificationEngine extends CertificationEngineService {
  constructor(prisma?: PrismaClient) {
    super(prisma || new PrismaClient());
  }
}

// Singleton instance for backward compatibility
export const certificationEngine = new CertificationEngine();