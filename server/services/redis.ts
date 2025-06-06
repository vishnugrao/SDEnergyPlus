import Redis from 'ioredis';
import { logger } from '../utils/logger.js';

const CACHE_TTL = 3600; // 1 hour in seconds

export class RedisService {
    private client: Redis.Redis;

    constructor() {
        this.client = new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            retryStrategy: (times: number) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            }
        });

        this.client.on('error', (err: Error) => logger.error('Redis Client Error:', err));
        this.client.on('connect', () => logger.info('Connected to Redis'));
    }

    async get<T>(key: string): Promise<T | null> {
        try {
            const data = await this.client.get(key);
            return data ? JSON.parse(data) as T : null;
        } catch (error) {
            logger.error('Error getting from Redis:', error);
            return null;
        }
    }

    async set(key: string, value: any): Promise<void> {
        try {
            await this.client.set(key, JSON.stringify(value), 'EX', CACHE_TTL);
        } catch (error) {
            logger.error('Error setting in Redis:', error);
        }
    }

    async del(key: string): Promise<void> {
        try {
            await this.client.del(key);
        } catch (error) {
            logger.error('Error deleting from Redis:', error);
        }
    }

    async flush(): Promise<void> {
        try {
            await this.client.flushall();
        } catch (error) {
            logger.error('Redis flush error:', error);
        }
    }

    async keys(pattern: string): Promise<string[]> {
        try {
            return await this.client.keys(pattern);
        } catch (error) {
            logger.error('Error getting keys from Redis:', error);
            return [];
        }
    }

    async delMultiple(keys: string[]): Promise<void> {
        try {
            if (keys.length > 0) {
                await this.client.del(...keys);
            }
        } catch (error) {
            logger.error('Error deleting multiple keys from Redis:', error);
        }
    }
}

export const redisService = new RedisService(); 