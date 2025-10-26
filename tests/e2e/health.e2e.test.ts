import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/utils/prisma';
import { redisClient } from '../../src/utils/cache/redisClient';

describe('Health Check E2E', () => {
  let server: any;
  
  beforeAll(async () => {
    // Start server on test port
    server = app.listen(0);
  });
  
  afterAll(async () => {
    // Cleanup
    await server.close();
    await prisma.$disconnect();
    await redisClient.quit();
  });
  
  describe('GET /health', () => {
    it('should return 200 with health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.body).toMatchObject({
        status: 'ok',
        version: expect.any(String),
        timestamp: expect.any(String),
        services: {
          database: expect.stringMatching(/connected|disconnected/),
          redis: expect.stringMatching(/connected|disconnected/),
        },
      });
    });
    
    it('should not require authentication', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.body.status).toBe('ok');
    });
    
    it('should include request ID header', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.headers['x-request-id']).toBeDefined();
      expect(response.headers['x-request-id']).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });
  });
  
  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      // Check for important security headers
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
      expect(response.headers['strict-transport-security']).toBeDefined();
    });
  });
  
  describe('Rate Limiting', () => {
    it('should include rate limit headers', async () => {
      const response = await request(app)
        .get('/api/v1/test')
        .expect(404); // Endpoint doesn't exist, but headers should be present
      
      expect(response.headers['x-ratelimit-limit']).toBeDefined();
      expect(response.headers['x-ratelimit-remaining']).toBeDefined();
      expect(response.headers['x-ratelimit-reset']).toBeDefined();
    });
    
    it('should enforce rate limits', async () => {
      // This test assumes auth endpoints have a limit of 5 per 15 minutes
      const requests = Array(6).fill(null).map(() => 
        request(app)
          .post('/api/v1/auth/login')
          .send({ email: 'test@example.com', password: 'wrong' })
      );
      
      const responses = await Promise.all(requests);
      
      // First 5 should fail with 401 (wrong credentials)
      responses.slice(0, 5).forEach(res => {
        expect(res.status).toBe(401);
      });
      
      // 6th should be rate limited
      expect(responses[5].status).toBe(429);
      expect(responses[5].body.error.code).toBe('RATE_LIMIT_EXCEEDED');
    });
  });
  
  describe('CORS', () => {
    it('should handle CORS preflight requests', async () => {
      const response = await request(app)
        .options('/api/v1/users/me')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET')
        .set('Access-Control-Request-Headers', 'authorization')
        .expect(204);
      
      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
      expect(response.headers['access-control-allow-methods']).toContain('GET');
      expect(response.headers['access-control-allow-headers']).toContain('authorization');
    });
    
    it('should reject requests from unauthorized origins', async () => {
      const response = await request(app)
        .get('/api/v1/users/me')
        .set('Origin', 'http://evil-site.com')
        .expect(500); // CORS will throw an error
      
      expect(response.headers['access-control-allow-origin']).toBeUndefined();
    });
  });
  
  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/v1/non-existent-endpoint')
        .expect(404);
      
      expect(response.body).toMatchObject({
        error: {
          id: expect.any(String),
          code: 'NOT_FOUND',
          message: expect.stringContaining('Cannot GET'),
          statusCode: 404,
        },
      });
    });
    
    it('should handle invalid JSON', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .set('Content-Type', 'application/json')
        .send('{ invalid json')
        .expect(400);
      
      expect(response.body.error.code).toBe('BAD_REQUEST');
    });
  });
});
