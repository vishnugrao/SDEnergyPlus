import express from 'express';
import cors from 'cors';
import { logger } from './utils/logger.js';
import analysisRouter from './routes/analysis.js';
import buildingDesignsRouter from './routes/buildingDesigns.js';
import { initializeDatabase } from './db/init.js';

const app = express();
const port = process.env.PORT || 5050;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/analysis', analysisRouter);
app.use('/building-designs', buildingDesignsRouter);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});

// Initialize database and start server
async function startServer() {
    try {
        // Initialize database
        await initializeDatabase();
        
        // Start server
        app.listen(port, () => {
            logger.info(`Server is running on port ${port}`);
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer(); 