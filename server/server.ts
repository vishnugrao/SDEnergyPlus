import express from "express";
import type { Express } from "express";
import cors from "cors";
import Redis from "ioredis";
import buildingDesignsRouter from "./routes/buildingDesigns.js";
import analysisRouter from "./routes/analysis.js";
import { initializeDatabase } from "./db/init.js";
import { logger } from "./utils/logger.js";

const PORT = process.env.PORT || 5050;
const app: Express = express();

// Initialize Redis client with retry strategy
const redis = new (Redis as any)({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/building-designs', buildingDesignsRouter);
app.use('/analysis', analysisRouter);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        redis: redis.status === 'ready' ? 'connected' : 'disconnected'
    });
});

redis.on("error", (error: Error) => {
    logger.error("Redis Client Error:", error);
});

redis.on("connect", () => {
    logger.info("Connected to Redis");
});

// Start server
async function startServer() {
    try {
        // Initialize database
        await initializeDatabase();
        
        // Start server
        app.listen(PORT, () => {
            logger.info(`Server listening on port ${PORT}`);
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();