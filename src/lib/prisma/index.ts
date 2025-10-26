/**
 * Prisma Logging Module
 *
 * Main export module for the Prisma logging system. This module provides
 * a comprehensive logging and monitoring solution for Prisma database
 * operations.
 *
 * Features:
 * - Automatic query logging with performance tracking
 * - Query argument sanitization to protect sensitive data
 * - Enhanced Prisma client with event listeners
 * - Database connection monitoring
 * - Query performance analysis and regression detection
 *
 * @module lib/prisma
 *
 * @example
 * ```ts
 * import {
 *   LoggedPrismaClient,
 *   prismaLoggingExtension,
 *   monitorDatabaseConnections,
 *   queryAnalyzer
 * } from '@/lib/prisma';
 *
 * // Create enhanced client
 * const prisma = new LoggedPrismaClient();
 *
 * // Or use extension with existing client
 * const prisma = new PrismaClient().$extends(prismaLoggingExtension);
 *
 * // Start monitoring
 * monitorDatabaseConnections(prisma);
 *
 * // Analyze performance
 * const stats = queryAnalyzer.getAllStats();
 * ```
 */

// Export types
export type { QueryMetadata } from './types';

// Export sanitization utilities
export { sanitizeArgs, sanitizeQuery } from './sanitizer';

// Export Prisma extension
export { prismaLoggingExtension } from './extension';

// Export enhanced client
export { LoggedPrismaClient } from './client';

// Export monitoring utilities
export { monitorDatabaseConnections } from './monitoring';

// Export performance analysis
export type { QueryStats } from './analyzer';
export { QueryPerformanceAnalyzer, queryAnalyzer } from './analyzer';
