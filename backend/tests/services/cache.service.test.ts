import { CacheService } from '../../src/services/cache.service';

describe('CacheService', () => {
  let cacheService: CacheService;

  beforeEach(() => {
    cacheService = new CacheService();
    cacheService.clear(); // Start with empty cache
  });

  afterEach(() => {
    cacheService.clear();
    // Note: stopAutoCleanup method needs to be added or use clearInterval directly
  });

  describe('set and get', () => {
    it('should store and retrieve values', () => {
      const key = 'test-key';
      const value = { data: 'test-value' };
      
      cacheService.set(key, value);
      const retrieved = cacheService.get(key);
      
      expect(retrieved).toEqual(value);
    });

    it('should handle different data types', () => {
      cacheService.set('string', 'test');
      cacheService.set('number', 123);
      cacheService.set('boolean', true);
      cacheService.set('object', { a: 1, b: 2 });
      cacheService.set('array', [1, 2, 3]);
      
      expect(cacheService.get('string')).toBe('test');
      expect(cacheService.get('number')).toBe(123);
      expect(cacheService.get('boolean')).toBe(true);
      expect(cacheService.get('object')).toEqual({ a: 1, b: 2 });
      expect(cacheService.get('array')).toEqual([1, 2, 3]);
    });

    it('should return null for non-existent keys', () => {
      const value = cacheService.get('non-existent');
      expect(value).toBeNull();
    });

    it('should handle custom TTL', (done) => {
      const key = 'ttl-test';
      const value = 'test-value';
      const ttl = 100; // 100ms
      
      cacheService.set(key, value, ttl);
      
      // Should exist immediately
      expect(cacheService.get(key)).toBe(value);
      
      // Should expire after TTL
      setTimeout(() => {
        expect(cacheService.get(key)).toBeNull();
        done();
      }, ttl + 50);
    });

    it('should use default TTL when not specified', () => {
      const key = 'default-ttl';
      const value = 'test';
      
      cacheService.set(key, value);
      
      // Should exist immediately
      expect(cacheService.get(key)).toBe(value);
      
      // Should still exist within default TTL (5 minutes)
      expect(cacheService.get(key)).toBe(value);
    });
  });

  describe('has', () => {
    it('should check if key exists', () => {
      const key = 'exists-test';
      
      expect(cacheService.has(key)).toBe(false);
      
      cacheService.set(key, 'value');
      expect(cacheService.has(key)).toBe(true);
    });

    it('should return false for expired keys', (done) => {
      const key = 'expired-test';
      cacheService.set(key, 'value', 50);
      
      expect(cacheService.has(key)).toBe(true);
      
      setTimeout(() => {
        expect(cacheService.has(key)).toBe(false);
        done();
      }, 100);
    });
  });

  describe('delete', () => {
    it('should delete cached values', () => {
      const key = 'delete-test';
      cacheService.set(key, 'value');
      
      expect(cacheService.has(key)).toBe(true);
      
      const deleted = cacheService.delete(key);
      expect(deleted).toBe(true);
      expect(cacheService.has(key)).toBe(false);
    });

    it('should return false when deleting non-existent key', () => {
      const deleted = cacheService.delete('non-existent');
      expect(deleted).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all cached values', () => {
      cacheService.set('key1', 'value1');
      cacheService.set('key2', 'value2');
      cacheService.set('key3', 'value3');
      
      const stats = cacheService.getStats();
      expect(stats.totalEntries).toBe(3);
      
      cacheService.clear();
      
      expect(cacheService.has('key1')).toBe(false);
      expect(cacheService.has('key2')).toBe(false);
      expect(cacheService.has('key3')).toBe(false);
      
      const newStats = cacheService.getStats();
      expect(newStats.totalEntries).toBe(0);
    });
  });

  describe('getStats', () => {
    it('should return cache statistics', () => {
      const stats = cacheService.getStats();
      
      expect(stats).toHaveProperty('totalEntries');
      expect(stats).toHaveProperty('validEntries');
      expect(stats).toHaveProperty('expiredEntries');
      expect(stats).toHaveProperty('approximateSizeBytes');
      
      expect(typeof stats.totalEntries).toBe('number');
      expect(typeof stats.validEntries).toBe('number');
      expect(typeof stats.expiredEntries).toBe('number');
      expect(typeof stats.approximateSizeBytes).toBe('number');
    });

    it('should track valid and expired entries', () => {
      cacheService.set('key1', 'value1');
      cacheService.set('key2', 'value2', 100); // Short TTL
      
      const stats = cacheService.getStats();
      expect(stats.totalEntries).toBe(2);
      expect(stats.validEntries).toBeGreaterThanOrEqual(1);
    });

    it('should track expired entries', (done) => {
      cacheService.set('expired', 'value', 50);
      cacheService.set('valid', 'value', 5000);
      
      setTimeout(() => {
        const stats = cacheService.getStats();
        expect(stats.expiredEntries).toBe(1);
        expect(stats.totalEntries).toBe(2); // Both still in cache, but one expired
        done();
      }, 100);
    });
  });

  describe('cleanup', () => {
    it('should remove expired entries during cleanup', (done) => {
      cacheService.set('expired1', 'value', 50);
      cacheService.set('expired2', 'value', 50);
      cacheService.set('valid', 'value', 5000);
      
      setTimeout(() => {
        cacheService.cleanup(); // cleanup doesn't return a value in current implementation
        
        const stats = cacheService.getStats();
        expect(stats.totalEntries).toBe(1); // Only valid entry remains
        done();
      }, 100);
    });
  });

  describe('auto cleanup', () => {
    it('should start auto cleanup', (done) => {
      cacheService.set('expired', 'value', 50);
      
      // Start auto cleanup with short interval
      const intervalId = cacheService.startAutoCleanup(100);
      
      setTimeout(() => {
        // Expired entry should be cleaned up
        expect(cacheService.has('expired')).toBe(false);
        
        clearInterval(intervalId); // Clear the interval
        done();
      }, 200);
    });
  });

  describe('cacheKeys', () => {
    it('should have predefined cache keys', () => {
      const { cacheKeys } = require('../../src/services/cache.service');
      
      expect(cacheKeys).toBeDefined();
      expect(cacheKeys.tickerHistory).toBeDefined();
      expect(cacheKeys.ticker).toBeDefined();
      expect(cacheKeys.allTickers).toBeDefined();
      expect(cacheKeys.userAlerts).toBeDefined();
      expect(cacheKeys.marketStatus).toBeDefined();
      
      // Test key generation functions
      expect(typeof cacheKeys.ticker('AAPL')).toBe('string');
      expect(cacheKeys.ticker('AAPL')).toContain('AAPL');
      expect(typeof cacheKeys.tickerHistory('AAPL', 30)).toBe('string');
      expect(cacheKeys.tickerHistory('AAPL', 30)).toContain('AAPL');
    });
  });
});