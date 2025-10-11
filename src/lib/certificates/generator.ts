/**
 * Certificate Generator Service
 *
 * Core service for generating professional PDF certificates
 * Handles certificate creation, storage, and database operations
 */

import { PrismaClient } from '@prisma/client';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { appLogger } from '@/lib/logger';
import type { CertificateData, TemplateType, CertificationType } from './types';
import { generateModernTemplate, generateClassicTemplate, generateMinimalTemplate } from './templates';

export class CertificateGenerator {
  private prisma: PrismaClient;
  private outputDir: string;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient();
    this.outputDir = path.join(process.cwd(), 'public', 'certificates');

    // Ensure output directory exists (server-side only)
    if (typeof window === 'undefined' && !fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Generate a professional PDF certificate
   */
  async generateCertificate(
    certificateData: CertificateData,
    templateType: TemplateType = 'modern'
  ): Promise<string> {
    try {
      const fileName = `certificate-${certificateData.verificationCode}.pdf`;
      const filePath = path.join(this.outputDir, fileName);

      // Create PDF document
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      // Stream to file
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Generate certificate based on template
      switch (templateType) {
        case 'modern':
          await generateModernTemplate(doc, certificateData);
          break;
        case 'classic':
          await generateClassicTemplate(doc, certificateData);
          break;
        case 'minimal':
          await generateMinimalTemplate(doc, certificateData);
          break;
        default:
          await generateModernTemplate(doc, certificateData);
      }

      // Finalize PDF
      doc.end();

      // Wait for stream to finish
      await new Promise<void>((resolve, reject) => {
        stream.on('finish', () => resolve());
        stream.on('error', reject);
      });

      return `/certificates/${fileName}`;
    } catch (error) {
      appLogger.error('Error generating certificate', { error });
      throw new Error('Failed to generate certificate');
    }
  }

  /**
   * Get certificate URL for a user certification
   */
  async getCertificateUrl(userCertificationId: string): Promise<string | null> {
    try {
      const userCert = await this.prisma.userCertification.findUnique({
        where: { id: userCertificationId },
      });

      if (!userCert || !userCert.certificateUrl) {
        return null;
      }

      return userCert.certificateUrl;
    } catch (error) {
      appLogger.error('Error getting certificate URL', { error });
      return null;
    }
  }

  /**
   * Update certificate URL in database
   */
  async updateCertificateUrl(userCertificationId: string, url: string): Promise<void> {
    try {
      await this.prisma.userCertification.update({
        where: { id: userCertificationId },
        data: { certificateUrl: url },
      });
    } catch (error) {
      appLogger.error('Error updating certificate URL', { error });
      throw new Error('Failed to update certificate URL');
    }
  }

  /**
   * Generate certificate for user certification
   */
  async generateUserCertificate(userCertificationId: string): Promise<string> {
    try {
      const userCert = await this.prisma.userCertification.findUnique({
        where: { id: userCertificationId },
        include: {
          user: { select: { name: true, email: true } },
          certification: true,
        },
      });

      if (!userCert) {
        throw new Error('User certification not found');
      }

      const certificateData: CertificateData = {
        userName: userCert.user.name || 'Unknown User',
        userEmail: userCert.user.email,
        certificationName: userCert.certification.name,
        certificationDescription: userCert.certification.description || undefined,
        earnedAt: userCert.earnedAt,
        verificationCode: userCert.verificationCode,
        expiresAt: userCert.expiresAt,
        completionStats: userCert.metadata as any,
      };

      // Determine template based on certification type
      const templateType = this.getTemplateForCertificationType(userCert.certification.type);

      const certificateUrl = await this.generateCertificate(certificateData, templateType);

      // Update the certificate URL in database
      await this.updateCertificateUrl(userCertificationId, certificateUrl);

      return certificateUrl;
    } catch (error) {
      appLogger.error('Error generating user certificate', { error });
      throw new Error('Failed to generate user certificate');
    }
  }

  private getTemplateForCertificationType(type: string): TemplateType {
    switch (type) {
      case 'professional':
        return 'classic';
      case 'tool_mastery':
      case 'path':
        return 'modern';
      default:
        return 'minimal';
    }
  }
}

// Singleton instance
export const certificateGenerator = new CertificateGenerator();
