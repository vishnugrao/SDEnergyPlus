export interface FacadeData {
    height: number;
    width: number;
    wwr: number; // Window-to-wall ratio (0-1)
    shgc: number; // Solar Heat Gain Coefficient (0-1)
}

export interface BuildingDesign {
    _id?: string;
    buildingId?: string; // ID of the parent building for grouping designs
    name: string;
    facades: {
        north: FacadeData;
        south: FacadeData;
        east: FacadeData;
        west: FacadeData;
    };
    skylight?: {
        width: number;
        length: number;
    };
    createdAt?: Date;
    updatedAt?: Date;
}

export interface AnalysisResult {
    _id?: string;
    buildingDesignId: string;
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
    createdAt: Date;
}

export interface CityData {
    _id?: string;
    name: string;
    solarRadiation: {
        north: number;
        south: number;
        east: number;
        west: number;
        roof: number;
    };
    electricityRate: number; // Rs/kWh
} 