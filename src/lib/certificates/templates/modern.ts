/**
 * Modern Certificate Template
 *
 * Clean, professional design with gradient header and decorative elements
 */

import PDFDocument from 'pdfkit';
import type { CertificateData } from '../types';

export async function generateModernTemplate(
  doc: PDFKit.PDFDocument,
  data: CertificateData
): Promise<void> {
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
