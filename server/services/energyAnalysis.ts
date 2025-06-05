import { BuildingDesign, AnalysisResult, CityData } from '../db/schemas.ts';
import { redisService } from './redis.js';
import { logger } from '../utils/logger.js';

const COP = 4; // Coefficient of Performance
const BTUs_TO_KWH = 3412; // Conversion factor
const CACHE_PREFIX = 'energy_analysis:';

export class EnergyAnalysisService {
    // Calculate heat gain for a single facade
    private calculateFacadeHeatGain(
        facade: BuildingDesign['facades'][keyof BuildingDesign['facades']],
        solarRadiation: number,
        hours: number = 1
    ): number {
        const windowArea = facade.height * facade.width * facade.wwr;
        return windowArea * facade.shgc * solarRadiation * hours;
    }

    // Calculate total heat gain for a building
    private calculateTotalHeatGain(
        building: BuildingDesign,
        cityData: CityData
    ): AnalysisResult['heatGain'] {
        const heatGain = {
            north: this.calculateFacadeHeatGain(building.facades.north, cityData.solarRadiation.north),
            south: this.calculateFacadeHeatGain(building.facades.south, cityData.solarRadiation.south),
            east: this.calculateFacadeHeatGain(building.facades.east, cityData.solarRadiation.east),
            west: this.calculateFacadeHeatGain(building.facades.west, cityData.solarRadiation.west),
            total: 0
        };

        heatGain.total = heatGain.north + heatGain.south + heatGain.east + heatGain.west;
        return heatGain;
    }

    // Calculate cooling load in kWh
    private calculateCoolingLoad(heatGainBTU: number): number {
        return heatGainBTU / BTUs_TO_KWH;
    }

    // Calculate energy consumption
    private calculateEnergyConsumption(coolingLoad: number): number {
        return coolingLoad / COP;
    }

    // Calculate cooling cost
    private calculateCoolingCost(energyConsumption: number, electricityRate: number): number {
        return energyConsumption * electricityRate;
    }

    // Get cache key for analysis result
    private getCacheKey(buildingId: string, cityName: string): string {
        return `${CACHE_PREFIX}${buildingId}:${cityName}`;
    }

    // Main analysis function
    public async analyzeBuilding(building: BuildingDesign, cityData: CityData): Promise<AnalysisResult> {
        try {
            // Try to get from cache first
            const cacheKey = this.getCacheKey(building._id!.toString(), cityData.name);
            const cachedResult = await redisService.get<AnalysisResult>(cacheKey);

            if (cachedResult) {
                logger.info('Retrieved analysis result from cache');
                return cachedResult;
            }

            // Calculate if not in cache
            const heatGain = this.calculateTotalHeatGain(building, cityData);
            const coolingLoad = this.calculateCoolingLoad(heatGain.total);
            const energyConsumption = this.calculateEnergyConsumption(coolingLoad);
            const coolingCost = this.calculateCoolingCost(energyConsumption, cityData.electricityRate);

            const result: AnalysisResult = {
                buildingDesignId: building._id!,
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
        } catch (error) {
            logger.error('Error in analyzeBuilding:', error);
            throw error;
        }
    }

    // Invalidate cache for a building design
    public async invalidateCache(buildingId: string): Promise<void> {
        try {
            const pattern = `${CACHE_PREFIX}${buildingId}:*`;
            const keys = await redisService.keys(pattern);
            if (keys.length > 0) {
                await redisService.delMultiple(keys);
                logger.info(`Invalidated cache for building ${buildingId}`);
            }
        } catch (error) {
            logger.error('Error invalidating cache:', error);
            throw error;
        }
    }
} 