declare module '@/lib/calculations' {
  interface Facade {
    height: number;
    width: number;
    windowToWallRatio: number;
    solarHeatGainCoefficient: number;
  }

  export function calculateHeatGain(
    facade: Facade,
    city: string,
    season: string,
    hour: number
  ): number;

  export function calculateEnergyConsumption(heatGain: number): number;

  export function calculateEnergyCost(energyConsumption: number): number;
} 