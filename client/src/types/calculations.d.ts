declare module '@/lib/calculations' {
  interface Facade {
    windowArea: number;
    windowToWallRatio: number;
    solarHeatGainCoefficient: number;
  }

  export function calculateHeatGain(
    facade: Facade,
    city: string,
    orientation: keyof SolarRadiation,
    season: string,
    hour: number
  ): number;

  export function calculateEnergyConsumption(heatGain: number): number;

  export function calculateEnergyCost(energyConsumption: number): number;
} 