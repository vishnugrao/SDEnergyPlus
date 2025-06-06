import { z } from 'zod';

export const facadeSchema = z.object({
    height: z.number().min(0),
    width: z.number().min(0),
    wwr: z.number().min(0).max(1),
    shgc: z.number().min(0).max(1),
});

export const buildingSchema = z.object({
    name: z.string().min(1),
    facades: z.object({
        north: facadeSchema,
        south: facadeSchema,
        east: facadeSchema,
        west: facadeSchema,
    }),
    skylight: z.object({
        width: z.number().min(0).optional(),
        length: z.number().min(0).optional(),
    }).optional(),
});

export type BuildingFormData = z.infer<typeof buildingSchema>;
export type FacadeKey = keyof BuildingFormData['facades'];

export interface BuildingDesign extends BuildingFormData {
    _id?: string;
    id?: string;
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
    temperature: {
        summer: number;
        winter: number;
        monsoon: number;
    };
    humidity: {
        summer: number;
        winter: number;
        monsoon: number;
    };
} 