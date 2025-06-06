import { Router, Request, Response, RequestHandler } from 'express';
import { ObjectId } from 'mongodb';
import { db } from '../db/connection.ts';
import { EnergyAnalysisService } from '../services/energyAnalysis.ts';
import { BuildingDesign, CityData, AnalysisResult } from '../db/schemas.ts';
import { logger } from '../utils/logger.ts';
import { redisService } from '../services/redis.ts';

const router = Router();
const energyAnalysisService = new EnergyAnalysisService();

// Validate city data structure
function validateCityData(cityData: any): cityData is CityData {
    if (!cityData || typeof cityData !== 'object') {
        return false;
    }

    if (!cityData.name || typeof cityData.name !== 'string') {
        return false;
    }

    if (!cityData.solarRadiation || typeof cityData.solarRadiation !== 'object') {
        return false;
    }

    const requiredRadiation = ['north', 'south', 'east', 'west', 'roof'];
    for (const direction of requiredRadiation) {
        if (typeof cityData.solarRadiation[direction] !== 'number') {
            return false;
        }
    }

    if (typeof cityData.electricityRate !== 'number') {
        return false;
    }

    return true;
}

// Get analysis results for multiple building designs across all cities
router.get('/buildings', (async (req: Request, res: Response) => {
    try {
        const { ids } = req.query;
        
        logger.info('Fetching analysis for buildings across all cities');

        let buildingIds: ObjectId[];
        if (ids) {
            buildingIds = (ids as string).split(',').map(id => new ObjectId(id));
        } else {
            // If no IDs provided, get all buildings
            const allBuildings = await db.collection('buildingDesigns').find({}).toArray();
            buildingIds = allBuildings.map(b => b._id);
        }
        
        // Fetch all building designs
        const buildingDesigns = await db.collection('buildingDesigns')
            .find({ _id: { $in: buildingIds } })
            .toArray() as BuildingDesign[];

        logger.info(`Found building designs: ${buildingDesigns.length}`);

        if (buildingDesigns.length === 0) {
            return res.status(404).json({ error: 'No building designs found' });
        }

        // Fetch all city data
        const allCityData = await db.collection('cityData').find({}).toArray() as CityData[];
        
        if (allCityData.length === 0) {
            return res.status(404).json({ error: 'No city data found' });
        }

        // Validate all city data
        for (const cityData of allCityData) {
            if (!validateCityData(cityData)) {
                logger.error('Invalid city data structure:', JSON.stringify(cityData, null, 2));
                return res.status(500).json({ error: 'Invalid city data structure' });
            }
        }

        // Perform analysis for each building in each city with caching
        const analysisResults = await Promise.all(
            buildingDesigns.flatMap(design => 
                allCityData.map(async cityData => {
                    try {
                        // Try to get from cache first
                        const cacheKey = `analysis:${design._id}:${cityData.name}`;
                        const cachedResult = await redisService.get<AnalysisResult>(cacheKey);
                        
                        if (cachedResult) {
                            logger.info(`Retrieved analysis result from cache for building ${design.name} in city ${cityData.name}`);
                            return cachedResult;
                        }

                        // If not in cache, perform analysis
                        logger.info(`Analyzing building: ${design.name} for city: ${cityData.name}`);
                        const result = energyAnalysisService.analyzeBuilding(design, cityData);
                        
                        // Cache the result
                        await redisService.set(cacheKey, result);
                        
                        return result;
                    } catch (error) {
                        logger.error(`Error analyzing building ${design.name} for city ${cityData.name}:`, error);
                        throw error;
                    }
                })
            )
        );

        // Sort results by energy efficiency (lower energy consumption is better)
        analysisResults.sort((a, b) => a.energyConsumption - b.energyConsumption);

        logger.info(`Analysis completed for ${analysisResults.length} building-city combinations`);

        res.json(analysisResults);
    } catch (error) {
        logger.error('Error in /buildings endpoint:', error);
        res.status(500).json({ 
            error: 'Failed to analyze buildings',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}) as RequestHandler);

export default router; 