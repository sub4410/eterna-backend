import Redis from 'ioredis';
import logger from '../utils/logger';

export class CacheManager {
  private client!: Redis;
  private defaultTTL: number;
  private enabled: boolean;

  constructor() {
    this.defaultTTL = parseInt(process.env.CACHE_TTL || '30');
    this.enabled = process.env.CACHE_ENABLED !== 'false';

    if (this.enabled) {
      // Support both REDIS_URL (Railway/Upstash) and separate host/port/password
      const redisUrl = process.env.REDIS_URL?.trim();
      
      logger.info('Initializing Redis connection', {
        hasRedisUrl: !!redisUrl,
        redisHost: process.env.REDIS_HOST,
        environment: process.env.NODE_ENV,
      });

      if (redisUrl) {
        // Railway/Upstash provides REDIS_URL
        this.client = new Redis(redisUrl, {
          retryStrategy: (times) => {
            if (times > 10) return null; // Stop retrying after 10 attempts
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
          lazyConnect: true,
          // Enable TLS for rediss:// URLs
          tls: redisUrl.startsWith('rediss://') ? {} : undefined,
          family: 4, // Force IPv4
          maxRetriesPerRequest: 3,
        });
      } else {
        // Fallback to separate credentials
        this.client = new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          password: process.env.REDIS_PASSWORD || undefined,
          retryStrategy: (times) => {
            if (times > 10) return null;
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
          lazyConnect: true,
          family: 4,
          maxRetriesPerRequest: 3,
        });
      }

      this.client.on('error', (err) => {
        logger.error('Redis connection error', { error: err.message });
      });

      this.client.on('connect', () => {
        logger.info('✅ Redis connected successfully');
      });

      this.client.on('ready', () => {
        logger.info('✅ Redis is ready to accept commands');
      });

      this.client.on('close', () => {
        logger.warn('Redis connection closed');
      });

      this.client.on('reconnecting', () => {
        logger.info('Reconnecting to Redis...');
      });
    } else {
      logger.warn('⚠️  Cache is disabled (CACHE_ENABLED=false)');
    }
  }

  async connect(): Promise<void> {
    if (this.enabled && this.client) {
      try {
        await this.client.connect();
      } catch (error) {
        logger.error('Failed to connect to Redis', { error });
        this.enabled = false;
      }
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.enabled) return null;

    try {
      const data = await this.client.get(key);
      if (!data) return null;
      
      return JSON.parse(data) as T;
    } catch (error) {
      logger.error('Cache get failed', { key, error });
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (!this.enabled) return;

    try {
      const serialized = JSON.stringify(value);
      const expiry = ttl || this.defaultTTL;
      
      await this.client.setex(key, expiry, serialized);
      logger.debug('Cache set', { key, ttl: expiry });
    } catch (error) {
      logger.error('Cache set failed', { key, error });
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.enabled) return;

    try {
      await this.client.del(key);
      logger.debug('Cache deleted', { key });
    } catch (error) {
      logger.error('Cache delete failed', { key, error });
    }
  }

  async deletePattern(pattern: string): Promise<void> {
    if (!this.enabled) return;

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
        logger.debug('Cache pattern deleted', { pattern, count: keys.length });
      }
    } catch (error) {
      logger.error('Cache pattern delete failed', { pattern, error });
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.enabled) return false;

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Cache exists check failed', { key, error });
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.enabled && this.client) {
      await this.client.quit();
      logger.info('Redis disconnected');
    }
  }
}

export const cacheManager = new CacheManager();
