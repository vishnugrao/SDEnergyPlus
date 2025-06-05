import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { calculateHeatGain, calculateEnergyConsumption, calculateEnergyCost } from '@/lib/calculations';
import { cities, seasons, type City, type Season } from '@/lib/constants';

interface Building {
  id: string;
  name: string;
  facade: {
    height: number;
    width: number;
    windowToWallRatio: number;
    solarHeatGainCoefficient: number;
  };
}

interface BuildingComparisonProps {
  buildings: Building[];
}

export function BuildingComparison({ buildings }: BuildingComparisonProps) {
  const [selectedCity, setSelectedCity] = useState<City>(cities[0]);
  const [selectedSeason, setSelectedSeason] = useState<Season>(seasons[0]);

  const generateDailyProfile = (building: Building) => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    return hours.map(hour => {
      const heatGain = calculateHeatGain(building.facade, selectedCity, selectedSeason, hour);
      const energyConsumption = calculateEnergyConsumption(heatGain);
      const cost = calculateEnergyCost(energyConsumption);
      
      return {
        hour,
        heatGain,
        energyConsumption,
        cost
      };
    });
  };

  const buildingProfiles = buildings.map(building => ({
    ...building,
    profile: generateDailyProfile(building)
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-x-4">
          <Select value={selectedCity} onValueChange={(value: City) => setSelectedCity(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select city" />
            </SelectTrigger>
            <SelectContent>
              {cities.map(city => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedSeason} onValueChange={(value: Season) => setSelectedSeason(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select season" />
            </SelectTrigger>
            <SelectContent>
              {seasons.map(season => (
                <SelectItem key={season} value={season}>
                  {season}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="energy">
        <TabsList>
          <TabsTrigger value="energy">Energy Consumption</TabsTrigger>
          <TabsTrigger value="cost">Cost Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="energy">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Daily Energy Consumption Profile</h3>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {buildingProfiles.map(building => (
                    <Line
                      key={building.id}
                      type="monotone"
                      data={building.profile}
                      dataKey="energyConsumption"
                      name={building.name}
                      stroke={`#${Math.floor(Math.random()*16777215).toString(16)}`}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="cost">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Daily Cost Analysis</h3>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {buildingProfiles.map(building => (
                    <Line
                      key={building.id}
                      type="monotone"
                      data={building.profile}
                      dataKey="cost"
                      name={building.name}
                      stroke={`#${Math.floor(Math.random()*16777215).toString(16)}`}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 