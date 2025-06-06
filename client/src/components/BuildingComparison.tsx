"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { BuildingDesign } from '../types/building';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

interface AnalysisResult {
  buildingDesignId: string;
  name: string;
  city: string;
  heatGain: {
    north: number;
    south: number;
    east: number;
    west: number;
    total: number;
    hourly: {
      hour: number;
      north: number;
      south: number;
      east: number;
      west: number;
    }[];
  };
  coolingCost: number;
  energyConsumption: number;
  createdAt: string;
}

interface BuildingWithAnalysis extends BuildingDesign {
  analysis: AnalysisResult;
}

interface BuildingComparisonProps {
  buildings: BuildingWithAnalysis[];
}

export function BuildingComparison({ buildings }: BuildingComparisonProps) {
  const [selectedBuilding, setSelectedBuilding] = useState(buildings[0]?.name || '');

  if (buildings.length < 2) {
    return null;
  }

  // Prepare data for different visualizations
  const facadeHeatGainData = buildings.map(building => ({
    name: building.name,
    hourlyData: building.analysis.heatGain.hourly.map(hour => ({
      hour: hour.hour,
      north: hour.north,
      south: hour.south,
      east: hour.east,
      west: hour.west
    }))
  }));

  const selectedBuildingData = facadeHeatGainData.find(building => building.name === selectedBuilding)?.hourlyData || [];

  const cityRankingData = buildings.map(building => ({
    name: building.name,
    totalEnergy: building.analysis.energyConsumption,
    totalCost: building.analysis.coolingCost
  }));

  const comparativeSummary = cityRankingData;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="heat-gain" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="heat-gain">Heat Gain (per Facade)</TabsTrigger>
          <TabsTrigger value="cooling-cost">Cooling Cost</TabsTrigger>
          <TabsTrigger value="city-ranking">City-wise Ranking</TabsTrigger>
          <TabsTrigger value="comparative">Comparative Analysis</TabsTrigger>
          <TabsTrigger value="energy-metrics">Energy Metrics</TabsTrigger>
        </TabsList>

        {/* Heat Gain Tab */}
        <TabsContent value="heat-gain">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Daily Heat Gain per Facade</CardTitle>
                <Select value={selectedBuilding} onValueChange={setSelectedBuilding}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select building" />
                  </SelectTrigger>
                  <SelectContent>
                    {buildings.map((building) => (
                      <SelectItem key={building.name} value={building.name}>
                        {building.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[600px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={selectedBuildingData} margin={{ top: 40, right: 40, left: 40, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="hour" 
                      domain={[0, 23]}
                      tickCount={24}
                      tickFormatter={(value) => `${value}:00`}
                      label={{ value: 'Hour of Day', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis 
                      tickFormatter={(value: number) => value.toFixed(3)}
                      domain={[
                        (dataMin: number) => Math.floor(dataMin * 0.9),
                        (dataMax: number) => Math.ceil(dataMax * 1.1)
                      ]}
                      label={{ value: 'Heat Gain (kWh)', angle: -90, position: 'insideLeft' }}
                      width={80}
                    />
                    <Tooltip 
                      formatter={(value: number) => value.toFixed(3)}
                      labelFormatter={(label) => `Hour: ${label}:00`}
                    />
                    <Legend />
                    {['north', 'south', 'east', 'west'].map((facade, idx) => (
                      <Line
                        key={facade}
                        type="monotone"
                        dataKey={facade}
                        stroke={COLORS[idx % COLORS.length]}
                        name={`${facade.charAt(0).toUpperCase() + facade.slice(1)} Facade`}
                        strokeWidth={2}
                        dot={{ r: 2 }}
                        activeDot={{ r: 4 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cooling Cost Tab */}
        <TabsContent value="cooling-cost">
          <Card>
            <CardHeader>
              <CardTitle>Daily Cooling Cost Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[600px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={cityRankingData} margin={{ top: 40, right: 40, left: 40, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value: number) => `₹${value.toFixed(1)}`} />
                    <Tooltip formatter={(value: number) => `₹${value.toFixed(1)}`} />
                    <Legend />
                    <Line type="monotone" dataKey="totalCost" stroke={COLORS[0]} name="Cooling Cost" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* City Ranking Tab */}
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
                    <YAxis tickFormatter={(value: number) => value.toFixed(1)} />
                    <Tooltip formatter={(value: number) => value.toFixed(1)} />
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
                        <td className="px-4 py-2 border">{row.totalEnergy.toFixed(1)}</td>
                        <td className="px-4 py-2 border">{row.totalCost.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Energy Metrics Tab */}
        <TabsContent value="energy-metrics">
          <Card>
            <CardHeader>
              <CardTitle>Energy Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {buildings.map((building) => {
                  const maxEnergy = Math.max(...buildings.map(b => b.analysis.energyConsumption));
                  
                  return (
                    <Card key={building._id}>
                      <CardHeader>
                        <CardTitle>{building.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground">Energy Efficiency</h4>
                            <p className="text-2xl font-bold">
                              {((1 - building.analysis.energyConsumption / maxEnergy) * 100).toFixed(1)}%
                            </p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground">Peak Demand</h4>
                            <p className="text-2xl font-bold">
                              {(building.analysis.energyConsumption * 0.2).toFixed(1)} kW
                            </p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground">Carbon Emissions</h4>
                            <p className="text-2xl font-bold">
                              {(building.analysis.energyConsumption * 0.82).toFixed(1)} kg CO₂
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 