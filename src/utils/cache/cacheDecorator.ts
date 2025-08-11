/**
 * Cache Decorator System for Next.js Application
 * Provides method-level caching with Redis backend and memory fallback
 */

import { cache } from './redisClient';
import crypto from 'crypto';

// Logger placeholder
const logger = {
  debug: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[CACHE] ${message}`, ...args);
    }
  },
  error: (message: string, ...args: any[]) => console.error(`[CACHE ERROR] ${message}`, ...args),
};

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  keyPrefix?: string;
  condition?: (...args: any[]) => boolean;
  keyGenerator?: (...args: any[]) => string;
  skipCache?: boolean; // Skip cache entirely
  refreshCache?: boolean; // Force refresh cache
}

/**
 * Default key generator using method signature and arguments
 */
const defaultKeyGenerator = (
  target: any,
  propertyName: string,
  args: any[]
): string => {
  const className = target.constructor.name;
  const argsHash = crypto
    .createHash('md5')
    .update(JSON.stringify(args))
    .digest('hex');
  return `${className}:${propertyName}:${argsHash}`;
};

/**
 * Enhanced cache decorator for async methods
 */
export function Cached(options: CacheOptions = {}) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    if (typeof originalMethod !== 'function') {
      throw new Error('@Cached can only be applied to methods');
    }

    descriptor.value = async function (...args: any[]) {
      // Skip caching if disabled or skipCache option is true
      if (!process.env.ENABLE_CACHE || 
          process.env.ENABLE_CACHE === 'false' || 
          options.skipCache) {
        return originalMethod.apply(this, args);
      }

      // Check condition if provided
      if (options.condition && !options.condition(...args)) {
        return originalMethod.apply(this, args);
      }

      // Generate cache key
      const keyGenerator = options.keyGenerator || defaultKeyGenerator;
      const baseKey = keyGenerator.call(this, target, propertyName, args);
      const cacheKey = options.keyPrefix ? `${options.keyPrefix}:${baseKey}` : baseKey;

      try {
        // Skip cache lookup if refreshCache is true
        if (!options.refreshCache) {
          // Try to get from cache
          const cachedResult = await cache.get(cacheKey);
          if (cachedResult !== null) {
            logger.debug(`Cache hit for key: ${cacheKey}`);
            return cachedResult;
          }
        }

        // Execute original method
        logger.debug(`Cache miss for key: ${cacheKey}`);
        const result = await originalMethod.apply(this, args);

        // Store in cache (don't await to avoid blocking)
        cache.set(cacheKey, result, options.ttl).catch(error => {
          logger.error(`Failed to cache result for key ${cacheKey}:`, error);
        });

        return result;
      } catch (error) {
        logger.error('Cache decorator error:', error);
        // Fallback to original method on cache error
        return originalMethod.apply(this, args);
      }
    };

    return descriptor;
  };
}

/**
 * Cache invalidation decorator
 */
export function InvalidateCache(options: {
  keyPrefix?: string;
  keyGenerator?: (...args: any[]) => string;
  patterns?: string[];
  keys?: string[];
}) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args);

      // Skip invalidation if caching is disabled
      if (!process.env.ENABLE_CACHE || process.env.ENABLE_CACHE === 'false') {
        return result;
      }

      try {
        // Clear specific keys
        if (options.keyGenerator) {
          const key = options.keyGenerator(...args);
          const cacheKey = options.keyPrefix ? `${options.keyPrefix}:${key}` : key;
          await cache.del(cacheKey);
          logger.debug(`Invalidated cache key: ${cacheKey}`);
        }

        // Clear static keys
        if (options.keys) {
          await cache.del(options.keys);
          logger.debug(`Invalidated cache keys: ${options.keys.join(', ')}`);
        }

        // Clear patterns
        if (options.patterns) {
          for (const pattern of options.patterns) {
            const count = await cache.clear(pattern);
            logger.debug(`Invalidated ${count} keys matching pattern: ${pattern}`);
          }
        }
      } catch (error) {
        logger.error('Cache invalidation error:', error);
      }

      return result;
    };

    return descriptor;
  };
}

/**
 * In-memory memoization decorator for synchronous functions
 */
export function Memoize(options: { ttl?: number; maxSize?: number } = {}) {
  const memoCache = new Map<string, { value: any; expires: number }>();
  const maxSize = options.maxSize || 100;

  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      const key = JSON.stringify(args);
      const now = Date.now();

      // Check memory cache
      const cached = memoCache.get(key);
      if (cached && (!cached.expires || cached.expires > now)) {
        return cached.value;
      }

      // Execute original method
      const result = originalMethod.apply(this, args);

      // Store in memory cache
      const expires = options.ttl ? now + options.ttl * 1000 : 0;
      memoCache.set(key, { value: result, expires });

      // Clean up expired entries and limit size
      if (memoCache.size > maxSize) {
        const entries = Array.from(memoCache.entries());
        
        // Remove expired entries first
        for (const [k, v] of entries) {
          if (v.expires && v.expires < now) {
            memoCache.delete(k);
          }
        }

        // If still over limit, remove oldest entries (FIFO)
        if (memoCache.size > maxSize) {
          const sortedEntries = entries
            .filter(([k]) => memoCache.has(k))
            .slice(0, memoCache.size - maxSize);
          
          for (const [k] of sortedEntries) {
            memoCache.delete(k);
          }
        }
      }

      return result;
    };

    return descriptor;
  };
}

/**
 * Cache-aside pattern implementation
 */
export class CacheAside<T> {
  private keyPrefix: string;
  private ttl: number;

  constructor(keyPrefix: string, ttl: number = 300) {
    this.keyPrefix = keyPrefix;
    this.ttl = ttl;
  }

  async get(key: string): Promise<T | null> {
    const cacheKey = `${this.keyPrefix}:${key}`;
    return await cache.get<T>(cacheKey);
  }

  async set(key: string, value: T, customTtl?: number): Promise<boolean> {
    const cacheKey = `${this.keyPrefix}:${key}`;
    return await cache.set(cacheKey, value, customTtl || this.ttl);
  }

  async del(key: string): Promise<number> {
    const cacheKey = `${this.keyPrefix}:${key}`;
    return await cache.del(cacheKey);
  }

  async getOrSet(
    key: string,
    factory: () => Promise<T>,
    customTtl?: number
  ): Promise<T> {
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, customTtl);
    return value;
  }
}

/**
 * Cache warming utility
 */
export class CacheWarmer {
  private jobs: Array<{
    name: string;
    fn: () => Promise<void>;
    interval: number;
    lastRun: number;
  }> = [];

  addJob(name: string, fn: () => Promise<void>, interval: number = 3600000) {
    this.jobs.push({
      name,
      fn,
      interval,
      lastRun: 0,
    });
  }

  async runAll(): Promise<void> {
    const now = Date.now();
    
    for (const job of this.jobs) {
      if (now - job.lastRun >= job.interval) {
        try {
          logger.debug(`Running cache warming job: ${job.name}`);
          await job.fn();
          job.lastRun = now;
        } catch (error) {
          logger.error(`Cache warming job failed: ${job.name}`, error);
        }
      }
    }
  }

  async runJob(name: string): Promise<boolean> {
    const job = this.jobs.find(j => j.name === name);
    if (!job) {
      return false;
    }

    try {
      await job.fn();
      job.lastRun = Date.now();
      return true;
    } catch (error) {
      logger.error(`Cache warming job failed: ${name}`, error);
      return false;
    }
  }
}

/**
 * Pre-configured cache instances for common use cases
 */
export const cacheInstances = {
  users: new CacheAside<any>('users', 300), // 5 minutes
  lessons: new CacheAside<any>('lessons', 3600), // 1 hour
  progress: new CacheAside<any>('progress', 600), // 10 minutes
  sessions: new CacheAside<any>('sessions', 1800), // 30 minutes
  api: new CacheAside<any>('api', 120), // 2 minutes
};

/**
 * Global cache warmer instance
 */
export const cacheWarmer = new CacheWarmer();

// Example usage:
/*
class LessonService {
  @Cached({ 
    ttl: 3600, // 1 hour
    keyPrefix: 'lessons',
    condition: (lessonId: string) => !!lessonId // Only cache if lessonId is provided
  })
  async getLessonById(lessonId: string) {
    return await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { exercises: true }
    });
  }

  @InvalidateCache({ 
    keyGenerator: (lessonId: string) => `lessons:LessonService:getLessonById:${lessonId}`,
    patterns: ['lessons:*', 'api:lessons:*'] 
  })
  async updateLesson(lessonId: string, data: any) {
    return await prisma.lesson.update({
      where: { id: lessonId },
      data
    });
  }

  @Memoize({ ttl: 300, maxSize: 50 }) // 5 minutes, max 50 entries
  calculateDifficulty(exerciseCount: number, avgScore: number) {
    // Expensive calculation
    return Math.round((exerciseCount * 0.3 + (100 - avgScore) * 0.7) / 10);
  }
}

// Cache-aside usage
const userCache = cacheInstances.users;
const user = await userCache.getOrSet(`user:${userId}`, async () => {
  return await prisma.user.findUnique({ where: { id: userId } });
});
*/