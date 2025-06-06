'use client';

import { AnalysisResult } from '@/types/analysis';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatNumber } from '@/utils/formatNumber';

interface BuildingPairwiseComparisonProps {
    buildings: AnalysisResult[];
}

export function BuildingPairwiseComparison({ buildings }: BuildingPairwiseComparisonProps) {
    if (buildings.length < 2) {
        return null;
    }

    const calculateDelta = (value1: number, value2: number) => {
        const delta = value2 - value1;
        const percentage = (delta / value1) * 100;
        return {
            value: delta,
            percentage,
            isPositive: delta > 0,
        };
    };

    const formatDelta = (delta: { value: number; percentage: number; isPositive: boolean }) => {
        const sign = delta.isPositive ? '+' : '';
        return `${sign}${formatNumber(delta.value)} (${sign}${delta.percentage.toFixed(1)}%)`;
    };

    return (
        <Card className="mt-6">
            <CardHeader>
                <CardTitle>Pairwise Building Comparison</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Comparison</TableHead>
                                <TableHead>Total Heat Gain</TableHead>
                                <TableHead>Cooling Cost</TableHead>
                                <TableHead>Energy Consumption</TableHead>
                                <TableHead>North Facade</TableHead>
                                <TableHead>South Facade</TableHead>
                                <TableHead>East Facade</TableHead>
                                <TableHead>West Facade</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {buildings.map((building1, i) => (
                                buildings.slice(i + 1).map((building2) => {
                                    const heatGainDelta = calculateDelta(
                                        building1.heatGain.total,
                                        building2.heatGain.total
                                    );
                                    const coolingCostDelta = calculateDelta(
                                        building1.coolingCost,
                                        building2.coolingCost
                                    );
                                    const energyConsumptionDelta = calculateDelta(
                                        building1.energyConsumption,
                                        building2.energyConsumption
                                    );
                                    const northDelta = calculateDelta(
                                        building1.heatGain.north,
                                        building2.heatGain.north
                                    );
                                    const southDelta = calculateDelta(
                                        building1.heatGain.south,
                                        building2.heatGain.south
                                    );
                                    const eastDelta = calculateDelta(
                                        building1.heatGain.east,
                                        building2.heatGain.east
                                    );
                                    const westDelta = calculateDelta(
                                        building1.heatGain.west,
                                        building2.heatGain.west
                                    );

                                    return (
                                        <TableRow key={`${building1.buildingDesignId}-${building2.buildingDesignId}`}>
                                            <TableCell className="font-medium">
                                                {building1.name} vs {building2.name}
                                            </TableCell>
                                            <TableCell className={heatGainDelta.isPositive ? 'text-red-500' : 'text-green-500'}>
                                                {formatDelta(heatGainDelta)}
                                            </TableCell>
                                            <TableCell className={coolingCostDelta.isPositive ? 'text-red-500' : 'text-green-500'}>
                                                {formatDelta(coolingCostDelta)}
                                            </TableCell>
                                            <TableCell className={energyConsumptionDelta.isPositive ? 'text-red-500' : 'text-green-500'}>
                                                {formatDelta(energyConsumptionDelta)}
                                            </TableCell>
                                            <TableCell className={northDelta.isPositive ? 'text-red-500' : 'text-green-500'}>
                                                {formatDelta(northDelta)}
                                            </TableCell>
                                            <TableCell className={southDelta.isPositive ? 'text-red-500' : 'text-green-500'}>
                                                {formatDelta(southDelta)}
                                            </TableCell>
                                            <TableCell className={eastDelta.isPositive ? 'text-red-500' : 'text-green-500'}>
                                                {formatDelta(eastDelta)}
                                            </TableCell>
                                            <TableCell className={westDelta.isPositive ? 'text-red-500' : 'text-green-500'}>
                                                {formatDelta(westDelta)}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
} 