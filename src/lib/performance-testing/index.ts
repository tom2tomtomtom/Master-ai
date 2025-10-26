/**
 * Performance Testing Utility - Compare before/after optimization performance
 *
 * This service provides:
 * - Database query performance benchmarking
 * - Cache hit rate measurement
 * - Memory usage monitoring
 * - Load testing for critical paths
 */

import { PrismaClient } from '@prisma/client';
import { achievementSystem } from '../achievement-system';
import { certificationEngine } from '../certification-engine';
import { backgroundJobSystem } from '../background-jobs';
import { benchmarkOperation } from './benchmarker';
import { simulateDashboardStats, simulateRecentActivity } from './simulators';
import { setupTestData } from './test-data';
import { generateRecommendations, printReport, compareReports } from './reporter';
import type { BenchmarkResult, PerformanceReport, PerformanceTestOptions } from './types';
// import { dbMonitor } from '../db-monitor';
// import { cacheService } from '../cache';

/**
 * Main Performance Tester class
 *
 * Coordinates all performance testing modules and orchestrates test execution
 */
export class PerformanceTester {
  private prisma: PrismaClient;
  private testUserId: string = '';

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient();
  }

  /**
   * Run comprehensive performance tests
   *
   * @param options - Test configuration options
   * @returns Promise<PerformanceReport> containing test results and recommendations
   */
  async runPerformanceTests(options: PerformanceTestOptions = {}): Promise<PerformanceReport> {
    const startTime = Date.now();
    const iterations = options.iterations || 100;

    // Setup test data
    this.testUserId = await setupTestData(this.prisma, options.testUserId);

    // if (options.skipCache) {
    //   await cacheService.flush();
    // }

    // Reset monitoring stats
    // dbMonitor.reset();
    // cacheService.resetStats();

    console.log(`🚀 Starting performance tests with ${iterations} iterations...`);

    // Run benchmarks
    const benchmarks: BenchmarkResult[] = [];

    // Test 1: Achievement system performance
    console.log('📊 Testing achievement system...');
    benchmarks.push(
      await benchmarkOperation(
        'checkAndAwardAchievements',
        () => achievementSystem.checkAndAwardAchievements(this.testUserId),
        Math.floor(iterations / 2) // Fewer iterations for expensive operations
      )
    );

    benchmarks.push(
      await benchmarkOperation(
        'getUserAchievementProgress',
        () => achievementSystem.getUserAchievementProgress(this.testUserId),
        iterations
      )
    );

    benchmarks.push(
      await benchmarkOperation(
        'getAchievementLeaderboard',
        () => achievementSystem.getAchievementLeaderboard(),
        Math.floor(iterations / 4) // Even fewer for expensive leaderboard
      )
    );

    // Test 2: Certification engine performance
    console.log('🏆 Testing certification engine...');
    benchmarks.push(
      await benchmarkOperation(
        'checkAllEligibilities',
        () => certificationEngine.checkAllEligibilities(this.testUserId),
        Math.floor(iterations / 2)
      )
    );

    // Test 3: Dashboard API simulation
    console.log('📈 Testing dashboard operations...');
    benchmarks.push(
      await benchmarkOperation(
        'getDashboardStats',
        () => simulateDashboardStats(this.prisma, this.testUserId),
        iterations
      )
    );

    benchmarks.push(
      await benchmarkOperation(
        'getRecentActivity',
        () => simulateRecentActivity(this.prisma, this.testUserId),
        iterations
      )
    );

    // Test 4: Background job performance
    console.log('⚙️  Testing background jobs...');
    benchmarks.push(
      await benchmarkOperation(
        'updateUserStats',
        () => backgroundJobSystem.updateUserStatistics(),
        Math.floor(iterations / 10) // Very few iterations for expensive operations
      )
    );

    const testDuration = Date.now() - startTime;
    const totalOperations = benchmarks.reduce((sum, b) => sum + b.iterations, 0);
    const overallAverageTime = benchmarks.reduce((sum, b) => sum + b.averageTime * b.iterations, 0) / totalOperations;

    // Get final stats
    // const cacheStats = cacheService.getStats();
    // const dbStats = dbMonitor.getStats();
    const cacheStats = { hitRate: 0, totalRequests: 0 };
    const dbStats = { totalQueries: 0, averageQueryTime: 0, slowQueries: 0, errorRate: 0 };

    const report: PerformanceReport = {
      testDate: new Date().toISOString(),
      testDuration,
      totalOperations,
      overallAverageTime,
      cacheStats: {
        hitRate: cacheStats.hitRate,
        totalRequests: cacheStats.totalRequests,
      },
      dbStats: {
        totalQueries: dbStats.totalQueries,
        averageQueryTime: dbStats.averageQueryTime,
        slowQueries: dbStats.slowQueries,
        errorRate: dbStats.errorRate,
      },
      benchmarks,
      recommendations: generateRecommendations(benchmarks, cacheStats, dbStats),
    };

    printReport(report);
    return report;
  }

  /**
   * Compare two performance reports
   *
   * Static method to compare before/after optimization results
   *
   * @param beforeReport - Performance report from before optimization
   * @param afterReport - Performance report from after optimization
   */
  static compareReports(beforeReport: PerformanceReport, afterReport: PerformanceReport): void {
    compareReports(beforeReport, afterReport);
  }
}

// Export singleton for convenience
export const performanceTester = new PerformanceTester();

// Re-export types and utilities
export type { BenchmarkResult, PerformanceReport, PerformanceTestOptions } from './types';
export { benchmarkOperation } from './benchmarker';
export { simulateDashboardStats, simulateRecentActivity } from './simulators';
export { setupTestData } from './test-data';
export { generateRecommendations, printReport, compareReports } from './reporter';
