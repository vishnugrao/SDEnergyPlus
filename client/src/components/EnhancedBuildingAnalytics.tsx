import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { BuildingDesign } from '@/types/building';
import { toast } from 'sonner';
import { formatNumber } from '@/utils/formatNumber';
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
import { Skeleton } from './ui/skeleton';

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
}

interface EnhancedBuildingAnalyticsProps {
    buildings: BuildingDesign[];
}

const CITIES = ['Bangalore', 'Mumbai', 'Kolkata', 'Delhi'] as const;
const SEASONS = ['Summer', 'Winter', 'Monsoon'] as const;
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

// Visualization configuration types
type MetricType = 'heatGain' | 'coolingCost' | 'energyConsumption';
type FacadeType = 'north' | 'south' | 'east' | 'west' | 'total';
type ChartType = 'bar' | 'line' | 'pie';

interface VisualizationConfig {
    metric: MetricType;
    facade?: FacadeType;
    chartType: ChartType;
    showAllCities: boolean;
}

export function EnhancedBuildingAnalytics({ buildings }: EnhancedBuildingAnalyticsProps) {
    const [selectedCity, setSelectedCity] = useState<typeof CITIES[number]>(CITIES[0]);
    const [selectedSeason, setSelectedSeason] = useState<typeof SEASONS[number]>(SEASONS[0]);
    const [initialLoading, setInitialLoading] = useState(true);
    const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [visualizationConfig, setVisualizationConfig] = useState<VisualizationConfig>({
        metric: 'heatGain',
        facade: 'total',
        chartType: 'bar',
        showAllCities: false
    });

    useEffect(() => {
        fetchAnalysisResults();
    }, [buildings]);

    const fetchAnalysisResults = async () => {
        try {
            setInitialLoading(true);
            setError(null);

            if (buildings.length === 0) {
                setAnalysisResults([]);
                return;
            }

            const buildingIds = buildings.map(b => b._id).join(',');
            
            const response = await fetch(`http://localhost:5050/analysis/buildings?ids=${buildingIds}`);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Failed to fetch analysis results: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            
            if (!Array.isArray(data)) {
                throw new Error('Invalid response format from server');
            }

            // Validate the response data
            const validResults = data.filter(result => {
                const isValid = result && 
                    result.heatGain && 
                    typeof result.heatGain.north === 'number' &&
                    typeof result.heatGain.south === 'number' &&
                    typeof result.heatGain.east === 'number' &&
                    typeof result.heatGain.west === 'number' &&
                    typeof result.heatGain.total === 'number' &&
                    typeof result.coolingCost === 'number' &&
                    typeof result.energyConsumption === 'number';
                
                if (!isValid) {
                    console.warn('Invalid result found:', result);
                }
                return isValid;
            });

            if (validResults.length === 0) {
                throw new Error('No valid analysis results found');
            }

            setAnalysisResults(validResults);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An error occurred while fetching analysis results';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setInitialLoading(false);
        }
    };

    // Filter results based on visualization configuration
    const getFilteredResults = () => {
        let results = analysisResults;
        
        if (!visualizationConfig.showAllCities) {
            results = results.filter(result => result.city === selectedCity);
        }

        // Round all numeric values in the results
        return results.map(result => ({
            ...result,
            heatGain: {
                north: Number(result.heatGain.north.toFixed(1)),
                south: Number(result.heatGain.south.toFixed(1)),
                east: Number(result.heatGain.east.toFixed(1)),
                west: Number(result.heatGain.west.toFixed(1)),
                total: Number(result.heatGain.total.toFixed(1))
            },
            coolingCost: Number(result.coolingCost.toFixed(1)),
            energyConsumption: Number(result.energyConsumption.toFixed(1))
        }));
    };

    // Get city ranking data
    const getCityRankingData = () => {
        const cityData = CITIES.map(city => {
            const cityResults = analysisResults.filter(result => result.city === city);
            if (cityResults.length === 0) return null;

            const avgEnergyConsumption = cityResults.reduce((sum, b) => sum + b.energyConsumption, 0) / cityResults.length;
            const avgCoolingCost = cityResults.reduce((sum, b) => sum + b.coolingCost, 0) / cityResults.length;
            const avgHeatGain = cityResults.reduce((sum, b) => sum + b.heatGain.total, 0) / cityResults.length;

            return {
                city,
                energyConsumption: Number(avgEnergyConsumption.toFixed(1)),
                coolingCost: Number(avgCoolingCost.toFixed(1)),
                heatGain: Number(avgHeatGain.toFixed(1))
            };
        }).filter(Boolean);

        return cityData;
    };

    // Render chart based on configuration
    const renderChart = (data: any[]): React.ReactElement => {
        const { chartType, metric, facade, showAllCities } = visualizationConfig;

        const CustomTooltip = ({ active, payload, label }: any) => {
            if (active && payload && payload.length) {
                return (
                    <div className="bg-white p-4 border rounded-lg shadow-lg">
                        <p className="font-semibold">{label}</p>
                        {payload.map((entry: any, index: number) => (
                            <p key={index} style={{ color: entry.color }}>
                                {entry.name}: {formatNumber(entry.value)}
                            </p>
                        ))}
                    </div>
                );
            }
            return null;
        };

        const chartProps = {
            margin: { top: 20, right: 30, left: 20, bottom: 5 },
            data: data,
        };

        switch (chartType) {
            case 'bar':
                return (
                    <BarChart {...chartProps}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                            dataKey={showAllCities ? "city" : "name"} 
                            tick={{ fill: '#666' }}
                            tickLine={{ stroke: '#666' }}
                        />
                        <YAxis 
                            tickFormatter={formatNumber}
                            tick={{ fill: '#666' }}
                            tickLine={{ stroke: '#666' }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend 
                            wrapperStyle={{ paddingTop: '20px' }}
                            formatter={(value) => <span style={{ color: '#666' }}>{value}</span>}
                        />
                        {metric === 'heatGain' ? (
                            <>
                                <Bar dataKey="heatGain.north" name="North" fill={COLORS[0]} />
                                <Bar dataKey="heatGain.south" name="South" fill={COLORS[1]} />
                                <Bar dataKey="heatGain.east" name="East" fill={COLORS[2]} />
                                <Bar dataKey="heatGain.west" name="West" fill={COLORS[3]} />
                            </>
                        ) : (
                            <Bar 
                                dataKey={metric} 
                                name={metric === 'coolingCost' ? 'Cooling Cost (₹)' : 'Energy Consumption (kWh)'} 
                                fill={COLORS[0]} 
                            />
                        )}
                    </BarChart>
                );
            case 'line':
                return (
                    <LineChart {...chartProps}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                            dataKey={showAllCities ? "city" : "name"} 
                            tick={{ fill: '#666' }}
                            tickLine={{ stroke: '#666' }}
                        />
                        <YAxis 
                            tickFormatter={formatNumber}
                            tick={{ fill: '#666' }}
                            tickLine={{ stroke: '#666' }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend 
                            wrapperStyle={{ paddingTop: '20px' }}
                            formatter={(value) => <span style={{ color: '#666' }}>{value}</span>}
                        />
                        {metric === 'heatGain' ? (
                            <>
                                <Line type="monotone" dataKey="heatGain.north" name="North" stroke={COLORS[0]} strokeWidth={2} />
                                <Line type="monotone" dataKey="heatGain.south" name="South" stroke={COLORS[1]} strokeWidth={2} />
                                <Line type="monotone" dataKey="heatGain.east" name="East" stroke={COLORS[2]} strokeWidth={2} />
                                <Line type="monotone" dataKey="heatGain.west" name="West" stroke={COLORS[3]} strokeWidth={2} />
                            </>
                        ) : (
                            <Line 
                                type="monotone" 
                                dataKey={metric} 
                                name={metric === 'coolingCost' ? 'Cooling Cost (₹)' : 'Energy Consumption (kWh)'} 
                                stroke={COLORS[0]} 
                                strokeWidth={2}
                            />
                        )}
                    </LineChart>
                );
            case 'pie':
                return (
                    <PieChart {...chartProps}>
                        <Pie
                            data={data}
                            dataKey={metric}
                            nameKey={showAllCities ? "city" : "name"}
                            cx="50%"
                            cy="50%"
                            outerRadius={150}
                            fill="#8884d8"
                            label={({ name, value }) => `${name}: ${formatNumber(value)}`}
                            labelLine={{ stroke: '#666' }}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend 
                            wrapperStyle={{ paddingTop: '20px' }}
                            formatter={(value) => <span style={{ color: '#666' }}>{value}</span>}
                        />
                    </PieChart>
                );
            default:
                return (
                    <BarChart {...chartProps}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                            dataKey={showAllCities ? "city" : "name"} 
                            tick={{ fill: '#666' }}
                            tickLine={{ stroke: '#666' }}
                        />
                        <YAxis 
                            tickFormatter={formatNumber}
                            tick={{ fill: '#666' }}
                            tickLine={{ stroke: '#666' }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend 
                            wrapperStyle={{ paddingTop: '20px' }}
                            formatter={(value) => <span style={{ color: '#666' }}>{value}</span>}
                        />
                        <Bar 
                            dataKey={metric} 
                            name={metric === 'coolingCost' ? 'Cooling Cost (₹)' : 'Energy Consumption (kWh)'} 
                            fill={COLORS[0]} 
                        />
                    </BarChart>
                );
        }
    };

    if (initialLoading) {
        return (
            <div className="space-y-8">
                <div className="flex gap-4">
                    <Skeleton className="h-10 w-[180px]" />
                    <Skeleton className="h-10 w-[180px]" />
                </div>
                <div className="space-y-4">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-[400px] w-full" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8">
                <p className="text-destructive">{error}</p>
                <Button variant="outline" onClick={fetchAnalysisResults} className="mt-4">
                    Retry
                </Button>
            </div>
        );
    }

    if (analysisResults.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-muted-foreground">No analysis results available</p>
            </div>
        );
    }

    const filteredResults = getFilteredResults();
    const cityRankingData = getCityRankingData();

    return (
        <div className="space-y-8">
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

                <Select 
                    value={visualizationConfig.metric} 
                    onValueChange={(value: MetricType) => setVisualizationConfig(prev => ({ ...prev, metric: value }))}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select metric" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="heatGain">Heat Gain</SelectItem>
                        <SelectItem value="coolingCost">Cooling Cost</SelectItem>
                        <SelectItem value="energyConsumption">Energy Consumption</SelectItem>
                    </SelectContent>
                </Select>

                <Select 
                    value={visualizationConfig.chartType} 
                    onValueChange={(value: ChartType) => setVisualizationConfig(prev => ({ ...prev, chartType: value }))}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select chart type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="bar">Bar Chart</SelectItem>
                        <SelectItem value="line">Line Chart</SelectItem>
                        <SelectItem value="pie">Pie Chart</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Tabs defaultValue="analysis">
                <TabsList>
                    <TabsTrigger value="analysis">Analysis</TabsTrigger>
                    <TabsTrigger value="city-ranking">City Performance</TabsTrigger>
                </TabsList>

                <TabsContent value="analysis">
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                {visualizationConfig.metric === 'heatGain' ? 'Heat Gain Analysis' : 
                                 visualizationConfig.metric === 'coolingCost' ? 'Cooling Cost Analysis' : 
                                 'Energy Consumption Analysis'} - {selectedCity}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[400px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    {renderChart(filteredResults)}
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="city-ranking">
                    <Card>
                        <CardHeader>
                            <CardTitle>City Performance Comparison</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[400px]">
                                {cityRankingData.length === 0 ? (
                                    <div className="flex items-center justify-center h-full">
                                        <p className="text-muted-foreground">No data available for the selected cities</p>
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={cityRankingData}
                                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="city" />
                                            <YAxis 
                                                tickFormatter={formatNumber}
                                            />
                                            <Tooltip />
                                            <Legend />
                                            <Bar 
                                                dataKey="energyConsumption" 
                                                name="Energy Consumption (kWh)" 
                                                fill="#8884d8" 
                                            />
                                            <Bar 
                                                dataKey="coolingCost" 
                                                name="Cooling Cost (₹)" 
                                                fill="#82ca9d" 
                                            />
                                            <Bar 
                                                dataKey="heatGain" 
                                                name="Heat Gain (kWh)" 
                                                fill="#ffc658" 
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
} 