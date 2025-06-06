import { Redis } from 'ioredis';
import { logger } from '../utils/logger.js';
const CACHE_TTL = 3600; // 1 hour in seconds
export class RedisService {
    constructor() {
        this.client = new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD,
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            }
        });
        this.client.on('error', (error) => {
            logger.error('Redis connection error:', error);
        });
        this.client.on('connect', () => {
            logger.info('Connected to Redis');
        });
    }
    async get(key) {
        try {
            const data = await this.client.get(key);
            return data ? JSON.parse(data) : null;
        }
        catch (error) {
            logger.error('Redis get error:', error);
            return null;
        }
    }
    async set(key, value, ttl = CACHE_TTL) {
        try {
            await this.client.set(key, JSON.stringify(value), 'EX', ttl);
        }
        catch (error) {
            logger.error('Redis set error:', error);
        }
    }
    async del(key) {
        try {
            await this.client.del(key);
        }
        catch (error) {
            logger.error('Redis delete error:', error);
        }
    }
    async flush() {
        try {
            await this.client.flushall();
        }
        catch (error) {
            logger.error('Redis flush error:', error);
        }
    }
    async keys(pattern) {
        try {
            return await this.client.keys(pattern);
        }
        catch (error) {
            logger.error('Redis keys error:', error);
            return [];
        }
    }
    async delMultiple(keys) {
        try {
            if (keys.length > 0) {
                await this.client.del(...keys);
            }
        }
        catch (error) {
            logger.error('Redis delMultiple error:', error);
        }
    }
}
export const redisService = new RedisService();
//# sourceMappingURL=redis.js.map