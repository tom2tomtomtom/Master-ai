import Redis from 'ioredis';
import { logger } from '../logger';
import { env } from '../../config/env.schema';

// Redis client instance
let redisClient: Redis;

// Create Redis client with configuration
export const createRedisClient = () => {
  const options: Redis.RedisOptions = {
    retryStrategy: (times: number) => {
      const delay = Math.min(times * 50, 2000);
      logger.warn(`Redis connection retry attempt ${times}, delay: ${delay}ms`);
      return delay;
    },
    reconnectOnError: (err: Error) => {
      const targetError = 'READONLY';
      if (err.message.includes(targetError)) {
        // Only reconnect when the error contains "READONLY"
        return true;
      }
      return false;
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: true,
  };
  
  if (env.REDIS_URL) {
    redisClient = new Redis(env.REDIS_URL, options);
  } else {
    logger.warn('Redis URL not configured, caching will be disabled');
    // Return a mock client that always fails
    return createMockRedisClient();
  }
  
  // Event handlers
  redisClient.on('connect', () => {
    logger.info('Redis client connected');
  });
  
  redisClient.on('ready', () => {
    logger.info('Redis client ready');
  });
  
  redisClient.on('error', (err: Error) => {
    logger.error('Redis client error', err);
  });
  
  redisClient.on('close', () => {
    logger.warn('Redis connection closed');
  });
  
  redisClient.on('reconnecting', (delay: number) => {
    logger.info(`Redis client reconnecting in ${delay}ms`);
  });
  
  return redisClient;
};

// Mock Redis client for when Redis is not available
const createMockRedisClient = () => {
  return {
    get: async () => null,
    set: async () => 'OK',
    del: async () => 0,
    exists: async () => 0,
    expire: async () => 0,
    ttl: async () => -1,
    keys: async () => [],
    flushdb: async () => 'OK',
    mget: async () => [],
    mset: async () => 'OK',
    incr: async () => 0,
    decr: async () => 0,
    hget: async () => null,
    hset: async () => 0,
    hdel: async () => 0,
    hgetall: async () => ({}),
    isReady: false,
    connect: async () => {},
    disconnect: async () => {},
    quit: async () => 'OK',
  } as any;
};

// Cache key generators
export const cacheKeys = {
  user: (id: string) => `user:${id}`,
  userByEmail: (email: string) => `user:email:${email}`,
  session: (id: string) => `session:${id}`,
  apiResponse: (endpoint: string, params: string) => `api:${endpoint}:${params}`,
  rateLimit: (key: string) => `rl:${key}`,
  verification: (type: string, token: string) => `verify:${type}:${token}`,
};

// Cache utilities
export const cache = {
  get: async <T>(key: string): Promise<T | null> => {
    try {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error(`Cache get error for key ${key}`, error);
      return null;
    }
  },
  
  set: async (key: string, value: any, ttl?: number): Promise<boolean> => {
    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await redisClient.set(key, serialized, 'EX', ttl);
      } else {
        await redisClient.set(key, serialized);
      }
      return true;
    } catch (error) {
      logger.error(`Cache set error for key ${key}`, error);
      return false;
    }
  },
  
  del: async (key: string | string[]): Promise<number> => {
    try {
      const keys = Array.isArray(key) ? key : [key];
      return await redisClient.del(...keys);
    } catch (error) {
      logger.error(`Cache delete error for key ${key}`, error);
      return 0;
    }
  },
  
  exists: async (key: string): Promise<boolean> => {
    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Cache exists error for key ${key}`, error);
      return false;
    }
  },
  
  clear: async (pattern: string): Promise<number> => {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length === 0) return 0;
      return await redisClient.del(...keys);
    } catch (error) {
      logger.error(`Cache clear error for pattern ${pattern}`, error);
      return 0;
    }
  },
};

// Initialize Redis client
redisClient = createRedisClient();

// Export client and utilities
export { redisClient };
export default cache;
