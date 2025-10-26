/**
 * Certificate Types and Interfaces
 *
 * Shared type definitions for certificate generation
 */

export interface CertificateData {
  userName: string;
  userEmail: string;
  certificationName: string;
  certificationDescription?: string;
  earnedAt: Date;
  verificationCode: string;
  expiresAt?: Date | null;
  completionStats?: {
    totalLessons?: number;
    totalTime?: number;
    completionDate?: Date;
  };
}

export interface CertificateTemplate {
  id: string;
  name: string;
  type: 'completion' | 'path' | 'tool_mastery' | 'professional';
  backgroundColor: string;
  primaryColor: string;
  secondaryColor: string;
  layout: 'modern' | 'classic' | 'minimal';
}

export type TemplateType = 'modern' | 'classic' | 'minimal';

export type CertificationType = 'completion' | 'path' | 'tool_mastery' | 'professional';
