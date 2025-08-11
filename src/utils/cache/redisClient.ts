/**
 * Redis Client for Next.js Application
 * Provides connection pooling, error handling, and graceful degradation
 */

import Redis from 'ioredis';
import { env } from '@/config/env.schema';

// Logger placeholder (will be replaced with proper logger)
const logger = {
  info: (message: string, ...args: any[]) => console.log(`[INFO] ${message}`, ...args),
  warn: (message: string, ...args: any[]) => console.warn(`[WARN] ${message}`, ...args),
  error: (message: string, ...args: any[]) => console.error(`[ERROR] ${message}`, ...args),
};

// Redis client instance
let redisClient: Redis | null = null;

/**
 * Redis connection configuration
 */
const getRedisConfig = (): Redis.RedisOptions => ({
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    logger.warn(`Redis connection retry attempt ${times}, delay: ${delay}ms`);
    return delay;
  },
  reconnectOnError: (err: Error) => {
    const targetErrors = ['READONLY', 'ECONNRESET', 'ENOTFOUND'];
    if (targetErrors.some(error => err.message.includes(error))) {
      return true;
    }
    return false;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
  connectTimeout: 10000,
  commandTimeout: 5000,
  keepAlive: 30000,
});

/**
 * Create Redis client with proper error handling
 */
export const createRedisClient = async (): Promise<Redis | null> => {
  try {
    // Skip Redis in development if not configured
    if (process.env.NODE_ENV === 'development' && !env.REDIS_URL) {
      logger.warn('Redis URL not configured in development, caching will be disabled');
      return null;
    }

    if (!env.REDIS_URL) {
      throw new Error('Redis URL not configured');
    }

    const client = new Redis(env.REDIS_URL, getRedisConfig());

    // Event handlers
    client.on('connect', () => {
      logger.info('Redis client connected successfully');
    });

    client.on('ready', () => {
      logger.info('Redis client ready to receive commands');
    });

    client.on('error', (err: Error) => {
      logger.error('Redis client error:', err.message);
    });

    client.on('close', () => {
      logger.warn('Redis connection closed');
    });

    client.on('reconnecting', (delay: number) => {
      logger.info(`Redis client reconnecting in ${delay}ms`);
    });

    client.on('end', () => {
      logger.warn('Redis connection ended');
    });

    // Test connection
    await client.ping();
    logger.info('Redis connection test successful');

    return client;
  } catch (error) {
    logger.error('Failed to create Redis client:', error);
    return null;
  }
};

/**
 * Get or create Redis client instance
 */
export const getRedisClient = async (): Promise<Redis | null> => {
  if (!redisClient) {
    redisClient = await createRedisClient();
  }
  return redisClient;
};

/**
 * Cache key generators
 */
export const cacheKeys = {
  // User data
  user: (id: string) => `user:${id}`,
  userByEmail: (email: string) => `user:email:${email}`,
  userProfile: (id: string) => `profile:${id}`,
  userStats: (id: string) => `stats:${id}`,
  
  // Sessions
  session: (id: string) => `session:${id}`,
  
  // Content
  lesson: (id: string) => `lesson:${id}`,
  lessonContent: (number: number) => `lesson:content:${number}`,
  learningPath: (id: string) => `path:${id}`,
  
  // API responses
  apiResponse: (endpoint: string, params: string) => `api:${endpoint}:${params}`,
  
  // Rate limiting
  rateLimit: (key: string) => `rl:${key}`,
  
  // Authentication
  verification: (type: string, token: string) => `verify:${type}:${token}`,
  passwordReset: (token: string) => `pwd_reset:${token}`,
  
  // Progress tracking
  userProgress: (userId: string) => `progress:${userId}`,
  lessonProgress: (userId: string, lessonId: string) => `progress:${userId}:${lessonId}`,
  
  // Temporary data
  temp: (key: string) => `temp:${key}`,
  upload: (uploadId: string) => `upload:${uploadId}`,
};

/**
 * Cache utility functions
 */
