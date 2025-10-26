/**
 * Rate Limiting Middleware for Next.js
 * Implements express-rate-limit style functionality for API routes
 */

import { NextRequest, NextResponse } from 'next/server';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (request: NextRequest) => string;
}

// In-memory store (in production, use Redis)
const store: RateLimitStore = {};

/**
 * Create a rate limiter middleware
 */
export function createRateLimit(config: RateLimitConfig) {
  const {
    windowMs,
    maxRequests,
    message = 'Too many requests, please try again later.',
    standardHeaders = true,
    legacyHeaders = true,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    keyGenerator = (request) => getClientIp(request),
  } = config;

  return async function rateLimitMiddleware(
    request: NextRequest,
    response: NextResponse
  ): Promise<NextResponse | null> {
    // Skip rate limiting if disabled via environment
    if (process.env.ENABLE_RATE_LIMITING === 'false') {
      return null;
    }

    const key = keyGenerator(request);
    const now = Date.now();
    
    // Clean up expired entries
    Object.keys(store).forEach(k => {
      if (store[k].resetTime < now) {
        delete store[k];
      }
    });

    // Get or create entry
    if (!store[key]) {
      store[key] = {
        count: 0,
        resetTime: now + windowMs,
      };
    }

    const entry = store[key];

    // Reset if window has passed
    if (now >= entry.resetTime) {
      entry.count = 0;
      entry.resetTime = now + windowMs;
    }

    // Increment count
    entry.count++;

    // Set headers
    const headers = new Headers();
    
    if (standardHeaders) {
      headers.set('RateLimit-Limit', maxRequests.toString());
      headers.set('RateLimit-Remaining', Math.max(0, maxRequests - entry.count).toString());
      headers.set('RateLimit-Reset', new Date(entry.resetTime).toISOString());
    }

    if (legacyHeaders) {
      headers.set('X-RateLimit-Limit', maxRequests.toString());
      headers.set('X-RateLimit-Remaining', Math.max(0, maxRequests - entry.count).toString());
      headers.set('X-RateLimit-Reset', Math.floor(entry.resetTime / 1000).toString());
    }

    // Check if limit exceeded
    if (entry.count > maxRequests) {
      headers.set('Retry-After', Math.ceil((entry.resetTime - now) / 1000).toString());
      
      return new NextResponse(
        JSON.stringify({
          error: message,
          retryAfter: Math.ceil((entry.resetTime - now) / 1000),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...Object.fromEntries(headers.entries()),
          },
        }
      );
    }

    // Add headers to successful response
    const modifiedResponse = response || new NextResponse();
    headers.forEach((value, key) => {
      modifiedResponse.headers.set(key, value);
    });

    return null; // Continue to next middleware
  };
}

/**
 * Get client IP address
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfIp = request.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp.trim();
  }
  
  if (cfIp) {
    return cfIp.trim();
  }
  
  // Fallback - this won't work in serverless, but prevents crashes
  return 'unknown';
}

/**
 * Pre-configured rate limiters for different use cases
 */
export const rateLimiters = {
  // General API rate limiting
  api: createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: 'Too many API requests, please try again later.',
  }),

  // Authentication endpoints
  auth: createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many authentication attempts, please try again later.',
  }),

  // Password reset
  passwordReset: createRateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    message: 'Too many password reset attempts, please try again later.',
  }),

  // File uploads
  upload: createRateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20,
    message: 'Too many file uploads, please try again later.',
  }),

  // Search/expensive operations
  search: createRateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    message: 'Too many search requests, please slow down.',
  }),
};

/**
 * Helper to apply rate limiting to API routes
 */
export async function withRateLimit(
  request: NextRequest,
  response: NextResponse,
  limiter: ReturnType<typeof createRateLimit>
): Promise<NextResponse> {
  const limitResponse = await limiter(request, response);
  return limitResponse || response;
}

/**
 * Environment-based configuration
 */
export const getRateLimitConfig = () => ({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  enabled: process.env.ENABLE_RATE_LIMITING !== 'false',
});