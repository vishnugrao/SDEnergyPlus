'use client';

import { BuildingAnalytics } from '@/components/BuildingAnalytics';
import { useSearchParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';

const VALID_CITIES = ['Bangalore', 'Mumbai', 'Kolkata', 'Delhi'];

export default function AnalyticsPage() {
    const searchParams = useSearchParams();
    const buildingIds = searchParams.get('ids')?.split(',') || [];
    const [selectedCity, setSelectedCity] = useState(VALID_CITIES[0]);

    return (
        <div className="container mx-auto py-8 space-y-6">
            <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold">Building Analytics</h1>
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select city" />
                    </SelectTrigger>
                    <SelectContent>
                        {VALID_CITIES.map((city) => (
                            <SelectItem key={city} value={city}>{city}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <BuildingAnalytics buildingIds={buildingIds} city={selectedCity} />
        </div>
    );
} 