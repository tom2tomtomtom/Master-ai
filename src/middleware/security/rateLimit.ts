import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { Request, Response } from 'express';
import { redisClient } from '../../utils/cache/redisClient';
import { logger } from '../../utils/logger';

// Rate limit configuration for different endpoints
export const rateLimitConfigs = {
  // Strict limit for authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per window
    message: 'Too many authentication attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
  },
  
  // Standard API rate limit
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
  },
  
  // Relaxed limit for static resources
  static: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // 1000 requests per window
    message: 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
  }
};

// Create rate limiter with Redis store
export const createRateLimiter = (config: keyof typeof rateLimitConfigs) => {
  const limiterConfig = rateLimitConfigs[config];
  
  // Use Redis store if available, fallback to memory store
  if (redisClient.isReady) {
    return rateLimit({
      ...limiterConfig,
      store: new RedisStore({
        client: redisClient,
        prefix: `rl:${config}:`,
      }),
      // Custom key generator for better tracking
      keyGenerator: (req: Request) => {
        // Use user ID if authenticated, otherwise use IP
        const userId = (req as any).user?.id;
        return userId || req.ip;
      },
      // Custom handler for rate limit exceeded
      handler: (req: Request, res: Response) => {
        logger.warn('Rate limit exceeded', {
          ip: req.ip,
          path: req.path,
          userId: (req as any).user?.id,
          config,
        });
        
        res.status(429).json({
          error: 'Too Many Requests',
          message: limiterConfig.message,
          retryAfter: req.rateLimit?.resetTime,
        });
      },
    });
  }
  
  // Fallback to memory store
  logger.warn('Redis not available, using memory store for rate limiting');
  return rateLimit({
    ...limiterConfig,
    keyGenerator: (req: Request) => {
      const userId = (req as any).user?.id;
      return userId || req.ip;
    },
  });
};

// Specific rate limiters
export const authRateLimiter = createRateLimiter('auth');
export const apiRateLimiter = createRateLimiter('api');
export const staticRateLimiter = createRateLimiter('static');

// Dynamic rate limiter based on user role
export const dynamicRateLimiter = (req: Request, res: Response, next: Function) => {
  const user = (req as any).user;
  
  // Premium users get higher limits
  if (user?.role === 'premium') {
    return rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 1000,
      keyGenerator: () => user.id,
    })(req, res, next);
  }
  
  // Default to standard API limit
  return apiRateLimiter(req, res, next);
};
