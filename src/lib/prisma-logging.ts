/**
 * Prisma Logging Extension (Legacy Export)
 *
 * @deprecated This file is maintained for backward compatibility only.
 * Please import from the new modular structure instead:
 *
 * ```ts
 * // Old (deprecated):
 * import { LoggedPrismaClient } from '@/lib/prisma-logging';
 *
 * // New (recommended):
 * import { LoggedPrismaClient } from '@/lib/prisma';
 *
 * // Or import specific modules:
 * import { LoggedPrismaClient } from '@/lib/prisma/client';
 * import { prismaLoggingExtension } from '@/lib/prisma/extension';
 * import { queryAnalyzer } from '@/lib/prisma/analyzer';
 * ```
 *
 * The monolithic file has been refactored into a modular structure:
 * - `@/lib/prisma/types` - Type definitions (QueryMetadata)
 * - `@/lib/prisma/sanitizer` - Query sanitization utilities
 * - `@/lib/prisma/extension` - Prisma logging extension
 * - `@/lib/prisma/client` - LoggedPrismaClient class
 * - `@/lib/prisma/monitoring` - Database connection monitoring
 * - `@/lib/prisma/analyzer` - Query performance analysis
 * - `@/lib/prisma` - Main export module (use this for new code)
 *
 * All functionality remains identical, with no breaking changes.
 */

// Re-export everything from the new modular structure
export type { QueryMetadata } from './prisma/types';
export type { QueryStats } from './prisma/analyzer';

export { sanitizeArgs, sanitizeQuery } from './prisma/sanitizer';
export { prismaLoggingExtension } from './prisma/extension';
export { LoggedPrismaClient } from './prisma/client';
export { monitorDatabaseConnections } from './prisma/monitoring';
export { QueryPerformanceAnalyzer, queryAnalyzer } from './prisma/analyzer';
