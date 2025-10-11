/**
 * Classic Certificate Template
 *
 * Traditional design with decorative borders and formal styling
 */

import PDFDocument from 'pdfkit';
import type { CertificateData } from '../types';

export async function generateClassicTemplate(
  doc: PDFKit.PDFDocument,
  data: CertificateData
): Promise<void> {
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
