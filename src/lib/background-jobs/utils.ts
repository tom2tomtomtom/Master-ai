/**
 * Background Jobs Utilities
 * 
 * Utility functions for job processing and batch operations
 */

/**
 * Create batches from array for efficient processing
 */
export function createBatches<T>(items: T[], batchSize: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }
  return batches;
}

/**
 * Simple semaphore implementation for concurrency control
 */
export class Semaphore {
  private permits: Array<null | string>;
  private waiting: Array<() => void> = [];

  constructor(private maxPermits: number) {
    this.permits = new Array(maxPermits).fill(null);
  }

  async acquire(id: string): Promise<void> {
    return new Promise<void>((resolve) => {
      const tryAcquire = () => {
        const availableIndex = this.permits.findIndex(p => p === null);
        if (availableIndex !== -1) {
          this.permits[availableIndex] = id;
          resolve();
        } else {
          this.waiting.push(tryAcquire);
        }
      };
      tryAcquire();
    });
  }

  release(id: string): void {
    const index = this.permits.findIndex(p => p === id);
    if (index !== -1) {
      this.permits[index] = null;
      const nextWaiting = this.waiting.shift();
      if (nextWaiting) {
        // Use setTimeout to prevent stack overflow
        setTimeout(nextWaiting, 0);
      }
    }
  }
}

/**
 * Sleep utility for adding delays between operations
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Process items in concurrent batches with controlled concurrency
 */
export async function processConcurrentBatches<T, R>(
  items: T[],
  batchSize: number,
  concurrentBatches: number,
  processor: (batch: T[]) => Promise<R>
): Promise<R[]> {
  const batches = createBatches(items, batchSize);
  const results: R[] = [];

  for (let i = 0; i < batches.length; i += concurrentBatches) {
    const currentBatches = batches.slice(i, i + concurrentBatches);
    
    const batchPromises = currentBatches.map(processor);
    const batchResults = await Promise.all(batchPromises);
    
    results.push(...batchResults);
    
    // Brief pause between concurrent batch groups
    if (i + concurrentBatches < batches.length) {
      await sleep(200);
    }
  }

  return results;
}