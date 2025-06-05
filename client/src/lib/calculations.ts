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
): number {
  // Base solar radiation values (W/m²) - these would typically come from a database
  const solarRadiation = {
    summer: [0, 0, 0, 0, 0, 50, 200, 400, 600, 800, 900, 950, 1000, 950, 900, 800, 600, 400, 200, 50, 0, 0, 0, 0],
    winter: [0, 0, 0, 0, 0, 20, 100, 200, 300, 400, 450, 500, 450, 400, 300, 200, 100, 20, 0, 0, 0, 0, 0, 0]
  };

  // City-specific multipliers
  const cityMultipliers: Record<string, number> = {
    'New York': 1.0,
    'Los Angeles': 1.2,
    'Chicago': 0.9,
    'Miami': 1.3,
    'Seattle': 0.8
  };

  const multiplier = cityMultipliers[city] || 1.0;
  const radiation = solarRadiation[season.toLowerCase() as keyof typeof solarRadiation]?.[hour] || 0;
  
  const facadeArea = facade.height * facade.width;
  const windowArea = facadeArea * facade.windowToWallRatio;
  
  return radiation * multiplier * windowArea * facade.solarHeatGainCoefficient;
}

export function calculateEnergyConsumption(heatGain: number): number {
  // Assuming a COP (Coefficient of Performance) of 3.0 for the HVAC system
  const COP = 3.0;
  return heatGain / COP;
}

export function calculateEnergyCost(energyConsumption: number): number {
  // Assuming an electricity rate of $0.12 per kWh
  const electricityRate = 0.12;
  // Convert from Wh to kWh
  const energyInKWh = energyConsumption / 1000;
  return energyInKWh * electricityRate;
} 