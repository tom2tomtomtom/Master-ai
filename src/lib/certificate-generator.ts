/**
 * CertificateGenerator - Service for generating professional PDF certificates
 * 
 * This service handles:
 * - Creating professional PDF certificates with templates
 * - Dynamic content insertion (names, dates, verification codes)
 * - Secure certificate storage and retrieval
 * - Multiple certificate templates for different types
 * - Professional design matching Master-AI branding
 */

import { PrismaClient } from '@prisma/client';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

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

export class CertificateGenerator {
  private prisma: PrismaClient;
  private outputDir: string;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient();
    this.outputDir = path.join(process.cwd(), 'public', 'certificates');
    
    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Generate a professional PDF certificate
   */
  async generateCertificate(
    certificateData: CertificateData,
    templateType: string = 'modern'
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
          await this.generateModernTemplate(doc, certificateData);
          break;
        case 'classic':
          await this.generateClassicTemplate(doc, certificateData);
          break;
        case 'minimal':
          await this.generateMinimalTemplate(doc, certificateData);
          break;
        default:
          await this.generateModernTemplate(doc, certificateData);
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
      console.error('Error generating certificate:', error);
      throw new Error('Failed to generate certificate');
    }
  }

  /**
   * Generate modern template certificate
   */
  private async generateModernTemplate(doc: PDFKit.PDFDocument, data: CertificateData): Promise<void> {
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const centerX = pageWidth / 2;

    // Background gradient effect
    doc.save()
       .fillColor('#f8fafc')
       .rect(0, 0, pageWidth, pageHeight)
       .fill();

    // Add decorative header border
    doc.save()
       .fillColor('#3b82f6')
       .rect(0, 0, pageWidth, 20)
       .fill();

    doc.save()
       .fillColor('#1e40af')
       .rect(0, pageHeight - 20, pageWidth, 20)
       .fill();

    // Master-AI Logo and Header
    doc.fontSize(28)
       .fillColor('#1e293b')
       .font('Helvetica-Bold')
       .text('MASTER-AI', centerX, 80, { align: 'center' });

    doc.fontSize(16)
       .fillColor('#64748b')
       .font('Helvetica')
       .text('Professional AI Education Platform', centerX, 115, { align: 'center' });

    // Certificate Title
    doc.fontSize(36)
       .fillColor('#1e40af')
       .font('Helvetica-Bold')
       .text('CERTIFICATE OF COMPLETION', centerX, 180, { align: 'center' });

    // Decorative line
    doc.save()
       .strokeColor('#3b82f6')
       .lineWidth(2)
       .moveTo(centerX - 150, 230)
       .lineTo(centerX + 150, 230)
       .stroke();

    // Certification statement
    doc.fontSize(18)
       .fillColor('#374151')
       .font('Helvetica')
       .text('This is to certify that', centerX, 260, { align: 'center' });

    // User name (prominent)
    doc.fontSize(32)
       .fillColor('#1e293b')
       .font('Helvetica-Bold')
       .text(data.userName, centerX, 290, { align: 'center' });

    // Completion statement
    doc.fontSize(18)
       .fillColor('#374151')
       .font('Helvetica')
       .text('has successfully completed', centerX, 340, { align: 'center' });

    // Certification name
    doc.fontSize(24)
       .fillColor('#1e40af')
       .font('Helvetica-Bold')
       .text(data.certificationName, centerX, 370, { align: 'center' });

    // Description if provided
    if (data.certificationDescription) {
      doc.fontSize(14)
         .fillColor('#6b7280')
         .font('Helvetica')
         .text(data.certificationDescription, centerX, 410, { 
           align: 'center',
           width: 500,
         });
    }

    // Date and verification info
    const dateStr = data.earnedAt.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    doc.fontSize(14)
       .fillColor('#374151')
       .font('Helvetica')
       .text(`Completed on ${dateStr}`, centerX, 460, { align: 'center' });

    // Verification code
    doc.fontSize(12)
       .fillColor('#6b7280')
       .font('Helvetica-Bold')
       .text(`Verification Code: ${data.verificationCode}`, centerX, 485, { align: 'center' });

    // Verification URL
    doc.fontSize(10)
       .fillColor('#3b82f6')
       .font('Helvetica')
       .text(`Verify at: https://master-ai.com/verify/${data.verificationCode}`, 
              centerX, 505, { align: 'center' });

    // Footer signature area
    const leftSigX = centerX - 150;
    const rightSigX = centerX + 50;
    const sigY = 550;

    // Signature lines
    doc.save()
       .strokeColor('#d1d5db')
       .lineWidth(1)
       .moveTo(leftSigX, sigY)
       .lineTo(leftSigX + 100, sigY)
       .stroke();

    doc.save()
       .strokeColor('#d1d5db')
       .lineWidth(1)
       .moveTo(rightSigX, sigY)
       .lineTo(rightSigX + 100, sigY)
       .stroke();

    // Signature labels
    doc.fontSize(10)
       .fillColor('#6b7280')
       .font('Helvetica')
       .text('Platform Director', leftSigX, sigY + 10, { width: 100, align: 'center' })
       .text('Date Issued', rightSigX, sigY + 10, { width: 100, align: 'center' });

    // Add completion stats if available
    if (data.completionStats) {
      const statsY = 470;
      let statsText = '';
      
      if (data.completionStats.totalLessons) {
        statsText += `${data.completionStats.totalLessons} lessons completed`;
      }
      
      if (data.completionStats.totalTime) {
        if (statsText) statsText += ' • ';
        const hours = Math.round(data.completionStats.totalTime / 60);
        statsText += `${hours} hours of study`;
      }

      if (statsText) {
        doc.fontSize(12)
           .fillColor('#6b7280')
           .font('Helvetica')
           .text(statsText, centerX, statsY, { align: 'center' });
      }
    }
  }

  /**
   * Generate classic template certificate
   */
  private async generateClassicTemplate(doc: PDFKit.PDFDocument, data: CertificateData): Promise<void> {
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const centerX = pageWidth / 2;

    // Classic border
    doc.save()
       .strokeColor('#8b5cf6')
       .lineWidth(5)
       .rect(30, 30, pageWidth - 60, pageHeight - 60)
       .stroke();

    doc.save()
       .strokeColor('#a78bfa')
       .lineWidth(2)
       .rect(40, 40, pageWidth - 80, pageHeight - 80)
       .stroke();

    // Classic header
    doc.fontSize(24)
       .fillColor('#4c1d95')
       .font('Helvetica-Bold')
       .text('MASTER-AI ACADEMY', centerX, 90, { align: 'center' });

    // Certificate title with decorative elements
    doc.fontSize(32)
       .fillColor('#6d28d9')
       .font('Helvetica-Bold')
       .text('CERTIFICATE', centerX, 140, { align: 'center' });

    doc.fontSize(20)
       .fillColor('#7c3aed')
       .font('Helvetica')
       .text('of Achievement', centerX, 180, { align: 'center' });

    // Traditional wording
    doc.fontSize(16)
       .fillColor('#374151')
       .font('Helvetica')
       .text('This certifies that', centerX, 230, { align: 'center' });

    // Recipient name with underline
    doc.fontSize(28)
       .fillColor('#1f2937')
       .font('Helvetica-Bold')
       .text(data.userName, centerX, 260, { align: 'center' });

    // Underline for name
    doc.save()
       .strokeColor('#d1d5db')
       .lineWidth(1.5)
       .moveTo(centerX - 200, 295)
       .lineTo(centerX + 200, 295)
       .stroke();

    // Achievement text
    doc.fontSize(16)
       .fillColor('#374151')
       .font('Helvetica')
       .text('has demonstrated mastery in', centerX, 320, { align: 'center' });

    doc.fontSize(22)
       .fillColor('#6d28d9')
       .font('Helvetica-Bold')
       .text(data.certificationName, centerX, 350, { align: 'center' });

    // Date with classical styling
    const dateStr = data.earnedAt.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    doc.fontSize(14)
       .fillColor('#374151')
       .font('Helvetica')
       .text(`Given this ${dateStr}`, centerX, 420, { align: 'center' });

    // Verification in classical style
    doc.fontSize(11)
       .fillColor('#6b7280')
       .font('Helvetica')
       .text(`Certificate ID: ${data.verificationCode}`, centerX, 450, { align: 'center' });
  }

  /**
   * Generate minimal template certificate
   */
  private async generateMinimalTemplate(doc: PDFKit.PDFDocument, data: CertificateData): Promise<void> {
    const pageWidth = doc.page.width;
    const _pageHeight = doc.page.height;
    const centerX = pageWidth / 2;

    // Clean, minimal design with lots of white space
    doc.fontSize(18)
       .fillColor('#1f2937')
       .font('Helvetica-Bold')
       .text('MASTER-AI', centerX, 120, { align: 'center' });

    // Simple line separator
    doc.save()
       .strokeColor('#e5e7eb')
       .lineWidth(1)
       .moveTo(centerX - 100, 150)
       .lineTo(centerX + 100, 150)
       .stroke();

    // Certificate statement
    doc.fontSize(16)
       .fillColor('#6b7280')
       .font('Helvetica')
       .text('Certificate of Completion', centerX, 180, { align: 'center' });

    // User name
    doc.fontSize(32)
       .fillColor('#111827')
       .font('Helvetica-Bold')
       .text(data.userName, centerX, 220, { align: 'center' });

    // Certification name
    doc.fontSize(20)
       .fillColor('#374151')
       .font('Helvetica')
       .text(data.certificationName, centerX, 270, { align: 'center' });

    // Date
    const dateStr = data.earnedAt.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric', 
    });

    doc.fontSize(14)
       .fillColor('#9ca3af')
       .font('Helvetica')
       .text(dateStr, centerX, 320, { align: 'center' });

    // Minimal verification
    doc.fontSize(10)
       .fillColor('#d1d5db')
       .font('Helvetica')
       .text(data.verificationCode, centerX, 400, { align: 'center' });
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
      console.error('Error getting certificate URL:', error);
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
      console.error('Error updating certificate URL:', error);
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
      console.error('Error generating user certificate:', error);
      throw new Error('Failed to generate user certificate');
    }
  }

  private getTemplateForCertificationType(type: string): string {
    switch (type) {
      case 'professional':
        return 'classic';
      case 'tool_mastery':
        return 'modern';
      case 'path':
        return 'modern';
      default:
        return 'minimal';
    }
  }
}

// Singleton instance
export const certificateGenerator = new CertificateGenerator();