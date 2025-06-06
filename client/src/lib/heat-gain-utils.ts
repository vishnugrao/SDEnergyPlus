import { BuildingDesign } from '../types/building';

interface SolarRadiation {
  north: number;
  south: number;
  east: number;
  west: number;
  roof: number;
}

interface CityData {
  radiation: SolarRadiation;
  electricityRate: number;
}

export const CITY_DATA: Record<string, CityData> = {
  Bangalore: {
    radiation: { north: 150, south: 250, east: 200, west: 200, roof: 300 },
    electricityRate: 6.5,
  },
  Mumbai: {
    radiation: { north: 180, south: 350, east: 280, west: 270, roof: 400 },
    electricityRate: 9.0,
  },
  Kolkata: {
    radiation: { north: 200, south: 400, east: 300, west: 290, roof: 450 },
    electricityRate: 7.5,
  },
  Delhi: {
    radiation: { north: 160, south: 270, east: 220, west: 220, roof: 320 },
    electricityRate: 8.5,
  },
};

export const COP = 4; // Coefficient of Performance
export const BTUs_TO_KWH = 3412; // Conversion factor

export function calculateHeatGain(
  building: BuildingDesign,
  radiation: SolarRadiation,
  hour: number
): number {
  // Calculate window areas for each facade
  const windowAreas = {
    north: building.facades.north.width * building.facades.north.height * building.facades.north.wwr,
    south: building.facades.south.width * building.facades.south.height * building.facades.south.wwr,
    east: building.facades.east.width * building.facades.east.height * building.facades.east.wwr,
    west: building.facades.west.width * building.facades.west.height * building.facades.west.wwr,
  };

  // Calculate heat gain for each facade based on hour of day
  const hourlyFactors = calculateHourlyFactors(hour);
  
  // Q = A × SHGC × G × Δt
  const totalHeatGain = Object.entries(windowAreas).reduce((total, [orientation, area]) => {
    const shgc = building.facades[orientation as keyof typeof building.facades].shgc;
    const hourlyFactor = hourlyFactors[orientation as keyof typeof hourlyFactors];
    const solarRadiation = radiation[orientation as keyof SolarRadiation];
    const duration = 1; // 1 hour
    return total + (area * shgc * solarRadiation * hourlyFactor * duration);
  }, 0);

  // Convert BTU to kWh
  const coolingLoad = totalHeatGain / BTUs_TO_KWH;
  // Energy Consumed = Cooling Load / COP
  const energyConsumed = coolingLoad / COP;

  return Number(energyConsumed.toFixed(2));
}

function calculateHourlyFactors(hour: number): Record<string, number> {
  // Simplified hourly factors based on sun position
  // In reality, this would be more complex and based on actual solar position calculations
  const factors = {
    north: 0.3,
    south: 0.7,
    east: 0.5,
    west: 0.5,
  };

  // Adjust factors based on time of day
  if (hour >= 6 && hour <= 10) {
    factors.east = 0.8;
    factors.west = 0.2;
  } else if (hour >= 14 && hour <= 18) {
    factors.east = 0.2;
    factors.west = 0.8;
  }

  return factors;
}

export function calculateEnergyCost(energyConsumed: number, city: string): number {
  const rate = CITY_DATA[city].electricityRate;
  return Number((energyConsumed * rate).toFixed(2));
}

// --- Sunlight Profile Model ---
/**
 * Returns an array of 24 values (0-1) representing sunlight intensity for each hour,
 * using a sine curve between sunrise and sunset, with parameters for each season.
 */
export function getSunlightProfileForSeason(season: string): number[] {
  // Define sunrise, sunset, and peak intensity for each season
  // Hours are in 24h format
  const seasonParams: Record<string, { sunrise: number; sunset: number; peak: number }> = {
    Summer: { sunrise: 5.5, sunset: 19, peak: 1.0 }, // 5:30 to 19:00
    Winter: { sunrise: 6.5, sunset: 17.5, peak: 0.7 }, // 6:30 to 17:30
    Monsoon: { sunrise: 6, sunset: 18.5, peak: 0.85 }, // 6:00 to 18:30
  };
  const { sunrise, sunset, peak } = seasonParams[season] || seasonParams['Summer'];
  const profile: number[] = [];
  const dayLength = sunset - sunrise;
  const pi = Math.PI;
  for (let hour = 0; hour < 24; hour++) {
    if (hour < sunrise || hour > sunset) {
      profile.push(0);
    } else {
      // Map hour to [0, pi] for sine curve
      const x = ((hour - sunrise) / dayLength) * pi;
      // Sine curve: 0 at sunrise, 1 at solar noon, 0 at sunset
      const value = Math.sin(x) * peak;
      profile.push(Math.max(0, value));
    }
  }
  return profile;
}

export function calculateDailyEnergyProfile(
  building: BuildingDesign,
  city: string,
  season: string
): Array<{ hour: number; energyConsumed: number; cost: number }> {
  const profile = [];
  const radiation = CITY_DATA[city].radiation;
  const sunlightProfile = getSunlightProfileForSeason(season);

  for (let hour = 0; hour < 24; hour++) {
    // Scale radiation by sunlight factor for the hour
    const sunlightFactor = sunlightProfile[hour];
    // Scale all facade radiation by sunlight factor
    const scaledRadiation = {
      north: radiation.north * sunlightFactor,
      south: radiation.south * sunlightFactor,
      east: radiation.east * sunlightFactor,
      west: radiation.west * sunlightFactor,
      roof: radiation.roof * sunlightFactor,
    };
    const energyConsumed = calculateHeatGain(building, scaledRadiation, hour);
    const cost = calculateEnergyCost(energyConsumed, city);
    profile.push({ hour, energyConsumed, cost });
  }

  return profile;
} 