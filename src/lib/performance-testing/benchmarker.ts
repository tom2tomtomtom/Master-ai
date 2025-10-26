/**
 * Benchmarking Module
 *
 * Provides benchmark operation execution with timing and error tracking
 */

import type { BenchmarkResult } from './types';

/**
 * Benchmark a specific operation
 *
 * @param name - The name of the operation being benchmarked
 * @param operation - The async operation to benchmark
 * @param iterations - Number of times to run the operation
 * @returns Promise<BenchmarkResult> containing timing and error statistics
 */
export async function benchmarkOperation(
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
