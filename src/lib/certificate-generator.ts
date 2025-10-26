/**
 * Certificate Generator - Legacy Export
 *
 * This file maintains backward compatibility by re-exporting
 * from the refactored certificates module.
 *
 * @deprecated Import from '@/lib/certificates/generator' instead
 */

export {
  CertificateGenerator,
  certificateGenerator,
} from './certificates/generator';

export type {
  CertificateData,
  CertificateTemplate,
  TemplateType,
  CertificationType,
} from './certificates/types';
