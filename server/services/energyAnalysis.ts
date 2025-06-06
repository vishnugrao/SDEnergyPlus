import { BuildingDesign, AnalysisResult, CityData } from '../db/schemas.ts';
import { logger } from '../utils/logger.js';

const COP = 4; // Coefficient of Performance
const BTUs_TO_KWH = 3412; // Conversion factor

export class EnergyAnalysisService {
    // Validate building design data
    private validateBuildingDesign(building: BuildingDesign): void {
        if (!building.facades) {
            throw new Error('Building design is missing facades data');
        }

        const requiredFacades = ['north', 'south', 'east', 'west'];
        for (const facade of requiredFacades) {
            if (!building.facades[facade as keyof typeof building.facades]) {
                throw new Error(`Building design is missing ${facade} facade data`);
            }

            const facadeData = building.facades[facade as keyof typeof building.facades];
            if (!facadeData.height || !facadeData.width || !facadeData.wwr || !facadeData.shgc) {
                throw new Error(`${facade} facade is missing required properties (height, width, wwr, or shgc)`);
            }
        }
    }

    // Calculate heat gain for a single facade
    private calculateFacadeHeatGain(
        facade: BuildingDesign['facades'][keyof BuildingDesign['facades']],
        solarRadiation: number,
        hours: number = 1
    ): number {
        // Q = A × SHGC × G × Δt
        const windowArea = facade.height * facade.width * facade.wwr;
        return windowArea * facade.shgc * solarRadiation * hours;
    }

    // Calculate total heat gain for a building
    private calculateTotalHeatGain(
        building: BuildingDesign,
        cityData: CityData
    ): AnalysisResult['heatGain'] {
        try {
            // Validate building design first
            this.validateBuildingDesign(building);

            // Validate city data
            if (!cityData?.solarRadiation) {
                logger.error('City data validation failed:', JSON.stringify(cityData, null, 2));
                throw new Error('City data is missing solar radiation information');
            }

            logger.info('Calculating heat gain with city data:', JSON.stringify(cityData.solarRadiation, null, 2));

            const heatGain = {
                north: this.calculateFacadeHeatGain(building.facades.north, cityData.solarRadiation.north),
                south: this.calculateFacadeHeatGain(building.facades.south, cityData.solarRadiation.south),
                east: this.calculateFacadeHeatGain(building.facades.east, cityData.solarRadiation.east),
                west: this.calculateFacadeHeatGain(building.facades.west, cityData.solarRadiation.west),
                total: 0
            };

            heatGain.total = heatGain.north + heatGain.south + heatGain.east + heatGain.west;
            return heatGain;
        } catch (error) {
            logger.error('Error in calculateTotalHeatGain:', error);
            throw error;
        }
    }

    // Calculate cooling load in kWh
    private calculateCoolingLoad(heatGainBTU: number): number {
        // Cooling Load (kWh) = Heat Gain (BTU) / 3,412
        return heatGainBTU / BTUs_TO_KWH;
    }

    // Calculate energy consumption
    private calculateEnergyConsumption(coolingLoad: number): number {
        // Energy Consumed (kWh) = Cooling Load (kWh) / COP
        return coolingLoad / COP;
    }

    // Calculate cooling cost
    private calculateCoolingCost(energyConsumption: number, electricityRate: number): number {
        return energyConsumption * electricityRate;
    }

    // Main analysis function
    public analyzeBuilding(building: BuildingDesign, cityData: CityData): AnalysisResult {
        try {
            logger.info(`Analyzing building ${building.name} for city ${cityData.name}`);

            // Validate building design
            this.validateBuildingDesign(building);

            // Calculate heat gain
            const heatGain = this.calculateTotalHeatGain(building, cityData);
            const coolingLoad = this.calculateCoolingLoad(heatGain.total);
            const energyConsumption = this.calculateEnergyConsumption(coolingLoad);
            const coolingCost = this.calculateCoolingCost(energyConsumption, cityData.electricityRate);

            const result: AnalysisResult = {
                buildingDesignId: building._id!,
                name: building.name,
                city: cityData.name,
                heatGain,
                coolingCost,
                energyConsumption,
                createdAt: new Date()
            };

            logger.info('Analysis completed successfully');
            return result;
        } catch (error) {
            logger.error('Error in analyzeBuilding:', error);
            throw error;
        }
    }
} 