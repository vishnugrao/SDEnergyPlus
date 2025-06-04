import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { toast } from 'sonner';

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

export function BuildingConfigForm() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { register, handleSubmit, formState: { errors } } = useForm<BuildingFormData>({
        resolver: zodResolver(buildingSchema),
    });

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

            toast.success('Building design saved successfully');
        } catch (error) {
            toast.error('Failed to save building design');
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Building Configuration</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="name">Building Name</Label>
                        <Input
                            id="name"
                            {...register('name')}
                            placeholder="Enter building name"
                        />
                        {errors.name && (
                            <p className="text-sm text-red-500">{errors.name.message}</p>
                        )}
                    </div>

                    {(['north', 'south', 'east', 'west'] as const).map((direction) => (
                        <Card key={direction} className="p-4">
                            <h3 className="text-lg font-semibold mb-4 capitalize">{direction} Facade</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor={`${direction}-height`}>Height (m)</Label>
                                    <Input
                                        id={`${direction}-height`}
                                        type="number"
                                        step="0.1"
                                        {...register(`facades.${direction}.height`, { valueAsNumber: true })}
                                    />
                                    {errors.facades?.[direction]?.height && (
                                        <p className="text-sm text-red-500">{errors.facades[direction]?.height?.message}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={`${direction}-width`}>Width (m)</Label>
                                    <Input
                                        id={`${direction}-width`}
                                        type="number"
                                        step="0.1"
                                        {...register(`facades.${direction}.width`, { valueAsNumber: true })}
                                    />
                                    {errors.facades?.[direction]?.width && (
                                        <p className="text-sm text-red-500">{errors.facades[direction]?.width?.message}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={`${direction}-wwr`}>Window-to-Wall Ratio (0-1)</Label>
                                    <Input
                                        id={`${direction}-wwr`}
                                        type="number"
                                        step="0.01"
                                        {...register(`facades.${direction}.wwr`, { valueAsNumber: true })}
                                    />
                                    {errors.facades?.[direction]?.wwr && (
                                        <p className="text-sm text-red-500">{errors.facades[direction]?.wwr?.message}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={`${direction}-shgc`}>SHGC (0-1)</Label>
                                    <Input
                                        id={`${direction}-shgc`}
                                        type="number"
                                        step="0.01"
                                        {...register(`facades.${direction}.shgc`, { valueAsNumber: true })}
                                    />
                                    {errors.facades?.[direction]?.shgc && (
                                        <p className="text-sm text-red-500">{errors.facades[direction]?.shgc?.message}</p>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}

                    <Card className="p-4">
                        <h3 className="text-lg font-semibold mb-4">Skylight (Optional)</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="skylight-width">Width (m)</Label>
                                <Input
                                    id="skylight-width"
                                    type="number"
                                    step="0.1"
                                    {...register('skylight.width', { valueAsNumber: true })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="skylight-length">Length (m)</Label>
                                <Input
                                    id="skylight-length"
                                    type="number"
                                    step="0.1"
                                    {...register('skylight.length', { valueAsNumber: true })}
                                />
                            </div>
                        </div>
                    </Card>

                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Save Building Design'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
} 