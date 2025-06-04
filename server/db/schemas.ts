import { ObjectId } from 'mongodb';

interface BuildingDesign {
    _id?: ObjectId;
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
    createdAt: Date;
    updatedAt: Date;
}

interface FacadeData {
    height: number;
    width: number;
    wwr: number; // Window-to-wall ratio (0-1)
    shgc: number; // Solar Heat Gain Coefficient (0-1)
}

interface AnalysisResult {
    _id?: ObjectId;
    buildingDesignId: ObjectId;
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

interface CityData {
    _id?: ObjectId;
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

export type { BuildingDesign, FacadeData, CityData, AnalysisResult };