import { Cached, InvalidateCache, Memoize } from '../../src/utils/cache/cacheDecorator';
import { cache } from '../../src/utils/cache/redisClient';

// Mock the cache module
jest.mock('../../src/utils/cache/redisClient', () => ({
  cache: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    clear: jest.fn(),
  },
}));

// Mock logger
jest.mock('../../src/utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Cache Decorators', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ENABLE_CACHE = 'true';
  });
  
  describe('@Cached', () => {
    class TestService {
      public callCount = 0;
      
      @Cached({ ttl: 300 })
      async getData(id: string) {
        this.callCount++;
        return { id, data: `Data for ${id}` };
      }
      
      @Cached({ 
        ttl: 60,
        condition: (id: string) => id !== 'nocache'
      })
      async getConditionalData(id: string) {
        return { id, timestamp: Date.now() };
      }
      
      @Cached({
        keyGenerator: (id: string, type: string) => `custom:${type}:${id}`
      })
      async getCustomKeyData(id: string, type: string) {
        return { id, type };
      }
    }
    
    it('should cache method results', async () => {
      const service = new TestService();
      const mockGet = cache.get as jest.Mock;
      const mockSet = cache.set as jest.Mock;
      
      // First call - cache miss
      mockGet.mockResolvedValueOnce(null);
      mockSet.mockResolvedValueOnce(true);
      
      const result1 = await service.getData('123');
      
      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('123'));
      expect(mockSet).toHaveBeenCalledWith(
        expect.stringContaining('123'),
        { id: '123', data: 'Data for 123' },
        300
      );
      expect(service.callCount).toBe(1);
      
      // Second call - cache hit
      mockGet.mockResolvedValueOnce({ id: '123', data: 'Data for 123' });
      
      const result2 = await service.getData('123');
      
      expect(mockGet).toHaveBeenCalledTimes(2);
      expect(service.callCount).toBe(1); // Original method not called
      expect(result2).toEqual(result1);
    });
    
    it('should respect cache conditions', async () => {
      const service = new TestService();
      const mockGet = cache.get as jest.Mock;
      const mockSet = cache.set as jest.Mock;
      
      mockGet.mockResolvedValue(null);
      
      // This should be cached
      await service.getConditionalData('123');
      expect(mockSet).toHaveBeenCalled();
      
      // This should not be cached
      mockSet.mockClear();
      await service.getConditionalData('nocache');
      expect(mockSet).not.toHaveBeenCalled();
    });
    
    it('should use custom key generator', async () => {
      const service = new TestService();
      const mockGet = cache.get as jest.Mock;
      
      mockGet.mockResolvedValueOnce(null);
      
      await service.getCustomKeyData('123', 'user');
      
      expect(mockGet).toHaveBeenCalledWith('custom:user:123');
    });
    
    it('should bypass cache when disabled', async () => {
      process.env.ENABLE_CACHE = 'false';
      
      const service = new TestService();
      const mockGet = cache.get as jest.Mock;
      
      await service.getData('123');
      
      expect(mockGet).not.toHaveBeenCalled();
      expect(service.callCount).toBe(1);
    });
    
    it('should handle cache errors gracefully', async () => {
      const service = new TestService();
      const mockGet = cache.get as jest.Mock;
      
      mockGet.mockRejectedValueOnce(new Error('Redis error'));
      
      const result = await service.getData('123');
      
      expect(result).toEqual({ id: '123', data: 'Data for 123' });
      expect(service.callCount).toBe(1);
    });
  });
  
  describe('@InvalidateCache', () => {
    class TestService {
      @InvalidateCache({
        keyGenerator: (id: string) => `user:${id}`
      })
      async updateUser(id: string, data: any) {
        return { id, ...data };
      }
      
      @InvalidateCache({
        patterns: ['user:*', 'session:*']
      })
      async clearAllCaches() {
        return { cleared: true };
      }
    }
    
    it('should invalidate specific cache keys', async () => {
      const service = new TestService();
      const mockDel = cache.del as jest.Mock;
      
      mockDel.mockResolvedValueOnce(1);
      
      await service.updateUser('123', { name: 'Test' });
      
      expect(mockDel).toHaveBeenCalledWith('user:123');
    });
    
    it('should clear cache patterns', async () => {
      const service = new TestService();
      const mockClear = cache.clear as jest.Mock;
      
      mockClear.mockResolvedValueOnce(5);
      mockClear.mockResolvedValueOnce(3);
      
      await service.clearAllCaches();
      
      expect(mockClear).toHaveBeenCalledWith('user:*');
      expect(mockClear).toHaveBeenCalledWith('session:*');
    });
  });
  
  describe('@Memoize', () => {
    class Calculator {
      public callCount = 0;
      
      @Memoize({ ttl: 60 })
      fibonacci(n: number): number {
        this.callCount++;
        if (n <= 1) return n;
        return this.fibonacci(n - 1) + this.fibonacci(n - 2);
      }
      
      @Memoize()
      add(a: number, b: number): number {
        this.callCount++;
        return a + b;
      }
    }
    
    it('should memoize function results', () => {
      const calc = new Calculator();
      
      // First call
      const result1 = calc.add(2, 3);
      expect(result1).toBe(5);
      expect(calc.callCount).toBe(1);
      
      // Second call with same args - memoized
      const result2 = calc.add(2, 3);
      expect(result2).toBe(5);
      expect(calc.callCount).toBe(1);
      
      // Different args - new calculation
      const result3 = calc.add(3, 4);
      expect(result3).toBe(7);
      expect(calc.callCount).toBe(2);
    });
    
    it('should respect TTL for memoization', async () => {
      const calc = new Calculator();
      
      // Mock time
      const now = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(now);
      
      calc.fibonacci(5);
      const count1 = calc.callCount;
      
      // Call again - should be memoized
      calc.fibonacci(5);
      expect(calc.callCount).toBe(count1);
      
      // Advance time past TTL
      jest.spyOn(Date, 'now').mockReturnValue(now + 61000);
      
      // Should recalculate
      calc.fibonacci(5);
      expect(calc.callCount).toBeGreaterThan(count1);
    });
  });
});
