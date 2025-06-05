declare module '@/lib/constants' {
  export const cities: readonly ['New York', 'Los Angeles', 'Chicago', 'Miami', 'Seattle'];
  export const seasons: readonly ['Summer', 'Winter'];
  
  export type City = typeof cities[number];
  export type Season = typeof seasons[number];
} 