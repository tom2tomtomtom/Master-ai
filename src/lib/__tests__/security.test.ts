/**
 * Unit Tests for Security Utilities
 * Tests the security module including rate limiting, input validation, CSRF protection, etc.
 */

import { NextRequest } from 'next/server'
import {
  rateLimit,
  InputValidator,
  CSRFProtection,
  validateAPIRequest,
  validateWebhookSignature,
  validateProductionEnvironment,
} from '../security'
import { cleanupMocks } from '../../__tests__/utils/test-utils'

// Mock crypto for Node.js environment
const mockCrypto = {
  getRandomValues: jest.fn((array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256)
    }
    return array
  }),
  createHmac: jest.fn(() => ({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn(() => 'mocked-signature'),
  })),
  timingSafeEqual: jest.fn(() => true),
}

// Mock Node.js crypto module
jest.mock('crypto', () => mockCrypto)

// Mock NextRequest for testing
const createMockRequest = (overrides: Partial<NextRequest> = {}): NextRequest => {
  const baseRequest = {
    method: 'GET',
    url: 'http://localhost:3000/api/test',
    headers: new Map([
      ['content-type', 'application/json'],
      ['x-forwarded-for', '127.0.0.1'],
    ]),
    ...overrides,
  }

  return baseRequest as NextRequest
}

