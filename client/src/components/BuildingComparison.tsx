"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { BuildingDesign } from '../types/building';
import { calculateDailyEnergyProfile, CITY_DATA } from '@/lib/heat-gain-utils';

const CITIES = Object.keys(CITY_DATA) as Array<keyof typeof CITY_DATA>;
const SEASONS = ['Summer', 'Winter', 'Monsoon'] as const;

interface BuildingComparisonProps {
  buildings: BuildingDesign[];
}

export function BuildingComparison({ buildings }: BuildingComparisonProps) {
  const [selectedCity, setSelectedCity] = useState<typeof CITIES[number]>(CITIES[0]);
  const [selectedSeason, setSelectedSeason] = useState<typeof SEASONS[number]>(SEASONS[0]);

  // --- Data Preparation ---
  // 1. Hourly energy/cost profile for each building
  const buildingProfiles = buildings.map((building) => ({
    ...building,
    profile: calculateDailyEnergyProfile(building, selectedCity, selectedSeason),
  }));

  // 2. Facade-wise heat gain (sum over day)
  const facadeHeatGainData = buildings.map((building, idx) => {
    const radiation = CITY_DATA[selectedCity].radiation;
    const sunlightProfile = Array.from({ length: 24 }, (_, hour) => {
      // Use the same sunlight profile as in calculateDailyEnergyProfile
      return require('@/lib/heat-gain-utils').getSunlightProfileForSeason(selectedSeason)[hour];
    });
    const facades = ['north', 'south', 'east', 'west'] as const;
    const heatGain: Record<string, number> = {};
    facades.forEach(facade => {
      let sum = 0;
      for (let hour = 0; hour < 24; hour++) {
        const area = building.facades[facade].width * building.facades[facade].height * building.facades[facade].wwr;
        const shgc = building.facades[facade].shgc;
        const rad = radiation[facade] * sunlightProfile[hour];
        sum += area * shgc * rad;
      }
      heatGain[facade] = sum;
    });
    return { name: building.name, ...heatGain };
  });

  // 3. Cooling cost (sum over day)
  const coolingCostData = buildingProfiles.map((b) => ({
    name: b.name,
    totalCost: b.profile.reduce((sum, h) => sum + h.cost, 0),
  }));

  // 4. City-wise ranking (by total energy/cost)
  // For this city, rank buildings by total energy/cost
  const cityRankingData = buildingProfiles.map((b) => ({
    name: b.name,
    totalEnergy: b.profile.reduce((sum, h) => sum + h.energyConsumed, 0),
    totalCost: b.profile.reduce((sum, h) => sum + h.cost, 0),
  })).sort((a, b) => a.totalCost - b.totalCost);

  // 5. Comparative summary (table data)
  const comparativeSummary = cityRankingData;

  // --- Colors ---
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A259F7', '#F76E6E'];

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-4">
        <Select value={selectedCity} onValueChange={(value: typeof CITIES[number]) => setSelectedCity(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select city" />
          </SelectTrigger>
          <SelectContent>
            {CITIES.map((city) => (
              <SelectItem key={city} value={city}>{city}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedSeason} onValueChange={(value: typeof SEASONS[number]) => setSelectedSeason(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select season" />
          </SelectTrigger>
          <SelectContent>
            {SEASONS.map((season) => (
              <SelectItem key={season} value={season}>{season}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Tabs defaultValue="heat-gain" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="heat-gain">Heat Gain (per Facade)</TabsTrigger>
          <TabsTrigger value="cooling-cost">Cooling Cost</TabsTrigger>
          <TabsTrigger value="city-ranking">City-wise Ranking</TabsTrigger>
          <TabsTrigger value="comparative">Comparative Analysis</TabsTrigger>
        </TabsList>
        {/* Heat Gain Tab */}
        <TabsContent value="heat-gain">
          <Card>
            <CardHeader>
              <CardTitle>Daily Heat Gain per Facade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[600px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={facadeHeatGainData} margin={{ top: 40, right: 40, left: 40, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {['north', 'south', 'east', 'west'].map((facade, idx) => (
                      <Bar key={facade} dataKey={facade} fill={COLORS[idx % COLORS.length]} name={`${facade.charAt(0).toUpperCase() + facade.slice(1)} Facade`} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        {/* Cooling Cost Tab */}
        <TabsContent value="cooling-cost">
          <Card>
            <CardHeader>
              <CardTitle>Total Cooling Cost</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[600px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={coolingCostData} margin={{ top: 40, right: 40, left: 40, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="totalCost" fill={COLORS[0]} name="Cooling Cost (₹)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        {/* City-wise Ranking Tab */}
        <TabsContent value="city-ranking">
          <Card>
            <CardHeader>
              <CardTitle>City-wise Performance Ranking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[600px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cityRankingData} margin={{ top: 40, right: 40, left: 40, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="totalEnergy" fill={COLORS[1]} name="Total Energy (kWh)" />
                    <Bar dataKey="totalCost" fill={COLORS[2]} name="Total Cost (₹)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        {/* Comparative Analysis Tab */}
        <TabsContent value="comparative">
          <Card>
            <CardHeader>
              <CardTitle>Comparative Analysis Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left border">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 border">Building</th>
                      <th className="px-4 py-2 border">Total Energy (kWh)</th>
                      <th className="px-4 py-2 border">Total Cost (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparativeSummary.map((row, idx) => (
                      <tr key={row.name} className={idx % 2 === 0 ? 'bg-muted' : ''}>
                        <td className="px-4 py-2 border font-medium">{row.name}</td>
                        <td className="px-4 py-2 border">{row.totalEnergy.toFixed(2)}</td>
                        <td className="px-4 py-2 border">{row.totalCost.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 