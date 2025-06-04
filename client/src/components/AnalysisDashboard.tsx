import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { toast } from 'sonner';
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

interface AnalysisResult {
    _id: string;
    buildingDesignId: string;
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

export function AnalysisDashboard() {
    const [results, setResults] = useState<AnalysisResult[]>([]);
    const [selectedDesign] = useState<string | null>(null);

    useEffect(() => {
        if (selectedDesign) {
            fetchAnalysisResults(selectedDesign);
        }
    }, [selectedDesign]);

    const fetchAnalysisResults = async (buildingDesignId: string) => {
        try {
            const response = await fetch(`http://localhost:5050/analysis/building/${buildingDesignId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch analysis results');
            }
            const data = await response.json();
            setResults(data);
        } catch (error) {
            toast.error('Failed to fetch analysis results');
            console.error(error);
        }
    };

    const heatGainData = results.length > 0 ? [
        { name: 'North', value: results[0].heatGain.north },
        { name: 'South', value: results[0].heatGain.south },
        { name: 'East', value: results[0].heatGain.east },
        { name: 'West', value: results[0].heatGain.west },
    ] : [];

    const cityComparisonData = results.map(result => ({
        name: result.city,
        coolingCost: result.coolingCost,
        energyConsumption: result.energyConsumption,
    }));

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Energy Analysis Dashboard</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Heat Gain Distribution</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={heatGainData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {heatGainData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>City-wise Performance</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={cityComparisonData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="coolingCost" name="Cooling Cost (Rs)" fill="#8884d8" />
                                            <Bar dataKey="energyConsumption" name="Energy Consumption (kWh)" fill="#82ca9d" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Summary</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {results.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <h4 className="text-sm font-medium text-muted-foreground">Total Heat Gain</h4>
                                            <p className="text-2xl font-bold">{results[0].heatGain.total.toFixed(2)} BTU</p>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-muted-foreground">Average Cooling Cost</h4>
                                            <p className="text-2xl font-bold">Rs {results[0].coolingCost.toFixed(2)}</p>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-muted-foreground">Energy Consumption</h4>
                                            <p className="text-2xl font-bold">{results[0].energyConsumption.toFixed(2)} kWh</p>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-center text-muted-foreground">No analysis results available</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 