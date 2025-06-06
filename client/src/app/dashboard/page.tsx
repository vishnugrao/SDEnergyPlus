"use client";

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { BuildingDesign } from '@/types/building';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';
import { EnhancedBuildingAnalytics } from '@/components/EnhancedBuildingAnalytics';

export default function DashboardPage() {
  const router = useRouter();
  const [allBuildings, setAllBuildings] = useState<BuildingDesign[]>([]);
  const [selectedBuildings, setSelectedBuildings] = useState<BuildingDesign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBuildings();
  }, []);

  const fetchBuildings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('http://localhost:5050/building-designs');
      
      if (!response.ok) {
        throw new Error('Failed to fetch building designs');
      }
      
      const data = await response.json();
      setAllBuildings(data);
      
      if (data.length === 0) {
        toast.info('No building designs found. Create a new design to get started.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while fetching buildings';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (building: BuildingDesign) => {
    if (selectedBuildings.some(b => b._id === building._id)) {
      setSelectedBuildings(selectedBuildings.filter(b => b._id !== building._id));
    } else {
      setSelectedBuildings([...selectedBuildings, building]);
    }
  };

  const handleBuildingClick = (building: BuildingDesign) => {
    router.push(`/dashboard/${building._id}/edit`);
  };

  if (error) {
    return (
      <div className="container mx-auto py-8 space-y-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={fetchBuildings}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Your Building Designs</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                  <Skeleton className="h-4 w-4" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : allBuildings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No building designs found</p>
              <Button variant="link" onClick={() => window.location.href = '/designs/new'}>
                Create a new design
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allBuildings.map((building) => (
                  <div
                    key={building._id}
                    className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent"
                  >
                    <div onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedBuildings.some(b => b._id === building._id)}
                        onCheckedChange={() => handleSelect(building)}
                      />
                    </div>
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => handleSelect(building)}
                    >
                      <div className="font-medium hover:text-primary">{building.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {building.createdAt ? new Date(building.createdAt).toLocaleString() : ''}
                      </div>
                    </div>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBuildingClick(building);
                      }}
                      className="whitespace-nowrap bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      Edit Building
                    </Button>
                  </div>
                ))}
              </div>
              {selectedBuildings.length > 0 && (
                <div className="mt-8">
                  <EnhancedBuildingAnalytics buildings={selectedBuildings} />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 