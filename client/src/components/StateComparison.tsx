import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { format } from 'date-fns';
import { BuildingDesign } from '../types/building';
import { useState, useEffect } from 'react';
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
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

interface DifferenceValue {
    from: number;
    to: number;
}

interface FacadeDifferences {
    [key: string]: DifferenceValue;
}

interface Differences {
    facades?: {
        [key: string]: FacadeDifferences;
    };
    skylight?: {
        [key: string]: DifferenceValue;
    };
}

interface StateComparisonProps {
    state1: BuildingDesign;
    state2: BuildingDesign;
    timestamp1: Date;
    timestamp2: Date;
    differences: Differences;
}

interface AnalysisResult {
    design1: {
        heatGain: {
            north: number;
            south: number;
            east: number;
            west: number;
            total: number;
        };
        coolingCost: number;
        energyConsumption: number;
    };
    design2: {
        heatGain: {
            north: number;
            south: number;
            east: number;
            west: number;
            total: number;
        };
        coolingCost: number;
        energyConsumption: number;
    };
}

export function StateComparison({
    state1,
    state2,
    timestamp1,
    timestamp2,
    differences
}: StateComparisonProps) {
    const [analysisResults, setAnalysisResults] = useState<AnalysisResult | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalysisResults = async () => {
            try {
                const response = await fetch(`http://localhost:5050/analysis/compare/${state1._id}/${state2._id}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch analysis results');
                }
                const data = await response.json();
                setAnalysisResults(data);
            } catch (error) {
                console.error('Error fetching analysis results:', error);
            } finally {
                setLoading(false);
            }
        };

        if (state1._id && state2._id) {
            fetchAnalysisResults();
        }
    }, [state1._id, state2._id]);

    const heatGainData = analysisResults?.design1?.heatGain && analysisResults?.design2?.heatGain ? [
        {
            name: 'North',
            design1: analysisResults.design1.heatGain.north,
            design2: analysisResults.design2.heatGain.north,
        },
        {
            name: 'South',
            design1: analysisResults.design1.heatGain.south,
            design2: analysisResults.design2.heatGain.south,
        },
        {
            name: 'East',
            design1: analysisResults.design1.heatGain.east,
            design2: analysisResults.design2.heatGain.east,
        },
        {
            name: 'West',
            design1: analysisResults.design1.heatGain.west,
            design2: analysisResults.design2.heatGain.west,
        },
    ] : [];

    const energyData = analysisResults?.design1 && analysisResults?.design2 ? [
        {
            name: 'Cooling Cost',
            design1: analysisResults.design1.coolingCost,
            design2: analysisResults.design2.coolingCost,
        },
        {
            name: 'Energy Consumption',
            design1: analysisResults.design1.energyConsumption,
            design2: analysisResults.design2.energyConsumption,
        },
    ] : [];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Building Comparison</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                        <h3 className="font-medium mb-2">
                            {format(timestamp1, 'PPpp')}
                        </h3>
                        <div className="text-sm text-muted-foreground">
                            {state1.name}
                        </div>
                    </div>
                    <div>
                        <h3 className="font-medium mb-2">
                            {format(timestamp2, 'PPpp')}
                        </h3>
                        <div className="text-sm text-muted-foreground">
                            {state2.name}
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-4">Loading analysis results...</div>
                ) : analysisResults ? (
                    <div className="space-y-6">
                        <div>
                            <h4 className="font-medium mb-4">Heat Gain Comparison</h4>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={heatGainData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="design1" name={state1.name} fill="#8884d8" />
                                        <Bar dataKey="design2" name={state2.name} fill="#82ca9d" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-medium mb-4">Energy Performance</h4>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={energyData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="design1" name={state1.name} fill="#8884d8" />
                                        <Bar dataKey="design2" name={state2.name} fill="#82ca9d" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-medium mb-4">Design Differences</h4>
                            {differences.facades && (
                                <div className="mb-4">
                                    <h5 className="text-sm font-medium mb-2">Facade Changes</h5>
                                    {Object.entries(differences.facades).map(([facade, changes]) => (
                                        <div key={facade} className="mb-4">
                                            <h6 className="text-sm font-medium capitalize mb-1">
                                                {facade} Facade
                                            </h6>
                                            <div className="space-y-1">
                                                {Object.entries(changes).map(([prop, values]) => (
                                                    <div key={prop} className="text-sm">
                                                        <span className="font-medium capitalize">{prop}:</span>{' '}
                                                        <span className="text-red-500">{values.from}</span> →{' '}
                                                        <span className="text-green-500">{values.to}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {differences.skylight && (
                                <div>
                                    <h5 className="text-sm font-medium mb-2">Skylight Changes</h5>
                                    {Object.entries(differences.skylight).map(([prop, values]) => (
                                        <div key={prop} className="text-sm">
                                            <span className="font-medium capitalize">{prop}:</span>{' '}
                                            <span className="text-red-500">{values.from}</span> →{' '}
                                            <span className="text-green-500">{values.to}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-4 text-muted-foreground">
                        No analysis results available
                    </div>
                )}
            </CardContent>
        </Card>
    );
} 