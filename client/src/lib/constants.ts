export const cities = [
  'New York',
  'Los Angeles',
  'Chicago',
  'Miami',
  'Seattle'
] as const;

export const seasons = [
  'Summer',
  'Winter'
] as const;

export type City = typeof cities[number];
export type Season = typeof seasons[number]; 