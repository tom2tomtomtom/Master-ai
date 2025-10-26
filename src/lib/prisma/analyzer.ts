/**
 * Query Performance Analyzer
 *
 * Analyzes database query performance over time, tracks metrics,
 * and detects performance regressions. Maintains a rolling window
 * of query execution times for statistical analysis.
 */

import { appLogger } from '@/lib/logger';

/**
 * Statistics for a specific query pattern
 */
export type QueryStats = {
  /** Normalized query pattern */
  query: string;
  /** Number of samples recorded */
  count: number;
  /** Average execution time in ms */
  avg: number;
  /** 50th percentile (median) in ms */
  p50: number;
  /** 95th percentile in ms */
  p95: number;
  /** 99th percentile in ms */
  p99: number;
  /** Minimum execution time in ms */
  min: number;
  /** Maximum execution time in ms */
  max: number;
}

/**
 * Query performance analyzer
 *
 * Tracks query execution times and provides statistical analysis
 * to identify performance issues and regressions. Maintains a rolling
 * window of the most recent samples for each unique query pattern.
 *
 * Features:
 * - Automatic query normalization (removes variable values)
 * - Rolling window of samples (default: 100 most recent)
 * - Performance regression detection (50% slowdown threshold)
 * - Statistical analysis (avg, percentiles, min/max)
 *
 * @example
 * ```ts
 * import { queryAnalyzer } from '@/lib/prisma';
 *
 * // Record query execution
 * queryAnalyzer.recordQuery('SELECT * FROM users WHERE id = 1', 45);
 *
 * // Get statistics
 * const stats = queryAnalyzer.getQueryStats('SELECT * FROM users WHERE id = 1');
 * console.log(`Average: ${stats?.avg}ms, P95: ${stats?.p95}ms`);
 *
 * // Get all query statistics
 * const allStats = queryAnalyzer.getAllStats();
 * ```
 */
export class QueryPerformanceAnalyzer {
  private queryTimes: Map<string, number[]> = new Map();
  private maxSamples = 100;

  /**
   * Record a query execution time
   *
   * Normalizes the query pattern, stores the execution time, and
   * checks for performance regressions by comparing recent samples
   * with older samples.
   *
   * If a significant regression is detected (>50% slower), a warning
   * is logged with details about the performance degradation.
   *
   * @param query - SQL query string
   * @param duration - Execution time in milliseconds
   *
   * @example
   * ```ts
   * queryAnalyzer.recordQuery('SELECT * FROM users WHERE id = 123', 45);
   * ```
   */
  recordQuery(query: string, duration: number) {
    const queryKey = this.normalizeQuery(query);

    if (!this.queryTimes.has(queryKey)) {
      this.queryTimes.set(queryKey, []);
    }

    const times = this.queryTimes.get(queryKey)!;
    times.push(duration);

    // Keep only the most recent samples
    if (times.length > this.maxSamples) {
      times.shift();
    }

    // Check for performance regressions
    if (times.length > 10) {
      const recent = times.slice(-10);
      const older = times.slice(-20, -10);

      if (older.length > 0) {
        const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
        const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

        if (recentAvg > olderAvg * 1.5) { // 50% performance regression
          appLogger.warn('Query performance regression detected', {
            category: 'performance',
            event: 'query_regression',
            query: queryKey,
            recentAvg,
            olderAvg,
            regression: ((recentAvg - olderAvg) / olderAvg * 100).toFixed(2) + '%'
          });
        }
      }
    }
  }

  /**
   * Normalize a query by removing variable parts
   *
   * Creates a normalized query pattern by replacing:
   * - Parameter placeholders ($1, $2, etc.) with $?
   * - Numeric values with ?
   * - String literals with '?'
   * - Multiple whitespace with single space
   *
   * This allows different queries with the same structure to be
   * grouped together for analysis.
   *
   * @param query - Raw SQL query string
   * @returns Normalized query pattern
   *
   * @private
   * @example
   * ```ts
   * normalizeQuery("SELECT * FROM users WHERE id = 123")
   * // Returns: "SELECT * FROM users WHERE id = ?"
   * ```
   */
  private normalizeQuery(query: string): string {
    // Normalize query by removing variable parts
    return query
      .replace(/\$\d+/g, '$?') // Replace parameter placeholders
      .replace(/\d+/g, '?') // Replace numbers
      .replace(/'\w+'/g, "'?'") // Replace string literals
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Get performance statistics for a specific query
   *
   * Calculates comprehensive statistics including average, percentiles,
   * and min/max values for all recorded samples of the given query.
   *
   * @param query - SQL query string (will be normalized)
   * @returns Query statistics or null if no samples recorded
   *
   * @example
   * ```ts
   * const stats = queryAnalyzer.getQueryStats('SELECT * FROM users WHERE id = 1');
   * if (stats) {
   *   console.log(`Average: ${stats.avg}ms`);
   *   console.log(`P95: ${stats.p95}ms`);
   *   console.log(`Samples: ${stats.count}`);
   * }
   * ```
   */
  getQueryStats(query: string): QueryStats | null {
    const queryKey = this.normalizeQuery(query);
    const times = this.queryTimes.get(queryKey) || [];

    if (times.length === 0) return null;

    const sorted = [...times].sort((a, b) => a - b);
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const p50 = sorted[Math.floor(sorted.length * 0.5)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];

    return {
      query: queryKey,
      count: times.length,
      avg: Math.round(avg),
      p50: Math.round(p50),
      p95: Math.round(p95),
      p99: Math.round(p99),
      min: Math.round(sorted[0]),
      max: Math.round(sorted[sorted.length - 1])
    };
  }

  /**
   * Get performance statistics for all recorded queries
   *
   * Returns an array of statistics for every query pattern that
   * has been recorded, sorted by query pattern.
   *
   * @returns Array of query statistics (excludes null entries)
   *
   * @example
   * ```ts
   * const allStats = queryAnalyzer.getAllStats();
   * allStats.forEach(stat => {
   *   console.log(`Query: ${stat.query}`);
   *   console.log(`Average: ${stat.avg}ms, P95: ${stat.p95}ms`);
   * });
   * ```
   */
  getAllStats(): QueryStats[] {
    return Array.from(this.queryTimes.keys())
      .map(query => this.getQueryStats(query))
      .filter((stat): stat is QueryStats => stat !== null);
  }
}

/**
 * Singleton instance of QueryPerformanceAnalyzer
 *
 * This singleton is shared across the application to maintain
 * a consistent view of query performance metrics.
 *
 * @example
 * ```ts
 * import { queryAnalyzer } from '@/lib/prisma';
 *
 * queryAnalyzer.recordQuery('SELECT * FROM users', 45);
 * const stats = queryAnalyzer.getAllStats();
 * ```
 */
export const queryAnalyzer = new QueryPerformanceAnalyzer();
