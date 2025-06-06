export interface SolarRadiation {
  north: number;
  south: number;
  east: number;
  west: number;
  roof: number;
}

export interface Facade {
  windowArea: number;
  windowToWallRatio: number;
  solarHeatGainCoefficient: number;
}

export interface CityData {
  solarRadiation: SolarRadiation;
  electricityRate: number;
}

export interface BuildingRanking {
  buildingId: string;
  buildingName: string;
  totalHeatGain: number;
  energyConsumption: number;
  cost: number;
}

export interface PerformanceMetrics {
  costEfficiency: number;
  heatGainEfficiency: number;
}

export interface ComparativeAnalysis {
  bestPerformer: BuildingRanking | null;
  worstPerformer: BuildingRanking | null;
  averageCost: number;
  costSavings: number;
  performanceMetrics: Record<string, PerformanceMetrics>;
} 