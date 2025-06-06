'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BuildingDesign } from '@/types/building';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { calculateDailyEnergyProfile, CITY_DATA } from '@/lib/heat-gain-utils';

const CITIES = Object.keys(CITY_DATA) as Array<keyof typeof CITY_DATA>;
const SEASONS = ['Summer', 'Winter', 'Monsoon'] as const;

export default function BuildingAnalysisPage() {
    const params = useParams();
    const router = useRouter();
    const [designs, setDesigns] = useState<BuildingDesign[]>([]);
    const [selectedCity, setSelectedCity] = useState<typeof CITIES[number]>(CITIES[0]);
    const [selectedSeason, setSelectedSeason] = useState<typeof SEASONS[number]>(SEASONS[0]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDesigns();
    }, [params.id]);

    const fetchDesigns = async () => {
        try {
            const response = await fetch(`http://localhost:5050/building-designs?buildingId=${params.id}`);
            if (!response.ok) {
                throw new Error('Failed to fetch designs');
            }
            const data = await response.json();
            setDesigns(data);
        } catch (error) {
            toast.error('Failed to fetch designs');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="text-center py-8">Loading analysis...</div>;
    }

    // Calculate energy profiles for each design
    const designProfiles = designs.map(design => ({
        ...design,
        profile: calculateDailyEnergyProfile(design, selectedCity, selectedSeason)
    }));

    // Prepare data for charts
    const hourlyData = Array.from({ length: 24 }, (_, hour) => {
        const data: any = { hour };
        designProfiles.forEach(design => {
            data[`${design.name} Energy`] = design.profile[hour].energyConsumed;
            data[`${design.name} Cost`] = design.profile[hour].cost;
        });
        return data;
    });

    const totalData = designProfiles.map(design => ({
        name: design.name,
        totalEnergy: design.profile.reduce((sum, h) => sum + h.energyConsumed, 0),
        totalCost: design.profile.reduce((sum, h) => sum + h.cost, 0)
    }));

    return (
        <div className="container mx-auto py-8 space-y-8">
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    onClick={() => router.back()}
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Dashboard
                </Button>
                <h1 className="text-3xl font-bold">Building Analysis</h1>
            </div>

            <div className="flex gap-4">
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

            <div className="grid grid-cols-1 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Hourly Energy Consumption</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={hourlyData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="hour" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    {designProfiles.map((design, index) => (
                                        <Line
                                            key={`${design._id}-energy`}
                                            type="monotone"
                                            dataKey={`${design.name} Energy`}
                                            stroke={`hsl(${index * 137.5}, 70%, 50%)`}
                                        />
                                    ))}
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Total Energy Consumption and Cost</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={totalData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                                    <Tooltip />
                                    <Legend />
                                    <Bar yAxisId="left" dataKey="totalEnergy" name="Total Energy (kWh)" fill="#8884d8" />
                                    <Bar yAxisId="right" dataKey="totalCost" name="Total Cost (Rs)" fill="#82ca9d" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
} 