export const cache = {
  /**
   * Get value from cache
   */
  get: async <T>(key: string): Promise<T | null> => {
    try {
      const client = await getRedisClient();
      if (!client) {
        return null;
      }

      const value = await client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  },

  /**
   * Set value in cache
   */
  set: async (key: string, value: any, ttl?: number): Promise<boolean> => {
    try {
      const client = await getRedisClient();
      if (!client) {
        return false;
      }

      const serialized = JSON.stringify(value);
      if (ttl) {
        await client.setex(key, ttl, serialized);
      } else {
        await client.set(key, serialized);
      }
      return true;
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  },

  /**
   * Delete key(s) from cache
   */
  del: async (key: string | string[]): Promise<number> => {
    try {
      const client = await getRedisClient();
      if (!client) {
        return 0;
      }

      const keys = Array.isArray(key) ? key : [key];
      return await client.del(...keys);
    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error);
      return 0;
    }
  },

  /**
   * Check if key exists
   */
  exists: async (key: string): Promise<boolean> => {
    try {
      const client = await getRedisClient();
      if (!client) {
        return false;
      }

      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  },

  /**
   * Set expiration on key
   */
  expire: async (key: string, ttl: number): Promise<boolean> => {
    try {
      const client = await getRedisClient();
      if (!client) {
        return false;
      }

      const result = await client.expire(key, ttl);
      return result === 1;
    } catch (error) {
      logger.error(`Cache expire error for key ${key}:`, error);
      return false;
    }
  },

  /**
   * Get time to live for key
   */
  ttl: async (key: string): Promise<number> => {
    try {
      const client = await getRedisClient();
      if (!client) {
        return -1;
      }

      return await client.ttl(key);
    } catch (error) {
      logger.error(`Cache TTL error for key ${key}:`, error);
      return -1;
    }
  },

  /**
   * Clear keys matching pattern
   */
  clear: async (pattern: string): Promise<number> => {
    try {
      const client = await getRedisClient();
      if (!client) {
        return 0;
      }

      const keys = await client.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }
      
      return await client.del(...keys);
    } catch (error) {
      logger.error(`Cache clear error for pattern ${pattern}:`, error);
      return 0;
    }
  },

  /**
   * Increment counter
   */
  incr: async (key: string): Promise<number> => {
    try {
      const client = await getRedisClient();
      if (!client) {
        return 0;
      }

      return await client.incr(key);
    } catch (error) {
      logger.error(`Cache increment error for key ${key}:`, error);
      return 0;
    }
  },

  /**
   * Decrement counter
   */
  decr: async (key: string): Promise<number> => {
    try {
      const client = await getRedisClient();
      if (!client) {
        return 0;
      }

      return await client.decr(key);
    } catch (error) {
      logger.error(`Cache decrement error for key ${key}:`, error);
      return 0;
    }
  },

  /**
   * Hash operations
   */
  hget: async <T>(key: string, field: string): Promise<T | null> => {
    try {
      const client = await getRedisClient();
      if (!client) {
        return null;
      }

      const value = await client.hget(key, field);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error(`Cache hget error for key ${key}, field ${field}:`, error);
      return null;
    }
  },

  hset: async (key: string, field: string, value: any): Promise<boolean> => {
    try {
      const client = await getRedisClient();
      if (!client) {
        return false;
      }

      const serialized = JSON.stringify(value);
      await client.hset(key, field, serialized);
      return true;
    } catch (error) {
      logger.error(`Cache hset error for key ${key}, field ${field}:`, error);
      return false;
    }
  },

  hgetall: async <T>(key: string): Promise<Record<string, T>> => {
    try {
      const client = await getRedisClient();
      if (!client) {
        return {};
      }

      const hash = await client.hgetall(key);
      const result: Record<string, T> = {};
      
      for (const [field, value] of Object.entries(hash)) {
        try {
          result[field] = JSON.parse(value);
        } catch {
          result[field] = value as any;
        }
      }
      
      return result;
    } catch (error) {
      logger.error(`Cache hgetall error for key ${key}:`, error);
      return {};
    }
  },
};

/**
 * Initialize Redis connection
 */
export const initRedis = async (): Promise<void> => {
  try {
    if (env.ENABLE_CACHE) {
      redisClient = await createRedisClient();
      if (redisClient) {
        logger.info('Redis cache initialized successfully');
      } else {
        logger.warn('Redis cache initialization skipped');
      }
    } else {
      logger.info('Redis cache disabled via configuration');
    }
  } catch (error) {
    logger.error('Failed to initialize Redis cache:', error);
  }
};

/**
 * Close Redis connection
 */
export const closeRedis = async (): Promise<void> => {
  try {
    if (redisClient) {
      await redisClient.quit();
      redisClient = null;
      logger.info('Redis connection closed');
    }
  } catch (error) {
    logger.error('Error closing Redis connection:', error);
  }
};

/**
 * Health check for Redis
 */
export const redisHealthCheck = async (): Promise<{
  status: 'healthy' | 'unhealthy';
  latency?: number;
  error?: string;
}> => {
  try {
    const client = await getRedisClient();
    if (!client) {
      return { status: 'unhealthy', error: 'Redis client not available' };
    }

    const start = Date.now();
    await client.ping();
    const latency = Date.now() - start;

    return { status: 'healthy', latency };
  } catch (error) {
    return { 
      status: 'unhealthy', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

// Export the client getter for advanced usage
export { getRedisClient as redisClient };
export default cache;