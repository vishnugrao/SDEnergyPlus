"use client";

import { useEffect, useState } from 'react';
import { BuildingComparison } from '@/components/BuildingComparison';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { BuildingDesign } from '@/types/building';

export default function ComparePage() {
  const [allBuildings, setAllBuildings] = useState<BuildingDesign[]>([]);
  const [selectedBuildings, setSelectedBuildings] = useState<BuildingDesign[]>([]);

  useEffect(() => {
    fetchBuildings();
  }, []);

  const fetchBuildings = async () => {
    const response = await fetch('http://localhost:5050/building-designs');
    if (response.ok) {
      const data = await response.json();
      setAllBuildings(data);
    }
  };

  const handleSelect = (building: BuildingDesign) => {
    if (selectedBuildings.some(b => b._id === building._id)) {
      setSelectedBuildings(selectedBuildings.filter(b => b._id !== building._id));
    } else {
      setSelectedBuildings([...selectedBuildings, building]);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Select Buildings to Compare</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allBuildings.map((building) => (
              <div
                key={building._id}
                className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent cursor-pointer"
                onClick={() => handleSelect(building)}
              >
                <Checkbox
                  checked={selectedBuildings.some(b => b._id === building._id)}
                  onCheckedChange={() => handleSelect(building)}
                />
                <div>
                  <div className="font-medium">{building.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {building.createdAt ? new Date(building.createdAt).toLocaleString() : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      {selectedBuildings.length > 0 && <BuildingComparison buildings={selectedBuildings} />}
    </div>
  );
} 