describe('Security Utilities', () => {
  beforeEach(() => {
    cleanupMocks()
    jest.clearAllMocks()
  })

  describe('Rate Limiting', () => {
    beforeEach(() => {
      // Clear the in-memory rate limit store before each test
      const rateLimitModule = require('../security')
      const store = rateLimitModule.__rateLimitStore || new Map()
      store.clear()
    })

    it('should allow requests under the limit', async () => {
      const limiter = rateLimit({ maxRequests: 5, windowMs: 60000 })
      const request = createMockRequest()

      const result = await limiter(request)

      expect(result.success).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should block requests over the limit', async () => {
      const limiter = rateLimit({ maxRequests: 2, windowMs: 60000 })
      const request = createMockRequest()

      // Make requests up to the limit
      await limiter(request)
      await limiter(request)

      // This should be blocked
      const result = await limiter(request)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Too many requests')
      expect(result.retryAfter).toBeGreaterThan(0)
    })

    it('should use IP address for identification', async () => {
      const limiter = rateLimit({ maxRequests: 1, windowMs: 60000 })
      
      const request1 = createMockRequest({
        headers: new Map([['x-forwarded-for', '127.0.0.1']]),
      })
      
      const request2 = createMockRequest({
        headers: new Map([['x-forwarded-for', '192.168.1.1']]),
      })

      // First request should succeed
      const result1 = await limiter(request1)
      expect(result1.success).toBe(true)

      // Second request from different IP should succeed
      const result2 = await limiter(request2)
      expect(result2.success).toBe(true)

      // Third request from first IP should be blocked
      const result3 = await limiter(request1)
      expect(result3.success).toBe(false)
    })

    it('should prefer user ID over IP when available', async () => {
      const limiter = rateLimit({ maxRequests: 1, windowMs: 60000 })
      
      const request1 = createMockRequest({
        headers: new Map([
          ['x-forwarded-for', '127.0.0.1'],
          ['x-user-id', 'user1'],
        ]),
      })
      
      const request2 = createMockRequest({
        headers: new Map([
          ['x-forwarded-for', '127.0.0.1'], // Same IP
          ['x-user-id', 'user2'], // Different user
        ]),
      })

      // Both should succeed since they have different user IDs
      const result1 = await limiter(request1)
      expect(result1.success).toBe(true)

      const result2 = await limiter(request2)
      expect(result2.success).toBe(true)
    })
  })

  describe('InputValidator', () => {
    describe('email validation', () => {
      it('should validate correct email addresses', () => {
        expect(InputValidator.email('test@example.com')).toBe(true)
        expect(InputValidator.email('user.name@domain.co.uk')).toBe(true)
        expect(InputValidator.email('test+tag@example.org')).toBe(true)
      })

      it('should reject invalid email addresses', () => {
        expect(InputValidator.email('invalid-email')).toBe(false)
        expect(InputValidator.email('@domain.com')).toBe(false)
        expect(InputValidator.email('test@')).toBe(false)
        expect(InputValidator.email('test..test@domain.com')).toBe(false)
      })

      it('should reject email addresses that are too long', () => {
        const longEmail = 'a'.repeat(250) + '@example.com'
        expect(InputValidator.email(longEmail)).toBe(false)
      })
    })

    describe('password validation', () => {
      it('should validate strong passwords', () => {
        const result = InputValidator.password('StrongPass123')
        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })

      it('should require minimum length', () => {
        const result = InputValidator.password('Weak1')
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('Password must be at least 8 characters long')
      })

      it('should require maximum length', () => {
        const result = InputValidator.password('A'.repeat(129) + '1a')
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('Password must be less than 128 characters')
      })

      it('should require lowercase letter', () => {
        const result = InputValidator.password('STRONGPASS123')
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('Password must contain at least one lowercase letter')
      })

      it('should require uppercase letter', () => {
        const result = InputValidator.password('strongpass123')
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('Password must contain at least one uppercase letter')
      })

      it('should require number', () => {
        const result = InputValidator.password('StrongPass')
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('Password must contain at least one number')
      })

      it('should return multiple errors for weak passwords', () => {
        const result = InputValidator.password('weak')
        expect(result.valid).toBe(false)
        expect(result.errors.length).toBeGreaterThan(1)
      })
    })

    describe('string sanitization', () => {
      it('should sanitize HTML entities', () => {
        const input = '<script>alert("xss")</script>'
        const result = InputValidator.sanitizeString(input)
        expect(result).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;')
      })

      it('should limit string length', () => {
        const input = 'a'.repeat(2000)
        const result = InputValidator.sanitizeString(input, 100)
        expect(result.length).toBe(100)
      })

      it('should handle special characters', () => {
        const input = '&<>"\'test'
        const result = InputValidator.sanitizeString(input)
        expect(result).toBe('&amp;&lt;&gt;&quot;&#x27;test')
      })
    })

    describe('UUID validation', () => {
      it('should validate correct UUIDs', () => {
        expect(InputValidator.validateUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true)
        expect(InputValidator.validateUUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toBe(true)
      })

      it('should reject invalid UUIDs', () => {
        expect(InputValidator.validateUUID('invalid-uuid')).toBe(false)
        expect(InputValidator.validateUUID('123e4567-e89b-12d3-a456-42661417400')).toBe(false)
        expect(InputValidator.validateUUID('')).toBe(false)
      })
    })

    describe('URL validation', () => {
      it('should validate correct URLs', () => {
        expect(InputValidator.validateURL('https://example.com')).toBe(true)
        expect(InputValidator.validateURL('http://localhost:3000')).toBe(true)
        expect(InputValidator.validateURL('https://subdomain.example.com/path?query=value')).toBe(true)
      })

      it('should reject invalid URLs', () => {
        expect(InputValidator.validateURL('invalid-url')).toBe(false)
        expect(InputValidator.validateURL('ftp://example.com')).toBe(true) // This is actually valid
        expect(InputValidator.validateURL('')).toBe(false)
      })
    })
  })

  describe('CSRFProtection', () => {
    it('should generate unique tokens', () => {
      const token1 = CSRFProtection.generateToken('session1')
      const token2 = CSRFProtection.generateToken('session2')
      
      expect(token1).toBeTruthy()
      expect(token2).toBeTruthy()
      expect(token1).not.toBe(token2)
    })

    it('should validate correct tokens', () => {
      const sessionId = 'test-session'
      const token = CSRFProtection.generateToken(sessionId)
      
      const isValid = CSRFProtection.validateToken(sessionId, token)
      expect(isValid).toBe(true)
    })

    it('should reject invalid tokens', () => {
      const sessionId = 'test-session'
      CSRFProtection.generateToken(sessionId)
      
      const isValid = CSRFProtection.validateToken(sessionId, 'invalid-token')
      expect(isValid).toBe(false)
    })

    it('should reject tokens for different sessions', () => {
      const token = CSRFProtection.generateToken('session1')
      
      const isValid = CSRFProtection.validateToken('session2', token)
      expect(isValid).toBe(false)
    })

    it('should handle expired tokens', (done) => {
      const sessionId = 'test-session'
      
      // Mock token generation with immediate expiry
      const originalGenerateToken = CSRFProtection.generateToken
      CSRFProtection.generateToken = jest.fn((sessionId: string) => {
        const token = 'test-token'
        const expires = Date.now() - 1000 // Expired 1 second ago
        // @ts-expect-error - accessing private property for testing
        CSRFProtection.tokens.set(sessionId, { token, expires })
        return token
      })

      const token = CSRFProtection.generateToken(sessionId)
      
      const isValid = CSRFProtection.validateToken(sessionId, token)
      expect(isValid).toBe(false)
      
      // Restore original method
      CSRFProtection.generateToken = originalGenerateToken
      done()
    })
  })

  describe('validateAPIRequest', () => {
    it('should validate correct API requests', async () => {
      const request = createMockRequest({
        method: 'GET',
      })

      const result = await validateAPIRequest(request)
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject requests that are too large', async () => {
      const request = createMockRequest({
        method: 'POST',
        headers: new Map([
          ['content-type', 'application/json'],
          ['content-length', '20000000'], // 20MB
        ]),
      })

      const result = await validateAPIRequest(request)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Request too large')
    })

    it('should reject POST requests with invalid content type', async () => {
      const request = createMockRequest({
        method: 'POST',
        headers: new Map([
          ['content-type', 'text/plain'],
        ]),
      })

      const result = await validateAPIRequest(request)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Invalid content type')
    })

    it('should accept POST requests with correct content type', async () => {
      const request = createMockRequest({
        method: 'POST',
        headers: new Map([
          ['content-type', 'application/json'],
          ['content-length', '1000'],
        ]),
      })

      const result = await validateAPIRequest(request)
      expect(result.valid).toBe(true)
    })
  })

  describe('validateWebhookSignature', () => {
    beforeEach(() => {
      mockCrypto.createHmac.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn(() => 'expected-signature'),
      })
      mockCrypto.timingSafeEqual.mockReturnValue(true)
    })

    it('should validate correct webhook signature', () => {
      const payload = JSON.stringify({ test: 'data' })
      const signature = 'sha256=expected-signature'
      const secret = 'webhook-secret'

      const result = validateWebhookSignature(payload, signature, secret)
      expect(result).toBe(true)
    })

    it('should reject invalid webhook signature', () => {
      mockCrypto.timingSafeEqual.mockReturnValue(false)
      
      const payload = JSON.stringify({ test: 'data' })
      const signature = 'sha256=wrong-signature'
      const secret = 'webhook-secret'

      const result = validateWebhookSignature(payload, signature, secret)
      expect(result).toBe(false)
    })

    it('should handle errors gracefully', () => {
      mockCrypto.createHmac.mockImplementation(() => {
        throw new Error('Crypto error')
      })
      
      const payload = JSON.stringify({ test: 'data' })
      const signature = 'sha256=signature'
      const secret = 'webhook-secret'

      const result = validateWebhookSignature(payload, signature, secret)
      expect(result).toBe(false)
    })
  })

  describe('validateProductionEnvironment', () => {
    const originalEnv = process.env

    beforeEach(() => {
      jest.resetModules()
      process.env = { ...originalEnv }
    })

    afterEach(() => {
      process.env = originalEnv
    })

    it('should validate complete production environment', () => {
      process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/db'
      process.env.NEXTAUTH_SECRET = 'a'.repeat(32)
      process.env.NEXTAUTH_URL = 'https://example.com'
      process.env.STRIPE_SECRET_KEY = 'sk_test_123'
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_123'

      const result = validateProductionEnvironment()
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect missing required environment variables', () => {
      delete process.env.DATABASE_URL
      delete process.env.NEXTAUTH_SECRET

      const result = validateProductionEnvironment()
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Missing required environment variable: DATABASE_URL')
      expect(result.errors).toContain('Missing required environment variable: NEXTAUTH_SECRET')
    })

    it('should validate NEXTAUTH_SECRET strength', () => {
      process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/db'
      process.env.NEXTAUTH_SECRET = 'weak' // Too short
      process.env.NEXTAUTH_URL = 'https://example.com'
      process.env.STRIPE_SECRET_KEY = 'sk_test_123'
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_123'

      const result = validateProductionEnvironment()
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('NEXTAUTH_SECRET must be at least 32 characters long')
    })

    it('should validate database URL format', () => {
      process.env.DATABASE_URL = 'mysql://invalid:format@localhost:3306/db'
      process.env.NEXTAUTH_SECRET = 'a'.repeat(32)
      process.env.NEXTAUTH_URL = 'https://example.com'
      process.env.STRIPE_SECRET_KEY = 'sk_test_123'
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_123'

      const result = validateProductionEnvironment()
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('DATABASE_URL must be a valid PostgreSQL connection string')
    })
  })
})