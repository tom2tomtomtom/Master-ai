/**
 * Legacy Performance Testing Export
 *
 * @deprecated This file is maintained for backward compatibility only.
 * Please import from '@/lib/performance-testing' instead.
 *
 * The performance testing system has been refactored into a modular structure:
 * - @/lib/performance-testing/types - Type definitions
 * - @/lib/performance-testing/benchmarker - Benchmark execution
 * - @/lib/performance-testing/simulators - Dashboard simulation utilities
 * - @/lib/performance-testing/test-data - Test data setup
 * - @/lib/performance-testing/reporter - Report generation and comparison
 * - @/lib/performance-testing - Main PerformanceTester class and singleton
 */

export {
  PerformanceTester,
  performanceTester,
  benchmarkOperation,
  simulateDashboardStats,
  simulateRecentActivity,
  setupTestData,
  generateRecommendations,
  printReport,
  compareReports,
} from './performance-testing';

export type {
  BenchmarkResult,
  PerformanceReport,
  PerformanceTestOptions,
} from './performance-testing';
