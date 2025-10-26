/**
 * Minimal Certificate Template
 *
 * Clean, minimalist design with focus on content
 */

import PDFDocument from 'pdfkit';
import type { CertificateData } from '../types';

export async function generateMinimalTemplate(
  doc: PDFKit.PDFDocument,
  data: CertificateData
): Promise<void> {
  const pageWidth = doc.page.width;
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
