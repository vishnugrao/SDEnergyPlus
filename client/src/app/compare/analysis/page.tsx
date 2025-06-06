"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { BuildingComparison } from '@/components/BuildingComparison';
import { BuildingDesign } from '@/types/building';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AnalysisPage() {
  const searchParams = useSearchParams();
  const [buildings, setBuildings] = useState<BuildingDesign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const buildingIds = searchParams.get('buildings')?.split(',');
        if (!buildingIds || buildingIds.length === 0) {
          throw new Error('No building IDs provided');
        }

        const buildingsData = await Promise.all(
          buildingIds.map(async (id) => {
            const response = await fetch(`http://localhost:5050/building-designs/${id}`);
            if (!response.ok) {
              throw new Error(`Failed to fetch building with ID: ${id}`);
            }
            return response.json();
          })
        );

        setBuildings(buildingsData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred while fetching buildings';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchBuildings();
  }, [searchParams]);

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Loading Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <BuildingComparison buildings={buildings} />
    </div>
  );
} 