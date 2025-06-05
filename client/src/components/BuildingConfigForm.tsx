"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { toast } from 'sonner';
import { useMemento } from '../hooks/useMemento';
import { BuildingDesign } from '../types/building';
import { HistoryControls } from './HistoryControls';
import { StateComparison } from './StateComparison';
import { generateRandomCommercialProperty, generateRandomResidentialProperty } from '@/lib/property-utils';

const facadeSchema = z.object({
    height: z.number().min(0),
    width: z.number().min(0),
    wwr: z.number().min(0).max(1),
    shgc: z.number().min(0).max(1),
});

const buildingSchema = z.object({
    name: z.string().min(1),
    facades: z.object({
        north: facadeSchema,
        south: facadeSchema,
        east: facadeSchema,
        west: facadeSchema,
    }),
    skylight: z.object({
        width: z.number().min(0).optional(),
        length: z.number().min(0).optional(),
    }).optional(),
});

type BuildingFormData = z.infer<typeof buildingSchema>;
type FacadeKey = keyof BuildingFormData['facades'];

export function BuildingConfigForm() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showComparison, setShowComparison] = useState(false);
    const [comparisonData, setComparisonData] = useState<{
        state1: BuildingDesign;
        state2: BuildingDesign;
        timestamp1: Date;
        timestamp2: Date;
        differences: any;
    } | null>(null);

    const {
        currentState,
        saveState,
        undo,
        redo,
        canUndo,
        canRedo,
        getStateHistory,
        compareStates
    } = useMemento();

    const { register, handleSubmit, formState: { errors }, reset } = useForm<BuildingFormData>({
        resolver: zodResolver(buildingSchema),
        defaultValues: currentState || undefined
    });

    useEffect(() => {
        if (currentState) {
            reset(currentState);
        }
    }, [currentState, reset]);

    const onSubmit = async (data: BuildingFormData) => {
        try {
            setIsSubmitting(true);
            const response = await fetch('http://localhost:5050/building-designs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error('Failed to save building design');
            }

            const savedDesign = await response.json();
            saveState(savedDesign);
            toast.success('Building design saved successfully');
        } catch (error) {
            toast.error('Failed to save building design');
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStateSelect = (index: number) => {
        const history = getStateHistory();
        const selectedState = history[index].state;
        reset(selectedState);
    };

    const handleCompare = (index1: number, index2: number) => {
        const history = getStateHistory();
        const differences = compareStates(index1, index2);
        setComparisonData({
            state1: history[index1].state,
            state2: history[index2].state,
            timestamp1: history[index1].timestamp,
            timestamp2: history[index2].timestamp,
            differences
        });
        setShowComparison(true);
    };

    const handleRandomFill = (type: 'commercial' | 'residential') => {
        const randomValues = type === 'commercial' 
            ? generateRandomCommercialProperty()
            : generateRandomResidentialProperty();

        // Map the random values to building form structure
        const buildingData: BuildingFormData = {
            name: `${type === 'commercial' ? 'Commercial' : 'Residential'} Building ${new Date().toLocaleTimeString()}`,
            facades: {
                north: {
                    height: Number((randomValues.squareFootage / 100).toFixed(1)),
                    width: Number((randomValues.squareFootage / 100).toFixed(1)),
                    wwr: Number((0.3).toFixed(1)),
                    shgc: Number((0.4).toFixed(1))
                },
                south: {
                    height: Number((randomValues.squareFootage / 100).toFixed(1)),
                    width: Number((randomValues.squareFootage / 100).toFixed(1)),
                    wwr: Number((0.3).toFixed(1)),
                    shgc: Number((0.4).toFixed(1))
                },
                east: {
                    height: Number((randomValues.squareFootage / 100).toFixed(1)),
                    width: Number((randomValues.squareFootage / 100).toFixed(1)),
                    wwr: Number((0.3).toFixed(1)),
                    shgc: Number((0.4).toFixed(1))
                },
                west: {
                    height: Number((randomValues.squareFootage / 100).toFixed(1)),
                    width: Number((randomValues.squareFootage / 100).toFixed(1)),
                    wwr: Number((0.3).toFixed(1)),
                    shgc: Number((0.4).toFixed(1))
                }
            },
            skylight: {
                width: Number((randomValues.squareFootage / 200).toFixed(1)),
                length: Number((randomValues.squareFootage / 200).toFixed(1))
            }
        };

        // Update form with random values
        reset(buildingData);
        toast.success(`Random ${type} values applied`);
    };

    const handleClearDatabase = async () => {
        try {
            const response = await fetch('http://localhost:5050/building-designs', {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to clear database');
            }

            toast.success('Database cleared successfully');
            reset();
        } catch (error) {
            toast.error('Failed to clear database');
            console.error(error);
        }
    };

    const renderFacadeInputs = (facade: FacadeKey) => {
        const facadePath = `facades.${facade}` as const;
        return (
            <div key={facade} className="space-y-4">
                <h3 className="font-medium capitalize">{facade} Facade</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor={`${facadePath}.height`}>Height (m)</Label>
                        <Input
                            id={`${facadePath}.height`}
                            type="number"
                            step="0.1"
                            {...register(`${facadePath}.height`, { valueAsNumber: true })}
                            className={errors.facades?.[facade]?.height ? 'border-red-500' : ''}
                        />
                    </div>
                    <div>
                        <Label htmlFor={`${facadePath}.width`}>Width (m)</Label>
                        <Input
                            id={`${facadePath}.width`}
                            type="number"
                            step="0.1"
                            {...register(`${facadePath}.width`, { valueAsNumber: true })}
                            className={errors.facades?.[facade]?.width ? 'border-red-500' : ''}
                        />
                    </div>
                    <div>
                        <Label htmlFor={`${facadePath}.wwr`}>Window-to-Wall Ratio</Label>
                        <Input
                            id={`${facadePath}.wwr`}
                            type="number"
                            step="0.01"
                            min="0"
                            max="1"
                            {...register(`${facadePath}.wwr`, { valueAsNumber: true })}
                            className={errors.facades?.[facade]?.wwr ? 'border-red-500' : ''}
                        />
                    </div>
                    <div>
                        <Label htmlFor={`${facadePath}.shgc`}>Solar Heat Gain Coefficient</Label>
                        <Input
                            id={`${facadePath}.shgc`}
                            type="number"
                            step="0.01"
                            min="0"
                            max="1"
                            {...register(`${facadePath}.shgc`, { valueAsNumber: true })}
                            className={errors.facades?.[facade]?.shgc ? 'border-red-500' : ''}
                        />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Building Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <Label htmlFor="name">Building Name</Label>
                            <Input
                                id="name"
                                {...register('name')}
                                className={errors.name ? 'border-red-500' : ''}
                            />
                            {errors.name && (
                                <p className="text-sm text-red-500">{errors.name.message}</p>
                            )}
                        </div>

                        {(['north', 'south', 'east', 'west'] as const).map((facade) => (
                            <div key={facade}>
                                {renderFacadeInputs(facade)}
                            </div>
                        ))}

                        <div className="space-y-4">
                            <h3 className="font-medium">Skylight (Optional)</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="skylight.width">Width (m)</Label>
                                    <Input
                                        id="skylight.width"
                                        type="number"
                                        step="0.1"
                                        {...register('skylight.width', { valueAsNumber: true })}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="skylight.length">Length (m)</Label>
                                    <Input
                                        id="skylight.length"
                                        type="number"
                                        step="0.1"
                                        {...register('skylight.length', { valueAsNumber: true })}
                                    />
                                </div>
                            </div>
                        </div>

                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : 'Save Design'}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <HistoryControls
                    canUndo={canUndo()}
                    canRedo={canRedo()}
                    onUndo={undo}
                    onRedo={redo}
                    history={getStateHistory()}
                    onStateSelect={handleStateSelect}
                    onCompare={handleCompare}
                    onRandomFill={handleRandomFill}
                    onClearDatabase={handleClearDatabase}
                />

                {showComparison && comparisonData && (
                    <StateComparison {...comparisonData} />
                )}
            </div>
        </div>
    );
} 