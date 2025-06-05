import express from "express";
import cors from "cors";
import Redis from "ioredis";
import buildingDesigns from "./routes/buildingDesigns.js";
import analysis from "./routes/analysis.js";
const PORT = process.env.PORT || 5050;
const app = express();
// Initialize Redis client
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
// Middleware
app.use(cors());
app.use(express.json());
// Redis error handling
redis.on("error", (error) => {
    console.error("Redis error:", error);
});
// Routes
app.use('/building-designs', buildingDesigns);
app.use('/analysis', analysis);
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
