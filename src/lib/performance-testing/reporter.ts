/**
 * Performance Reporter Module
 *
 * Generates recommendations and formatted reports from performance test results
 */

import type { BenchmarkResult, PerformanceReport, CacheStats, DbStats } from './types';

/**
 * Generate performance recommendations based on test results
 *
 * @param benchmarks - Array of benchmark results
 * @param cacheStats - Cache performance statistics
 * @param dbStats - Database performance statistics
 * @returns Array of recommendation strings
 */
export function generateRecommendations(
  benchmarks: BenchmarkResult[],
  cacheStats: CacheStats,
  dbStats: DbStats
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
 * Print formatted performance report to console
 *
 * @param report - The performance report to print
 */
export function printReport(report: PerformanceReport): void {
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
 * Compare two performance reports and print the differences
 *
 * @param beforeReport - Performance report from before optimization
 * @param afterReport - Performance report from after optimization
 */
export function compareReports(beforeReport: PerformanceReport, afterReport: PerformanceReport): void {
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
