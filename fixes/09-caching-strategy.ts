// Redis caching implementation
import { Redis } from 'ioredis';
import { appLogger } from './logger';

// Cache configuration
const CACHE_CONFIG = {
  // TTL in seconds
  DEFAULT_TTL: 60 * 60, // 1 hour
  SHORT_TTL: 60 * 5, // 5 minutes
  LONG_TTL: 60 * 60 * 24, // 24 hours
  
  // Key prefixes
  PREFIXES: {
    USER: 'user:',
    LESSON: 'lesson:',
    PROGRESS: 'progress:',
    SESSION: 'session:',
    RATE_LIMIT: 'rate_limit:',
  },
};

// Initialize Redis client
let redis: Redis | null = null;

export function getRedisClient(): Redis | null {
  if (!process.env.ENABLE_REDIS_CACHE || process.env.ENABLE_REDIS_CACHE !== 'true') {
    return null;
  }

  if (!redis) {
    try {
      redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0'),
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        reconnectOnError: (err) => {
          const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT'];
          return targetErrors.some(e => err.message.includes(e));
        },
      });

      redis.on('error', (error) => {
        appLogger.error('Redis connection error:', error);
      });

      redis.on('connect', () => {
        appLogger.info('Redis connected successfully');
      });
    } catch (error) {
      appLogger.error('Failed to initialize Redis:', error);
      redis = null;
    }
  }

  return redis;
}

// Cache wrapper class
export class CacheService {
  private redis: Redis | null;

  constructor() {
    this.redis = getRedisClient();
  }

  /**
   * Get value from cache
   */
  async get<T = any>(key: string): Promise<T | null> {
    if (!this.redis) return null;

    try {
      const value = await this.redis.get(key);
      if (!value) return null;
      
      return JSON.parse(value) as T;
    } catch (error) {
      appLogger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set(key: string, value: any, ttl: number = CACHE_CONFIG.DEFAULT_TTL): Promise<boolean> {
    if (!this.redis) return false;

    try {
      const serialized = JSON.stringify(value);
      await this.redis.setex(key, ttl, serialized);
      return true;
    } catch (error) {
      appLogger.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<boolean> {
    if (!this.redis) return false;

    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      appLogger.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete multiple keys by pattern
   */
  async deletePattern(pattern: string): Promise<boolean> {
    if (!this.redis) return false;

    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      return true;
    } catch (error) {
      appLogger.error(`Cache delete pattern error for ${pattern}:`, error);
      return false;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.redis) return false;

    try {
      const exists = await this.redis.exists(key);
      return exists === 1;
    } catch (error) {
      appLogger.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Set expiration on existing key
   */
  async expire(key: string, ttl: number): Promise<boolean> {
    if (!this.redis) return false;

    try {
      await this.redis.expire(key, ttl);
      return true;
    } catch (error) {
      appLogger.error(`Cache expire error for key ${key}:`, error);
      return false;
    }
  }
}

// Create singleton instance
export const cache = new CacheService();

// Cache decorators for methods
export function Cacheable(options: {
  key: string | ((args: any[]) => string);
  ttl?: number;
  condition?: (result: any) => boolean;
}) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = typeof options.key === 'function' 
        ? options.key(args) 
        : options.key;
      
      // Try to get from cache
      const cached = await cache.get(cacheKey);
      if (cached !== null) {
        appLogger.debug(`Cache hit for ${cacheKey}`);
        return cached;
      }

      // Execute original method
      const result = await originalMethod.apply(this, args);

      // Cache the result if condition is met
      if (!options.condition || options.condition(result)) {
        await cache.set(cacheKey, result, options.ttl || CACHE_CONFIG.DEFAULT_TTL);
        appLogger.debug(`Cached result for ${cacheKey}`);
      }

      return result;
    };

    return descriptor;
  };
}

// Cache invalidation decorator
export function InvalidateCache(patterns: string[] | ((args: any[]) => string[])) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args);

      // Invalidate cache patterns
      const patternsToInvalidate = typeof patterns === 'function' 
        ? patterns(args) 
        : patterns;

      for (const pattern of patternsToInvalidate) {
        await cache.deletePattern(pattern);
        appLogger.debug(`Invalidated cache pattern: ${pattern}`);
      }

      return result;
    };

    return descriptor;
  };
}

// Specific cache helpers
export const userCache = {
  key: (userId: string) => `${CACHE_CONFIG.PREFIXES.USER}${userId}`,
  ttl: CACHE_CONFIG.DEFAULT_TTL,
};

export const lessonCache = {
  key: (lessonId: string) => `${CACHE_CONFIG.PREFIXES.LESSON}${lessonId}`,
  listKey: () => `${CACHE_CONFIG.PREFIXES.LESSON}list`,
  ttl: CACHE_CONFIG.LONG_TTL,
};

export const progressCache = {
  key: (userId: string, lessonId: string) => `${CACHE_CONFIG.PREFIXES.PROGRESS}${userId}:${lessonId}`,
  userKey: (userId: string) => `${CACHE_CONFIG.PREFIXES.PROGRESS}${userId}:*`,
  ttl: CACHE_CONFIG.SHORT_TTL,
};
