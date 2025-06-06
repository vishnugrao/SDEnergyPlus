import express from 'express';
import cors from 'cors';
import buildingDesignsRouter from './routes/buildingDesigns.js';
import analysisRouter from './routes/analysis.js';
const app = express();
const port = process.env.PORT || 5050;
// Middleware
app.use(cors());
app.use(express.json());
// Routes
app.use('/building-designs', buildingDesignsRouter);
app.use('/analysis', analysisRouter);
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});
// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
//# sourceMappingURL=index.js.map