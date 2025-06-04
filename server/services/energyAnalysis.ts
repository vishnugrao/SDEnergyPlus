import { BuildingDesign, AnalysisResult, CityData } from '../db/schemas.ts';

const COP = 4; // Coefficient of Performance
const BTUs_TO_KWH = 3412; // Conversion factor

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

    // Main analysis function
    public analyzeBuilding(building: BuildingDesign, cityData: CityData): AnalysisResult {
        const heatGain = this.calculateTotalHeatGain(building, cityData);
        const coolingLoad = this.calculateCoolingLoad(heatGain.total);
        const energyConsumption = this.calculateEnergyConsumption(coolingLoad);
        const coolingCost = this.calculateCoolingCost(energyConsumption, cityData.electricityRate);

        return {
            buildingDesignId: building._id!,
            city: cityData.name,
            heatGain,
            coolingCost,
            energyConsumption,
            createdAt: new Date()
        };
    }
} 