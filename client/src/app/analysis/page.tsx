'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { BuildingComparison } from '@/components/BuildingComparison';
import { BuildingDesign } from '@/types/building';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
} from 'recharts';
import { calculateDailyEnergyProfile } from '@/lib/heat-gain-utils';
import { formatNumber } from '@/utils/formatNumber';

const VALID_CITIES = ['Bangalore', 'Mumbai', 'Kolkata', 'Delhi'];
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
    };
    coolingCost: number;
    energyConsumption: number;
    createdAt: string;
}

interface CityAnalysisResults {
    [city: string]: AnalysisResult[];
}

export default function AnalysisPage() {
    const searchParams = useSearchParams();
    const [buildings, setBuildings] = useState<BuildingDesign[]>([]);
    const [analysisResults, setAnalysisResults] = useState<CityAnalysisResults>({});
    const [buildingsLoading, setBuildingsLoading] = useState(true);
    const [analysisLoading, setAnalysisLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCity, setSelectedCity] = useState(VALID_CITIES[0]);
    const [selectedSeason, setSelectedSeason] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('heat-gain');

    useEffect(() => {
        const fetchBuildings = async () => {
            try {
                setBuildingsLoading(true);
                setError(null);
                
                const buildingIds = searchParams.get('ids')?.split(',');
                
                // Fetch buildings data
                const buildingsData = await Promise.all(
                    buildingIds ? 
                    buildingIds.map(async (id) => {
                        const response = await fetch(`http://localhost:5050/building-designs/${id}`);
                        if (!response.ok) {
                            throw new Error(`Failed to fetch building with ID: ${id}`);
                        }
                        return response.json();
                    }) :
                    [await fetch('http://localhost:5050/building-designs').then(res => res.json())]
                );

                setBuildings(buildingsData);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'An error occurred while fetching data';
                setError(errorMessage);
                toast.error(errorMessage);
            } finally {
                setBuildingsLoading(false);
            }
        };

        fetchBuildings();
    }, [searchParams]);

    useEffect(() => {
        const fetchAnalysisResults = async () => {
            if (buildings.length === 0) {
                setAnalysisResults({});
                setAnalysisLoading(false);
                return;
            }

            try {
                setAnalysisLoading(true);
                setError(null);

                const buildingIds = buildings.map(b => b._id).join(',');
                const results: CityAnalysisResults = {};

                // Fetch data for all cities in parallel
                await Promise.all(
                    VALID_CITIES.map(async (city) => {
                        const response = await fetch(`http://localhost:5050/analysis/buildings?ids=${buildingIds}&city=${city}`);
                        
                        if (!response.ok) {
                            const errorData = await response.json();
                            throw new Error(errorData.error || `Failed to fetch analysis results for ${city}`);
                        }

                        const data = await response.json();
                        results[city] = data;
                    })
                );

                setAnalysisResults(results);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'An error occurred while fetching analysis results';
                setError(errorMessage);
                toast.error(errorMessage);
            } finally {
                setAnalysisLoading(false);
            }
        };

        fetchAnalysisResults();
    }, [buildings]);

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

    if (buildingsLoading || analysisLoading) {
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

    // Helper function to get current city's data
    const getCurrentCityData = () => analysisResults[selectedCity] || [];

    // Prepare data for visualizations
    const heatGainData = getCurrentCityData().map(result => ({
        name: result.name,
        north: result.heatGain.north,
        south: result.heatGain.south,
        east: result.heatGain.east,
        west: result.heatGain.west,
    }));

    const cityComparisonData = getCurrentCityData().map(result => ({
        name: result.name,
        coolingCost: result.coolingCost,
        energyConsumption: result.energyConsumption,
    }));

    const heatGainDistribution = getCurrentCityData().length > 0 ? [
        { name: 'North', value: getCurrentCityData()[0].heatGain.north },
        { name: 'South', value: getCurrentCityData()[0].heatGain.south },
        { name: 'East', value: getCurrentCityData()[0].heatGain.east },
        { name: 'West', value: getCurrentCityData()[0].heatGain.west },
    ] : [];

    return (
        <div className="container mx-auto py-8 space-y-6">
            <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold">Building Analytics</h1>
                <Select value={selectedCity} onValueChange={setSelectedCity} disabled={activeTab === 'city-ranking'}>
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

            <Tabs defaultValue="heat-gain" value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="heat-gain">Heat Gain Analysis</TabsTrigger>
                    <TabsTrigger value="cooling-cost">Cooling Cost</TabsTrigger>
                    <TabsTrigger value="city-ranking">City Performance</TabsTrigger>
                    <TabsTrigger value="comparative">Comparative Analysis</TabsTrigger>
                </TabsList>

                <TabsContent value="heat-gain">
                    <Card>
                        <CardHeader>
                            <CardTitle>Heat Gain per Facade</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[400px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={heatGainData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis tickFormatter={formatNumber} />
                                        <Tooltip formatter={(value: number) => formatNumber(value)} />
                                        <Legend />
                                        <Bar dataKey="north" name="North" fill={COLORS[0]} />
                                        <Bar dataKey="south" name="South" fill={COLORS[1]} />
                                        <Bar dataKey="east" name="East" fill={COLORS[2]} />
                                        <Bar dataKey="west" name="West" fill={COLORS[3]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="cooling-cost">
                    <Card>
                        <CardHeader>
                            <CardTitle>Cooling Cost Analysis</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[400px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={cityComparisonData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis yAxisId="left" orientation="left" stroke="#8884d8" tickFormatter={formatNumber} />
                                        <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" tickFormatter={formatNumber} />
                                        <Tooltip formatter={(value: number) => formatNumber(value)} />
                                        <Legend />
                                        <Bar yAxisId="left" dataKey="coolingCost" name="Cooling Cost (Rs)" fill="#8884d8" />
                                        <Bar yAxisId="right" dataKey="energyConsumption" name="Energy Consumption (kWh)" fill="#82ca9d" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="city-ranking">
                    <Card>
                        <CardHeader>
                            <CardTitle>City Performance Ranking</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-4 text-muted-foreground text-sm">
                                <strong>Weighted Aggregated Metric:</strong> For each building, this metric is calculated as the weighted sum of facade and skylight heat gains: <br />
                                <code>0.25 × North + 0.25 × South + 0.25 × East + 0.25 × West [+ 0.1 × Skylight (if present)]</code>.<br />
                                This provides a single comparable score for each building's total heat gain performance.
                            </div>
                            <div className="h-[500px]">
                                {(() => {
                                    // Assign a unique color to each city
                                    const cityColorMap: Record<string, string> = {};
                                    VALID_CITIES.forEach((city, idx) => {
                                        cityColorMap[city] = COLORS[idx % COLORS.length];
                                    });

                                    // Flatten all buildings into a single array with weighted metric and city
                                    const allBuildings = Object.entries(analysisResults).flatMap(([city, results]) => 
                                        results.map(result => {
                                            const base: Record<string, any> = {
                                                name: result.name,
                                                city: city,
                                                north: result.heatGain.north,
                                                south: result.heatGain.south,
                                                east: result.heatGain.east,
                                                west: result.heatGain.west
                                            };
                                            let skylightVal = undefined;
                                            if ('skylight' in result.heatGain && typeof (result.heatGain as any).skylight === 'number') {
                                                skylightVal = (result.heatGain as any).skylight;
                                                base.skylight = skylightVal;
                                            } else if ('skylight' in result && result.skylight && typeof (result.skylight as any).heatGain === 'number') {
                                                skylightVal = (result.skylight as any).heatGain;
                                                base.skylight = skylightVal;
                                            }
                                            base.weightedMetric = 0.25 * base.north + 0.25 * base.south + 0.25 * base.east + 0.25 * base.west + (skylightVal ? 0.1 * skylightVal : 0);
                                            return base;
                                        })
                                    );

                                    if (allBuildings.length === 0) {
                                        return <div className="flex items-center justify-center h-full"><p className="text-muted-foreground">No data available for the selected buildings</p></div>;
                                    }

                                    // Custom bar color by city
                                    const getBarColor = (entry: any) => cityColorMap[entry.city] || '#8884d8';

                                    // Custom legend for city colors
                                    const CustomLegend = () => (
                                        <div className="flex gap-6 mb-2">
                                            {Object.entries(cityColorMap).map(([city, color]) => (
                                                <div key={city} className="flex items-center gap-2">
                                                    <span className="inline-block w-4 h-4 rounded" style={{ background: color }}></span>
                                                    <span>{city}</span>
                                                </div>
                                            ))}
                                        </div>
                                    );

                                    return (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={allBuildings}
                                                margin={{ top: 40, right: 30, left: 20, bottom: 40 }}
                                                barGap={8}
                                                barCategoryGap={24}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={false} />
                                                <XAxis 
                                                    dataKey="name"
                                                    type="category"
                                                    tick={{ fontSize: 12 }}
                                                    interval={0}
                                                    angle={-30}
                                                    textAnchor="end"
                                                    height={80}
                                                    label={{ value: 'Building', position: 'insideBottom', offset: 0 }}
                                                />
                                                <YAxis 
                                                    type="number"
                                                    tickFormatter={formatNumber}
                                                    label={{ value: 'Weighted Heat Gain (kWh)', angle: -90, position: 'insideLeft', offset: 10 }}
                                                />
                                                <Tooltip 
                                                    formatter={(value: number) => formatNumber(value)}
                                                    labelFormatter={(label: string, payload: any) => {
                                                        const entry = allBuildings.find(b => b.name === label);
                                                        return entry ? `${label} (${entry.city})` : label;
                                                    }}
                                                />
                                                <Legend content={<CustomLegend />} />
                                                <Bar 
                                                    dataKey="weightedMetric"
                                                    name="Weighted Metric"
                                                    radius={[4, 4, 0, 0]}
                                                    maxBarSize={32}
                                                    isAnimationActive={false}
                                                    {
                                                        ...{
                                                            fill: undefined,
                                                            // Use a function to set color per bar
                                                            shape: (props: any) => {
                                                                const { x, y, width, height, payload } = props;
                                                                return (
                                                                    <rect
                                                                        x={x}
                                                                        y={y}
                                                                        width={width}
                                                                        height={height}
                                                                        fill={getBarColor(payload)}
                                                                        rx={4}
                                                                        ry={4}
                                                                    />
                                                                );
                                                            }
                                                        }
                                                    }
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    );
                                })()}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="comparative">
                    <Card>
                        <CardHeader>
                            <CardTitle>Comparative Analysis</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[400px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={getCurrentCityData()}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis 
                                            domain={[0, 'auto']}
                                            tickFormatter={formatNumber}
                                        />
                                        <Tooltip formatter={(value: number) => formatNumber(value)} />
                                        <Legend />
                                        <Line type="monotone" dataKey="heatGain.total" name="Total Heat Gain" stroke="#8884d8" />
                                        <Line type="monotone" dataKey="energyConsumption" name="Energy Consumption" stroke="#82ca9d" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
} 