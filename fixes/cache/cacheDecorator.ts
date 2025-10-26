import { cache } from './redisClient';
import { logger } from '../logger';
import crypto from 'crypto';

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  keyPrefix?: string;
  condition?: (...args: any[]) => boolean;
  keyGenerator?: (...args: any[]) => string;
}

// Default key generator
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

// Cache decorator for methods
export function Cached(options: CacheOptions = {}) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      // Check if caching is enabled
      if (!process.env.ENABLE_CACHE || process.env.ENABLE_CACHE === 'false') {
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
        // Try to get from cache
        const cachedResult = await cache.get(cacheKey);
        if (cachedResult !== null) {
          logger.debug(`Cache hit for key: ${cacheKey}`);
          return cachedResult;
        }
        
        // Execute original method
        logger.debug(`Cache miss for key: ${cacheKey}`);
        const result = await originalMethod.apply(this, args);
        
        // Store in cache
        await cache.set(cacheKey, result, options.ttl);
        
        return result;
      } catch (error) {
        logger.error('Cache decorator error', error);
        // Fallback to original method on cache error
        return originalMethod.apply(this, args);
      }
    };
    
    return descriptor;
  };
}

// Cache invalidation decorator
export function InvalidateCache(options: {
  keyPrefix?: string;
  keyGenerator?: (...args: any[]) => string;
  patterns?: string[];
}) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args);
      
      try {
        // Clear specific keys
        if (options.keyGenerator) {
          const key = options.keyGenerator(...args);
          const cacheKey = options.keyPrefix ? `${options.keyPrefix}:${key}` : key;
          await cache.del(cacheKey);
          logger.debug(`Invalidated cache key: ${cacheKey}`);
        }
        
        // Clear patterns
        if (options.patterns) {
          for (const pattern of options.patterns) {
            const count = await cache.clear(pattern);
            logger.debug(`Invalidated ${count} keys matching pattern: ${pattern}`);
          }
        }
      } catch (error) {
        logger.error('Cache invalidation error', error);
      }
      
      return result;
    };
    
    return descriptor;
  };
}

// Memoization decorator for pure functions
export function Memoize(options: { ttl?: number } = {}) {
  const memoCache = new Map<string, { value: any; expires: number }>();
  
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
      
      // Clean up expired entries periodically
      if (memoCache.size > 100) {
        for (const [k, v] of memoCache.entries()) {
          if (v.expires && v.expires < now) {
            memoCache.delete(k);
          }
        }
      }
      
      return result;
    };
    
    return descriptor;
  };
}

// Example usage:
/*
class UserService {
  @Cached({ ttl: 300, keyPrefix: 'user' })
  async getUserById(id: string) {
    // Expensive database query
    return await prisma.user.findUnique({ where: { id } });
  }
  
  @InvalidateCache({ 
    keyGenerator: (id: string) => `user:getUserById:${id}`,
    patterns: ['user:*'] 
  })
  async updateUser(id: string, data: any) {
    return await prisma.user.update({ where: { id }, data });
  }
  
  @Memoize({ ttl: 60 })
  calculateExpensiveValue(input: number) {
    // Expensive calculation
    return input * Math.random();
  }
}
*/
