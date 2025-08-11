/**
 * Certification Engine Types and Interfaces
 * 
 * Centralized type definitions for the certification system
 */

export interface CertificationRequirement {
  type: 'lessons' | 'paths' | 'time' | 'score' | 'streak' | 'prerequisites';
  value: any;
  operator?: 'gte' | 'lte' | 'eq' | 'in';
}

export interface CertificationEligibility {
  isEligible: boolean;
  missingRequirements: string[];
  progress: Record<string, any>;
  nextActions: string[];
}

export interface CertificationAward {
  certificateId: string;
  verificationCode: string;
  verificationHash: string;
  metadata: Record<string, any>;
  expiresAt?: Date;
}

export interface RequirementCheckResult {
  satisfied: boolean;
  description: string;
  action: string;
  progress: any;
}

export interface CertificationVerificationResult {
  isValid: boolean;
  certification?: any;
  user?: { name: string | null; email: string };
  earnedAt?: Date;
  expiresAt?: Date | null;
  isExpired?: boolean;
}

export interface EligibilityCheckResults {
  eligible: string[];
  pending: Array<{ id: string; requirements: string[] }>;
}