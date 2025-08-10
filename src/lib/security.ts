/**
 * Security Configuration and Utilities
 * 
 * This module provides security utilities, rate limiting, input validation,
 * and other security measures for the production application.
 */

import { NextRequest } from 'next/server';

// Rate limiting configuration
interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  skipFailedRequests?: boolean;
  skipSuccessfulRequests?: boolean;
}

// In-memory rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate limiting middleware
 */
export function rateLimit(config: RateLimitConfig) {
  return async (request: NextRequest): Promise<{ success: boolean; error?: string; retryAfter?: number }> => {
    const identifier = getClientIdentifier(request);
    const now = Date.now();
    
    // Clean up expired entries
    cleanupExpiredEntries(now);
    
    const key = `${identifier}:${Math.floor(now / config.windowMs)}`;
    const current = rateLimitStore.get(key) || { count: 0, resetTime: now + config.windowMs };
    
    if (current.count >= config.maxRequests) {
      const retryAfter = Math.ceil((current.resetTime - now) / 1000);
      return {
        success: false,
        error: 'Too many requests',
        retryAfter,
      };
    }
    
    rateLimitStore.set(key, {
      count: current.count + 1,
      resetTime: current.resetTime,
    });
    
    return { success: true };
  };
}

/**
 * Get client identifier for rate limiting
 */
function getClientIdentifier(request: NextRequest): string {
  // Try to get real IP from headers (Vercel/proxy headers)
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const remoteAddr = request.headers.get('remote-addr');
  
  const ip = forwardedFor?.split(',')[0].trim() || realIP || remoteAddr || 'unknown';
  
  // For authenticated requests, include user ID for more granular limiting
  const userId = request.headers.get('x-user-id');
  
  return userId ? `user:${userId}` : `ip:${ip}`;
}

/**
 * Clean up expired rate limit entries
 */
function cleanupExpiredEntries(now: number) {
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Input validation and sanitization
 */
export class InputValidator {
  static email(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }
  
  static password(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (password.length > 128) {
      errors.push('Password must be less than 128 characters');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }
  
  static sanitizeString(input: string, maxLength: number = 1000, request?: NextRequest): string {
    const original = input;
    
    // Detect potential XSS attempts
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>/gi,
      /<object[^>]*>/gi,
      /<embed[^>]*>/gi,
      /<link[^>]*>/gi,
      /<meta[^>]*>/gi,
      /expression\(/gi,
      /vbscript:/gi,
      /data:text\/html/gi
    ];
    
    const hasXSS = xssPatterns.some(pattern => pattern.test(input));
    
    if (hasXSS && request) {
      // Log XSS attempt - using dynamic import to avoid circular dependency
      import('./logger').then(({ appLogger }) => {
        appLogger.security.xssAttemptBlocked(original, {
          ip: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
          endpoint: request.nextUrl?.pathname || 'unknown'
        });
      }).catch(() => {
        // Fallback logging if logger not available
        console.warn('XSS attempt detected:', original.substring(0, 100));
      });
    }
    
    // Basic HTML entity encoding and length limiting
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .substring(0, maxLength);
  }
  
  static validateUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
  
  static validateURL(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * CSRF Protection
 */
export class CSRFProtection {
  private static tokens = new Map<string, { token: string; expires: number }>();
  
  static generateToken(sessionId: string): string {
    const token = this.generateRandomToken();
    const expires = Date.now() + (1000 * 60 * 60); // 1 hour
    
    this.tokens.set(sessionId, { token, expires });
    return token;
  }
  
  static validateToken(sessionId: string, token: string): boolean {
    const stored = this.tokens.get(sessionId);
    
    if (!stored || stored.expires < Date.now()) {
      this.tokens.delete(sessionId);
      return false;
    }
    
    return stored.token === token;
  }
  
  private static generateRandomToken(): string {
    const array = new Uint8Array(32);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(array);
    } else {
      // Fallback for Node.js environment
      const nodeCrypto = require('crypto');
      array.set(nodeCrypto.randomBytes(32));
    }
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
}

/**
 * Content Security Policy configuration
 */
export const cspDirectives = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'", // Required for Next.js
    "'unsafe-eval'", // Required for development
    'https://js.stripe.com',
    'https://checkout.stripe.com',
    'https://cdn.jsdelivr.net',
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Required for CSS-in-JS
    'https://fonts.googleapis.com',
  ],
  'img-src': [
    "'self'",
    'data:',
    'https:',
    'blob:',
  ],
  'font-src': [
    "'self'",
    'https://fonts.gstatic.com',
  ],
  'connect-src': [
    "'self'",
    'https://api.stripe.com',
    'https://*.sentry.io',
    'https://app.posthog.com',
  ],
  'frame-src': [
    'https://js.stripe.com',
    'https://checkout.stripe.com',
  ],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
};

/**
 * Security headers configuration
 */
export const securityHeaders = {
  // Prevent XSS attacks
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  
  // HSTS (HTTP Strict Transport Security)
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  
  // Referrer Policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permissions Policy
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(self)',
  
  // Content Security Policy
  'Content-Security-Policy': Object.entries(cspDirectives)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; '),
};

/**
 * API request validation
 */
export async function validateAPIRequest(request: NextRequest): Promise<{
  valid: boolean;
  error?: string;
}> {
  // Check request size
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) { // 10MB limit
    return { valid: false, error: 'Request too large' };
  }
  
  // Check content type for POST/PUT requests
  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return { valid: false, error: 'Invalid content type' };
    }
  }
  
  // Basic rate limiting
  const rateLimitResult = await rateLimit({
    maxRequests: 100,
    windowMs: 15 * 60 * 1000, // 15 minutes
  })(request);
  
  if (!rateLimitResult.success) {
    return { valid: false, error: rateLimitResult.error };
  }
  
  return { valid: true };
}

/**
 * Webhook signature validation (for Stripe webhooks)
 */
export function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(`sha256=${expectedSignature}`, 'utf8'),
      Buffer.from(signature, 'utf8')
    );
  } catch (_error) {
    return false;
  }
}

/**
 * Environment variable validation for production
 */
export function validateProductionEnvironment(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  const requiredVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
  ];
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  }
  
  // Validate NEXTAUTH_SECRET strength
  if (process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length < 32) {
    errors.push('NEXTAUTH_SECRET must be at least 32 characters long');
  }
  
  // Validate database URL format
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('postgres://')) {
    errors.push('DATABASE_URL must be a valid PostgreSQL connection string');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}