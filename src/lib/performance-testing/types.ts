/**
 * Performance Testing Types
 *
 * Type definitions for performance benchmarking
 */

export interface BenchmarkResult {
  operation: string;
  iterations: number;
  averageTime: number;
  medianTime: number;
  minTime: number;
  maxTime: number;
  errorCount: number;
  successRate: number;
}

export interface PerformanceReport {
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

export interface PerformanceTestOptions {
  iterations?: number;
  testUserId?: string;
  skipCache?: boolean;
}

export interface CacheStats {
  hitRate: number;
  totalRequests: number;
}

export interface DbStats {
  totalQueries: number;
  averageQueryTime: number;
  slowQueries: number;
  errorRate: number;
}
