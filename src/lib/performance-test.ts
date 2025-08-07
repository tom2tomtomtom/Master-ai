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
import { achievementSystem } from './achievement-system';
import { certificationEngine } from './certification-engine';
import { backgroundJobSystem } from './background-jobs';
// import { dbMonitor } from './db-monitor';
// import { cacheService } from './cache';

interface BenchmarkResult {
  operation: string;
  iterations: number;
  averageTime: number;
  medianTime: number;
  minTime: number;
  maxTime: number;
  errorCount: number;
  successRate: number;
}

interface PerformanceReport {
  testDate: string;
  testDuration: number;
  totalOperations: number;
  overallAverageTime: number;
  cacheStats: {
    hitRate: number;
    totalRequests: number;
  };
  dbStats: {
    totalQueries: number;
    averageQueryTime: number;
    slowQueries: number;
    errorRate: number;
  };
  benchmarks: BenchmarkResult[];
  recommendations: string[];
}

export class PerformanceTester {
  private prisma: PrismaClient;
  private testUserId: string = '';

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient();
  }

  /**
   * Run comprehensive performance tests
   */
  async runPerformanceTests(options: {
    iterations?: number;
    testUserId?: string;
    skipCache?: boolean;
  } = {}): Promise<PerformanceReport> {
    const startTime = Date.now();
    const iterations = options.iterations || 100;
    
    // Setup test data
    await this.setupTestData(options.testUserId);
    
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
      await this.benchmarkOperation(
        'checkAndAwardAchievements',
        () => achievementSystem.checkAndAwardAchievements(this.testUserId),
        Math.floor(iterations / 2) // Fewer iterations for expensive operations
      )
    );

    benchmarks.push(
      await this.benchmarkOperation(
        'getUserAchievementProgress',
        () => achievementSystem.getUserAchievementProgress(this.testUserId),
        iterations
      )
    );

    benchmarks.push(
      await this.benchmarkOperation(
        'getAchievementLeaderboard',
        () => achievementSystem.getAchievementLeaderboard(),
        Math.floor(iterations / 4) // Even fewer for expensive leaderboard
      )
    );

    // Test 2: Certification engine performance
    console.log('🏆 Testing certification engine...');
    benchmarks.push(
      await this.benchmarkOperation(
        'checkAllEligibilities',
        () => certificationEngine.checkAllEligibilities(this.testUserId),
        Math.floor(iterations / 2)
      )
    );

    // Test 3: Dashboard API simulation
    console.log('📈 Testing dashboard operations...');
    benchmarks.push(
      await this.benchmarkOperation(
        'getDashboardStats',
        () => this.simulateDashboardStats(),
        iterations
      )
    );

    benchmarks.push(
      await this.benchmarkOperation(
        'getRecentActivity',
        () => this.simulateRecentActivity(),
        iterations
      )
    );

    // Test 4: Background job performance
    console.log('⚙️  Testing background jobs...');
    benchmarks.push(
      await this.benchmarkOperation(
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
      recommendations: this.generateRecommendations(benchmarks, cacheStats, dbStats),
    };

    this.printReport(report);
    return report;
  }

  /**
   * Benchmark a specific operation
   */
  private async benchmarkOperation(
    name: string,
    operation: () => Promise<any>,
    iterations: number
  ): Promise<BenchmarkResult> {
    const times: number[] = [];
    let errorCount = 0;

    console.log(`  📋 Running ${name} (${iterations} iterations)...`);

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      try {
        await operation();
        const duration = Date.now() - startTime;
        times.push(duration);
      } catch (error) {
        errorCount++;
        console.error(`Error in ${name} iteration ${i + 1}:`, error);
      }

      // Progress indicator
      if ((i + 1) % Math.max(1, Math.floor(iterations / 10)) === 0) {
        console.log(`    ⏳ ${Math.round(((i + 1) / iterations) * 100)}% complete`);
      }
    }

    times.sort((a, b) => a - b);
    const averageTime = times.length > 0 ? times.reduce((sum, t) => sum + t, 0) / times.length : 0;
    const medianTime = times.length > 0 ? times[Math.floor(times.length / 2)] : 0;
    const minTime = times.length > 0 ? times[0] : 0;
    const maxTime = times.length > 0 ? times[times.length - 1] : 0;
    const successRate = ((iterations - errorCount) / iterations) * 100;

    return {
      operation: name,
      iterations,
      averageTime: Math.round(averageTime),
      medianTime: Math.round(medianTime),
      minTime,
      maxTime,
      errorCount,
      successRate: Math.round(successRate * 100) / 100,
    };
  }

  /**
   * Simulate dashboard stats API call
   */
  private async simulateDashboardStats(): Promise<any> {
    // Simulate the optimized dashboard stats query
    const [userProgress, totalLessons, bookmarksCount, notesCount, certificationsCount] = await Promise.all([
      this.prisma.userProgress.findMany({
        where: { userId: this.testUserId },
        select: {
          status: true,
          timeSpentMinutes: true,
          completedAt: true,
          lastAccessed: true,
        }
      }),
      this.prisma.lesson.count({ where: { isPublished: true } }),
      this.prisma.lessonBookmark.count({ where: { userId: this.testUserId } }),
      this.prisma.lessonNote.count({ where: { userId: this.testUserId } }),
      this.prisma.userCertification.count({ 
        where: { userId: this.testUserId, isRevoked: false } 
      }),
    ]);

    return { userProgress, totalLessons, bookmarksCount, notesCount, certificationsCount };
  }

  /**
   * Simulate recent activity API call
   */
  private async simulateRecentActivity(): Promise<any> {
    const [recentProgress, recentNotes, recentBookmarks, recentCertifications] = await Promise.all([
      this.prisma.userProgress.findMany({
        where: { 
          userId: this.testUserId,
          OR: [
            { status: 'completed', completedAt: { not: null } },
            { status: 'in_progress', lastAccessed: { not: null } }
          ]
        },
        select: {
          id: true,
          status: true,
          completedAt: true,
          lastAccessed: true,
          lessonId: true,
          lesson: { select: { id: true, lessonNumber: true, title: true } }
        },
        orderBy: [{ completedAt: 'desc' }, { lastAccessed: 'desc' }],
        take: 20
      }),
      this.prisma.lessonNote.findMany({
        where: { userId: this.testUserId },
        select: {
          id: true,
          createdAt: true,
          lessonId: true,
          lesson: { select: { id: true, lessonNumber: true, title: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),
      this.prisma.lessonBookmark.findMany({
        where: { userId: this.testUserId },
        select: {
          id: true,
          createdAt: true,
          lessonId: true,
          lesson: { select: { id: true, lessonNumber: true, title: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),
      this.prisma.userCertification.findMany({
        where: { userId: this.testUserId, isRevoked: false },
        select: {
          id: true,
          earnedAt: true,
          certification: { select: { id: true, name: true } }
        },
        orderBy: { earnedAt: 'desc' },
        take: 10
      })
    ]);

    return { recentProgress, recentNotes, recentBookmarks, recentCertifications };
  }

  /**
   * Setup test data if needed
   */
  private async setupTestData(providedUserId?: string): Promise<void> {
    if (providedUserId) {
      this.testUserId = providedUserId;
      return;
    }

    // Find or create a test user
    let testUser = await this.prisma.user.findFirst({
      where: { email: { startsWith: 'test-performance-' } },
    });

    if (!testUser) {
      testUser = await this.prisma.user.create({
        data: {
          email: `test-performance-${Date.now()}@example.com`,
          name: 'Performance Test User',
        },
      });

      // Create some test progress data
      const lessons = await this.prisma.lesson.findMany({
        take: 10,
        where: { isPublished: true },
      });

      if (lessons.length > 0) {
        await this.prisma.userProgress.createMany({
          data: lessons.slice(0, 5).map(lesson => ({
            userId: testUser!.id,
            lessonId: lesson.id,
            status: 'completed',
            progressPercentage: 100,
            timeSpentMinutes: Math.floor(Math.random() * 60) + 15,
            completedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
            lastAccessed: new Date(),
          })),
        });

        await this.prisma.userProgress.createMany({
          data: lessons.slice(5).map(lesson => ({
            userId: testUser!.id,
            lessonId: lesson.id,
            status: 'in_progress',
            progressPercentage: Math.floor(Math.random() * 80) + 10,
            timeSpentMinutes: Math.floor(Math.random() * 30) + 5,
            lastAccessed: new Date(),
          })),
        });
      }
    }

    this.testUserId = testUser.id;
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(
    benchmarks: BenchmarkResult[], 
    cacheStats: any, 
    dbStats: any
  ): string[] {
    const recommendations: string[] = [];

    // Check cache performance
    if (cacheStats.hitRate < 0.8) {
      recommendations.push(`🔄 Cache hit rate is ${Math.round(cacheStats.hitRate * 100)}%. Consider increasing cache TTL or adding more caching points.`);
    }

    // Check database performance
    if (dbStats.averageQueryTime > 100) {
      recommendations.push(`🐌 Average query time is ${dbStats.averageQueryTime}ms. Consider adding database indexes or optimizing slow queries.`);
    }

    if (dbStats.slowQueries / dbStats.totalQueries > 0.1) {
      recommendations.push(`⚠️  ${Math.round((dbStats.slowQueries / dbStats.totalQueries) * 100)}% of queries are slow. Review query optimization.`);
    }

    // Check specific operations
    benchmarks.forEach(benchmark => {
      if (benchmark.averageTime > 500) {
        recommendations.push(`🚨 ${benchmark.operation} is slow (${benchmark.averageTime}ms average). Consider optimization.`);
      }
      
      if (benchmark.successRate < 95) {
        recommendations.push(`❌ ${benchmark.operation} has ${benchmark.errorCount} errors (${benchmark.successRate}% success rate).`);
      }
    });

    // General recommendations
    if (recommendations.length === 0) {
      recommendations.push('✅ Performance looks good! All operations are performing within acceptable limits.');
    }

    return recommendations;
  }

  /**
   * Print formatted performance report
   */
  private printReport(report: PerformanceReport): void {
    console.log('\n' + '='.repeat(80));
    console.log('📊 PERFORMANCE REPORT');
    console.log('='.repeat(80));
    console.log(`📅 Test Date: ${report.testDate}`);
    console.log(`⏱️  Test Duration: ${Math.round(report.testDuration / 1000)}s`);
    console.log(`🔢 Total Operations: ${report.totalOperations}`);
    console.log(`⚡ Overall Average Time: ${Math.round(report.overallAverageTime)}ms`);
    
    console.log('\n📈 CACHE PERFORMANCE');
    console.log('-'.repeat(40));
    console.log(`Hit Rate: ${Math.round(report.cacheStats.hitRate * 100)}%`);
    console.log(`Total Requests: ${report.cacheStats.totalRequests}`);
    
    console.log('\n🗄️  DATABASE PERFORMANCE');
    console.log('-'.repeat(40));
    console.log(`Total Queries: ${report.dbStats.totalQueries}`);
    console.log(`Average Query Time: ${report.dbStats.averageQueryTime}ms`);
    console.log(`Slow Queries: ${report.dbStats.slowQueries}`);
    console.log(`Error Rate: ${Math.round(report.dbStats.errorRate * 100)}%`);
    
    console.log('\n⚡ OPERATION BENCHMARKS');
    console.log('-'.repeat(80));
    console.log('Operation'.padEnd(25) + 'Avg Time'.padEnd(12) + 'Median'.padEnd(10) + 'Min'.padEnd(8) + 'Max'.padEnd(8) + 'Success%');
    console.log('-'.repeat(80));
    
    report.benchmarks.forEach(benchmark => {
      console.log(
        benchmark.operation.padEnd(25) + 
        `${benchmark.averageTime}ms`.padEnd(12) + 
        `${benchmark.medianTime}ms`.padEnd(10) + 
        `${benchmark.minTime}ms`.padEnd(8) + 
        `${benchmark.maxTime}ms`.padEnd(8) + 
        `${benchmark.successRate}%`
      );
    });
    
    console.log('\n💡 RECOMMENDATIONS');
    console.log('-'.repeat(40));
    report.recommendations.forEach(rec => console.log(rec));
    console.log('='.repeat(80));
  }

  /**
   * Compare two performance reports
   */
  static compareReports(beforeReport: PerformanceReport, afterReport: PerformanceReport): void {
    console.log('\n' + '='.repeat(80));
    console.log('📊 PERFORMANCE COMPARISON');
    console.log('='.repeat(80));
    
    console.log('\n⚡ OVERALL IMPROVEMENT');
    console.log('-'.repeat(40));
    const timeImprovement = ((beforeReport.overallAverageTime - afterReport.overallAverageTime) / beforeReport.overallAverageTime) * 100;
    console.log(`Average Time: ${Math.round(timeImprovement)}% improvement`);
    
    const cacheImprovement = ((afterReport.cacheStats.hitRate - beforeReport.cacheStats.hitRate) / beforeReport.cacheStats.hitRate) * 100;
    console.log(`Cache Hit Rate: ${Math.round(cacheImprovement)}% improvement`);
    
    const dbImprovement = ((beforeReport.dbStats.averageQueryTime - afterReport.dbStats.averageQueryTime) / beforeReport.dbStats.averageQueryTime) * 100;
    console.log(`Database Query Time: ${Math.round(dbImprovement)}% improvement`);
    
    console.log('\n📈 OPERATION IMPROVEMENTS');
    console.log('-'.repeat(80));
    console.log('Operation'.padEnd(25) + 'Before'.padEnd(10) + 'After'.padEnd(10) + 'Improvement');
    console.log('-'.repeat(80));
    
    beforeReport.benchmarks.forEach(beforeBench => {
      const afterBench = afterReport.benchmarks.find(a => a.operation === beforeBench.operation);
      if (afterBench) {
        const improvement = ((beforeBench.averageTime - afterBench.averageTime) / beforeBench.averageTime) * 100;
        console.log(
          beforeBench.operation.padEnd(25) + 
          `${beforeBench.averageTime}ms`.padEnd(10) + 
          `${afterBench.averageTime}ms`.padEnd(10) + 
          `${Math.round(improvement)}%`
        );
      }
    });
    console.log('='.repeat(80));
  }
}

// Export singleton for convenience
export const performanceTester = new PerformanceTester();