import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { db } from '../db/connection.js';
import { EnergyAnalysisService } from '../services/energyAnalysis.js';
const router = Router();
const energyAnalysisService = new EnergyAnalysisService();
// Get analysis results for a building
router.get('/:buildingId', (async (req, res) => {
    try {
        const { buildingId } = req.params;
        const results = await db.collection('analysisResults')
            .find({ buildingDesignId: new ObjectId(buildingId) })
            .sort({ createdAt: -1 })
            .toArray();
        res.json(results);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch analysis results' });
    }
}));
// Analyze a building design for a specific city
router.post('/analyze', (async (req, res) => {
    try {
        const { buildingDesignId, cityName } = req.body;
        // Fetch building design
        const buildingDesign = await db.collection('buildingDesigns').findOne({
            _id: new ObjectId(buildingDesignId)
        });
        if (!buildingDesign) {
            return res.status(404).json({ error: 'Building design not found' });
        }
        // Fetch city data
        const cityData = await db.collection('cityData').findOne({
            name: cityName
        });
        if (!cityData) {
            return res.status(404).json({ error: 'City data not found' });
        }
        // Perform analysis
        const analysisResult = energyAnalysisService.analyzeBuilding(buildingDesign, cityData);
        // Save analysis result
        const result = await db.collection('analysisResults').insertOne(analysisResult);
        res.status(201).json({ ...analysisResult, _id: result.insertedId });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to perform energy analysis' });
    }
}));
// Compare analysis results between two building designs
router.get('/compare/:design1Id/:design2Id', async (req, res) => {
    try {
        const [results1, results2] = await Promise.all([
            db.collection('analysisResults')
                .find({ buildingDesignId: new ObjectId(req.params.design1Id) })
                .toArray(),
            db.collection('analysisResults')
                .find({ buildingDesignId: new ObjectId(req.params.design2Id) })
                .toArray()
        ]);
        res.json({
            design1: results1,
            design2: results2
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to compare analysis results' });
    }
});
export default router;
//# sourceMappingURL=analysis.js.map