export interface AnalysisResult {
    buildingDesignId: string;
    name: string;
    city: string;
    heatGain: {
        north: number;
        south: number;
        east: number;
        west: number;
        total: number;
    };
    coolingCost: number;
    energyConsumption: number;
    createdAt: string;
}

export interface CityAnalysisResults {
    [city: string]: AnalysisResult[];
} 