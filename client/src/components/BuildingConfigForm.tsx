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
import { BuildingDesign, BuildingFormData } from '../types/building';
import { HistoryControls } from './HistoryControls';
import { StateComparison } from './StateComparison';
import { generateRandomCommercialProperty, generateRandomResidentialProperty, getRandomDecimal } from '@/lib/property-utils';
import { BuildingComparison } from './BuildingComparison';
import { Compass } from './Compass';
import { FacadeInput } from './FacadeInput';
import { LoadingSpinner } from './LoadingSpinner';

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

type FacadeKey = keyof BuildingFormData['facades'];

export function BuildingConfigForm({ initialData }: { initialData?: BuildingDesign }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showComparison, setShowComparison] = useState(false);
    const [selectedFacade, setSelectedFacade] = useState<'north' | 'south' | 'east' | 'west'>('north');
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

    const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<BuildingFormData>({
        resolver: zodResolver(buildingSchema),
        defaultValues: initialData || {
            name: '',
            facades: {
                north: { height: 0, width: 0, wwr: 0.25, shgc: 0.5 },
                south: { height: 0, width: 0, wwr: 0.4, shgc: 0.3 },
                east: { height: 0, width: 0, wwr: 0.3, shgc: 0.4 },
                west: { height: 0, width: 0, wwr: 0.3, shgc: 0.4 }
            },
            skylight: { width: 0, length: 0 }
        }
    });

    // Watch all facade values
    const facadeValues = watch('facades');

    // Update form values when switching facades
    const handleFacadeChange = (facade: 'north' | 'south' | 'east' | 'west') => {
        setSelectedFacade(facade);
    };

    // Effect to update form values when facade changes
    useEffect(() => {
        const currentValues = facadeValues[selectedFacade];
        if (currentValues) {
            setValue(`facades.${selectedFacade}`, currentValues, { shouldDirty: false });
        }
    }, [selectedFacade, facadeValues, setValue]);

    const handleUndo = () => {
        undo();
        setShowComparison(false);
    };

    const handleRedo = () => {
        redo();
        setShowComparison(false);
    };

    const onSubmit = async (data: BuildingFormData) => {
        try {
            setIsSubmitting(true);
            const url = initialData?._id 
                ? `http://localhost:5050/building-designs/${initialData._id}`
                : 'http://localhost:5050/building-designs';
            
            const response = await fetch(url, {
                method: initialData?._id ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error(`Failed to ${initialData?._id ? 'update' : 'save'} building design`);
            }

            const savedDesign = await response.json();
            saveState(savedDesign);
            toast.success(`Building design ${initialData?._id ? 'updated' : 'saved'} successfully`);
        } catch (error) {
            toast.error(`Failed to ${initialData?._id ? 'update' : 'save'} building design`);
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

        // Base dimensions for the building
        const baseHeight = Number((randomValues.squareFootage / 100).toFixed(1));
        const baseWidth = Number((randomValues.squareFootage / 100).toFixed(1));

        // Generate unique WWR and SHGC values for each facade
        const generateFacadeValues = (orientation: 'north' | 'south' | 'east' | 'west') => {
            // Adjust dimensions based on orientation
            const heightVariation = getRandomDecimal(-0.1, 0.1, 2);
            const widthVariation = getRandomDecimal(-0.1, 0.1, 2);
            const height = Number((baseHeight * (1 + heightVariation)).toFixed(1));
            const width = Number((baseWidth * (1 + widthVariation)).toFixed(1));

            // Adjust WWR based on orientation
            let wwrBase;
            switch (orientation) {
                case 'south':
                    wwrBase = 0.4; // South typically has larger windows
                    break;
                case 'north':
                    wwrBase = 0.25; // North typically has smaller windows
                    break;
                case 'east':
                case 'west':
                    wwrBase = 0.3; // East and west have medium-sized windows
                    break;
            }
            const wwrVariation = getRandomDecimal(-0.05, 0.05, 2);
            const wwr = Math.min(Math.max(wwrBase + wwrVariation, 0.2), 0.6);

            // Adjust SHGC based on orientation
            let shgcBase;
            switch (orientation) {
                case 'south':
                    shgcBase = 0.3; // South typically has lower SHGC
                    break;
                case 'north':
                    shgcBase = 0.5; // North typically has higher SHGC
                    break;
                case 'east':
                case 'west':
                    shgcBase = 0.4; // East and west have medium SHGC
                    break;
            }
            const shgcVariation = getRandomDecimal(-0.05, 0.05, 2);
            const shgc = Math.min(Math.max(shgcBase + shgcVariation, 0.2), 0.6);

            return {
                height,
                width,
                wwr: Number(wwr.toFixed(2)),
                shgc: Number(shgc.toFixed(2))
            };
        };

        const buildingData: BuildingFormData = {
            name: `${type === 'commercial' ? 'Commercial' : 'Residential'} Building ${new Date().toLocaleTimeString()}`,
            facades: {
                north: generateFacadeValues('north'),
                south: generateFacadeValues('south'),
                east: generateFacadeValues('east'),
                west: generateFacadeValues('west')
            },
            skylight: {
                width: Number((randomValues.squareFootage / 200).toFixed(1)),
                length: Number((randomValues.squareFootage / 200).toFixed(1))
            }
        };

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

    const facadeOrder: Array<'north' | 'east' | 'south' | 'west'> = ['north', 'east', 'south', 'west'];
    const getNextFacade = (current: typeof facadeOrder[number]) => facadeOrder[(facadeOrder.indexOf(current) + 1) % 4];
    const getPrevFacade = (current: typeof facadeOrder[number]) => facadeOrder[(facadeOrder.indexOf(current) + 3) % 4];

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>{initialData?._id ? 'Edit Building Design' : 'Building Configuration'}</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
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

                        <div className="flex flex-col items-center gap-8 my-8">
                            <Compass
                                size={600}
                                selectedDirection={selectedFacade}
                                onDirectionClick={handleFacadeChange}
                            />
                            <div className="flex items-center gap-8 w-full max-w-2xl">
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => handleFacadeChange(getPrevFacade(selectedFacade))}
                                    className="px-4 py-2"
                                >
                                    ◀ Prev
                                </Button>
                                <div className="flex-1">
                                    <FacadeInput
                                        facade={selectedFacade}
                                        register={register}
                                        errors={errors}
                                        isSelected={true}
                                        values={facadeValues[selectedFacade]}
                                    />
                                </div>
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => handleFacadeChange(getNextFacade(selectedFacade))}
                                    className="px-4 py-2"
                                >
                                    Next ▶
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-medium">Skylight (Optional)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                        <Button type="submit" disabled={isSubmitting} className="w-full">
                            {isSubmitting ? (
                                <div className="flex items-center gap-2">
                                    <LoadingSpinner size="sm" />
                                    <span>{initialData?._id ? 'Updating...' : 'Saving...'}</span>
                                </div>
                            ) : (
                                initialData?._id ? 'Update Design' : 'Save Design'
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <HistoryControls
                    canUndo={canUndo()}
                    canRedo={canRedo()}
                    onUndo={handleUndo}
                    onRedo={handleRedo}
                    history={getStateHistory()}
                    onStateSelect={handleStateSelect}
                    onCompare={handleCompare}
                    onRandomFill={handleRandomFill}
                    onClearDatabase={handleClearDatabase}
                />

                {showComparison && comparisonData && (
                    <StateComparison {...comparisonData} />
                )}

                {currentState && (
                    <BuildingComparison buildings={[currentState]} />
                )}
            </div>
        </div>
    );
} 