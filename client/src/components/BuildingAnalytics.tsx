import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { BuildingDesign } from '@/types/building';
import { formatToOneDecimal } from '@/utils/formatting';
import { toast } from 'sonner';
import { Skeleton } from './ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { calculateDailyEnergyProfile } from '@/lib/heat-gain-utils';

interface BuildingAnalyticsProps {
    buildingIds: string[];
    city: string;
}

interface AnalyticsData {
    buildingDesignId: string;
    name: string;
    totalEnergyConsumption: number;
    averageEnergyEfficiency: number;
    peakDemand: number;
    carbonEmissions: number;
    costSavings: number;
    hourlyProfile?: Array<{
        energyConsumed: number;
        cost: number;
    }>;
}

const VALID_CITIES = ['Bangalore', 'Mumbai', 'Kolkata', 'Delhi'];
const SEASONS = ['Summer', 'Winter', 'Monsoon'] as const;

const cityData = {
    'Bangalore': { 
        electricityRate: 6.5,
        solarRadiation: {
            north: 150,
            south: 250,
            east: 200,
            west: 200,
            roof: 300
        },
        temperature: {
            summer: 35,
            winter: 20,
            monsoon: 28
        },
        humidity: {
            summer: 60,
            winter: 40,
            monsoon: 80
        }
    },
    'Mumbai': { 
        electricityRate: 9.0,
        solarRadiation: {
            north: 180,
            south: 350,
            east: 280,
            west: 270,
            roof: 400
        },
        temperature: {
            summer: 32,
            winter: 22,
            monsoon: 30
        },
        humidity: {
            summer: 75,
            winter: 50,
            monsoon: 85
        }
    },
    'Kolkata': { 
        electricityRate: 7.5,
        solarRadiation: {
            north: 200,
            south: 400,
            east: 300,
            west: 290,
            roof: 450
        },
        temperature: {
            summer: 34,
            winter: 18,
            monsoon: 32
        },
        humidity: {
            summer: 70,
            winter: 45,
            monsoon: 82
        }
    },
    'Delhi': { 
        electricityRate: 8.5,
        solarRadiation: {
            north: 160,
            south: 270,
            east: 220,
            west: 220,
            roof: 320
        },
        temperature: {
            summer: 40,
            winter: 15,
            monsoon: 35
        },
        humidity: {
            summer: 50,
            winter: 30,
            monsoon: 70
        }
    }
};

export function BuildingAnalytics({ buildingIds, city }: BuildingAnalyticsProps) {
    const [loading, setLoading] = useState(true);
    const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
    const [selectedSeason, setSelectedSeason] = useState<typeof SEASONS[number]>(SEASONS[0]);

    useEffect(() => {
        if (!VALID_CITIES.includes(city)) {
            toast.error(`Invalid city. Please select one of: ${VALID_CITIES.join(', ')}`);
            return;
        }
        fetchAnalytics();
    }, [buildingIds, city, selectedSeason]);

    const fetchAnalytics = async () => {
        try {
            if (!buildingIds.length) {
                toast.error('No buildings selected for analysis');
                return;
            }

            setLoading(true);
            
            const response = await fetch(`http://localhost:5050/analysis/buildings?ids=${buildingIds.join(',')}&city=${city}`);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.error || 'Failed to fetch analytics data');
            }
            
            const data = await response.json();
            
            if (!Array.isArray(data) || data.length === 0) {
                throw new Error('No analytics data available for the selected buildings');
            }

            // Calculate hourly profiles for each building
            const dataWithProfiles = data.map(building => {
                // Defensive check for facades
                if (!building.facades || !building.facades.north || !building.facades.south || !building.facades.east || !building.facades.west) {
                    toast.warning(`Building ${building.name || building._id || 'Unknown'} is missing facade data. Skipping profile calculation.`);
                    return { ...building, hourlyProfile: [] };
                }
                return {
                    ...building,
                    hourlyProfile: calculateDailyEnergyProfile(building, city, selectedSeason)
                };
            });
            
            setAnalyticsData(dataWithProfiles);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to fetch analytics data';
            toast.error(errorMessage);
            console.error('Analytics fetch error:', error);
            setAnalyticsData([]);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-6 w-32" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-24" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (!analyticsData.length) {
        return <div>No analytics data available</div>;
    }

    // Prepare data for charts
    const hourlyData = Array.from({ length: 24 }, (_, hour) => {
        const data: any = { hour };
        analyticsData.forEach(building => {
            if (building.hourlyProfile && building.hourlyProfile[hour]) {
                data[`${building.name} Energy`] = building.hourlyProfile[hour].energyConsumed;
                data[`${building.name} Cost`] = building.hourlyProfile[hour].cost;
            } else {
                data[`${building.name} Energy`] = null;
                data[`${building.name} Cost`] = null;
            }
        });
        return data;
    });

    const totalData = analyticsData.map(data => ({
        name: data.name,
        totalEnergy: data.totalEnergyConsumption,
        costSavings: data.costSavings
    }));

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Building Analytics for {city}</h2>
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
                                    {analyticsData.map((building, index) => (
                                        <Line
                                            key={`${building.buildingDesignId}-energy`}
                                            type="monotone"
                                            dataKey={`${building.name} Energy`}
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
                        <CardTitle>Total Energy Consumption and Cost Savings</CardTitle>
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
                                    <Bar yAxisId="right" dataKey="costSavings" name="Cost Savings (₹)" fill="#82ca9d" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {analyticsData.map((data) => (
                    <Card key={data.buildingDesignId}>
                        <CardHeader>
                            <CardTitle>{data.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Energy Consumption</p>
                                <p className="text-2xl font-bold">
                                    {formatToOneDecimal(data.totalEnergyConsumption)} kWh
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Energy Efficiency</p>
                                <p className="text-2xl font-bold">
                                    {formatToOneDecimal(data.averageEnergyEfficiency)}%
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Peak Demand</p>
                                <p className="text-2xl font-bold">
                                    {formatToOneDecimal(data.peakDemand)} kW
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Carbon Emissions</p>
                                <p className="text-2xl font-bold">
                                    {formatToOneDecimal(data.carbonEmissions)} tons
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Cost Savings</p>
                                <p className="text-2xl font-bold">
                                    ₹{formatToOneDecimal(data.costSavings)}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
} 