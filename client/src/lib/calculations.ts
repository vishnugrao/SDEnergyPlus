import { getSunlightProfileForSeason } from './heat-gain-utils';
import type { Facade, SolarRadiation, CityData, BuildingRanking, PerformanceMetrics, ComparativeAnalysis } from '@/types/calculations';

const cityData: Record<string, CityData> = {
  'Bangalore': {
    solarRadiation: {
      north: 150,
      south: 250,
      east: 200,
      west: 200,
      roof: 300
    },
    electricityRate: 6.5
  },
  'Mumbai': {
    solarRadiation: {
      north: 180,
      south: 350,
      east: 280,
      west: 270,
      roof: 400
    },
    electricityRate: 9.0
  },
  'Kolkata': {
    solarRadiation: {
      north: 200,
      south: 400,
      east: 300,
      west: 290,
      roof: 450
    },
    electricityRate: 7.5
  },
  'Delhi': {
    solarRadiation: {
      north: 160,
      south: 270,
      east: 220,
      west: 220,
      roof: 320
    },
    electricityRate: 8.5
  }
};

export function calculateHeatGain(
  facade: Facade,
  city: string,
  orientation: keyof SolarRadiation,
  season: string,
  hour: number
): number {
  const cityInfo = cityData[city];
  if (!cityInfo) {
    throw new Error(`No data available for city: ${city}`);
  }

  const radiation = cityInfo.solarRadiation[orientation];
  const windowArea = facade.windowArea;
  
  // Get sunlight profile for the hour
  const sunlightProfile = getSunlightProfileForSeason(season);
  const sunlightFactor = sunlightProfile[hour];
  
  // Q = A × SHGC × G × Δt
  const heatGain = windowArea * facade.solarHeatGainCoefficient * radiation * sunlightFactor * 1; // Δt = 1 hour
  return Number(heatGain.toFixed(1));
}

export function calculateEnergyConsumption(heatGain: number): number {
  // Convert BTUs to kWh: Cooling Load (kWh) = Heat Gain (BTU) / 3,412
  const coolingLoad = heatGain / 3412;
  // Energy Consumed (kWh) = Cooling Load (kWh) / COP
  const COP = 4;
  const consumption = coolingLoad / COP;
  return Number(consumption.toFixed(1));
}

export function calculateEnergyCost(energyConsumption: number, city: string): number {
  const cityInfo = cityData[city];
  if (!cityInfo) {
    throw new Error(`No data available for city: ${city}`);
  }

  const cost = energyConsumption * cityInfo.electricityRate;
  return Number(cost.toFixed(1));
}

export function calculateCityRankings(buildings: any[], city: string, season: string): BuildingRanking[] {
  const rankings = buildings.map(building => {
    const totalHeatGain = Object.keys(building.facade).reduce((sum, orientation) => {
      return sum + calculateHeatGain(
        building.facade,
        city,
        orientation as keyof SolarRadiation,
        season,
        12 // Use noon as default hour
      );
    }, 0);
    
    const energyConsumption = calculateEnergyConsumption(totalHeatGain);
    const cost = calculateEnergyCost(energyConsumption, city);
    
    return {
      buildingId: building.id,
      buildingName: building.name,
      totalHeatGain,
      energyConsumption,
      cost
    };
  });

  return rankings.sort((a, b) => a.cost - b.cost);
}

export function calculateComparativeAnalysis(buildings: any[], city: string): ComparativeAnalysis {
  const analysis: ComparativeAnalysis = {
    bestPerformer: null,
    worstPerformer: null,
    averageCost: 0,
    costSavings: 0,
    performanceMetrics: {}
  };

  const rankings = calculateCityRankings(buildings, city, 'summer');
  
  if (rankings.length > 0) {
    analysis.bestPerformer = rankings[0];
    analysis.worstPerformer = rankings[rankings.length - 1];
    analysis.averageCost = rankings.reduce((sum, r) => sum + r.cost, 0) / rankings.length;
    
    if (analysis.bestPerformer && analysis.worstPerformer) {
      analysis.costSavings = analysis.worstPerformer.cost - analysis.bestPerformer.cost;
    }
    
    // Calculate performance metrics for each building
    buildings.forEach(building => {
      const ranking = rankings.find(r => r.buildingId === building.id);
      if (ranking) {
        analysis.performanceMetrics[building.id] = {
          costEfficiency: (analysis.averageCost - ranking.cost) / analysis.averageCost * 100,
          heatGainEfficiency: ranking.totalHeatGain / building.facade.height / building.facade.width
        };
      }
    });
  }

  return analysis;
}

export function calculateCarbonEmissions(energyConsumption: number): number {
  // Assuming 0.82 kg CO2 per kWh (Indian grid average)
  const emissions = (energyConsumption / 1000) * 0.82;
  return Number(emissions.toFixed(1));
}

export function calculatePeakDemand(energyConsumption: number): number {
  // Assuming peak demand is 20% of total consumption
  const peakDemand = energyConsumption * 0.2;
  return Number(peakDemand.toFixed(1));
} 