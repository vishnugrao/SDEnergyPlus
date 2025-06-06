import { redisService } from './redis.js';
import { logger } from '../utils/logger.js';
const COP = 4; // Coefficient of Performance
const BTUs_TO_KWH = 3412; // Conversion factor
const CACHE_PREFIX = 'energy_analysis:';
export class EnergyAnalysisService {
    constructor() {
        this.COP = 4; // Default Coefficient of Performance
        this.EXPOSURE_DURATION = 1; // 1 hour for calculations
    }
    // Calculate heat gain for a single facade
    calculateFacadeHeatGain(facade, solarRadiation, hours = 1) {
        const windowArea = facade.height * facade.width * facade.wwr;
        return windowArea * facade.shgc * solarRadiation * hours;
    }
    // Calculate total heat gain for a building
    calculateTotalHeatGain(building, cityData) {
        const heatGain = {
            north: this.calculateFacadeHeatGain(building.facades.north, cityData.solarRadiation.north),
            south: this.calculateFacadeHeatGain(building.facades.south, cityData.solarRadiation.south),
            east: this.calculateFacadeHeatGain(building.facades.east, cityData.solarRadiation.east),
            west: this.calculateFacadeHeatGain(building.facades.west, cityData.solarRadiation.west),
            total: 0
        };
        heatGain.total = heatGain.north + heatGain.south + heatGain.east + heatGain.west;
        // Add skylight heat gain if present
        if (building.skylight) {
            const skylightArea = building.skylight.width * building.skylight.length;
            const skylightHeatGain = this.calculateSkylightHeatGain(skylightArea, cityData.solarRadiation.roof);
            heatGain.total += skylightHeatGain;
        }
        return heatGain;
    }
    // Calculate cooling load in kWh
    calculateCoolingLoad(heatGainBTU) {
        return heatGainBTU / BTUs_TO_KWH;
    }
    // Calculate energy consumption
    calculateEnergyConsumption(coolingLoad) {
        return coolingLoad / this.COP;
    }
    // Calculate cooling cost
    calculateCoolingCost(energyConsumption, electricityRate) {
        return energyConsumption * electricityRate;
    }
    // Get cache key for analysis result
    getCacheKey(buildingId, cityName) {
        return `${CACHE_PREFIX}${buildingId}:${cityName}`;
    }
    // Main analysis function
    async analyzeBuilding(building, cityData) {
        try {
            // Try to get from cache first
            const cacheKey = this.getCacheKey(building._id.toString(), cityData.name);
            const cachedResult = await redisService.get(cacheKey);
            if (cachedResult) {
                logger.info('Retrieved analysis result from cache');
                return cachedResult;
            }
            // Calculate if not in cache
            const heatGain = this.calculateTotalHeatGain(building, cityData);
            const coolingLoad = this.calculateCoolingLoad(heatGain.total);
            const energyConsumption = this.calculateEnergyConsumption(coolingLoad);
            const coolingCost = this.calculateCoolingCost(energyConsumption, cityData.electricityRate);
            const result = {
                buildingDesignId: building._id,
                city: cityData.name,
                heatGain,
                coolingCost,
                energyConsumption,
                createdAt: new Date()
            };
            // Cache the result
            await redisService.set(cacheKey, result);
            logger.info('Cached new analysis result');
            return result;
        }
        catch (error) {
            logger.error('Error in analyzeBuilding:', error);
            throw error;
        }
    }
    // Invalidate cache for a building design
    async invalidateCache(buildingId) {
        try {
            const pattern = `${CACHE_PREFIX}${buildingId}:*`;
            const keys = await redisService.keys(pattern);
            if (keys.length > 0) {
                await redisService.delMultiple(keys);
                logger.info(`Invalidated cache for building ${buildingId}`);
            }
        }
        catch (error) {
            logger.error('Error invalidating cache:', error);
            throw error;
        }
    }
    calculateSkylightHeatGain(area, solarRadiation) {
        // Using a default SHGC of 0.8 for skylights
        return area * 0.8 * solarRadiation * this.EXPOSURE_DURATION;
    }
}
//# sourceMappingURL=energyAnalysis.js.map