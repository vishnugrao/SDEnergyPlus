'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { StateComparison } from '@/components/StateComparison';
import { BuildingDesign } from '@/types/building';
import { toast } from 'sonner';

export default function CompareBuildingPage() {
    const params = useParams();
    const router = useRouter();
    const [designs, setDesigns] = useState<BuildingDesign[]>([]);
    const [selectedDesigns, setSelectedDesigns] = useState<BuildingDesign[]>([]);
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

    const handleDesignSelection = (design: BuildingDesign) => {
        if (selectedDesigns.includes(design)) {
            setSelectedDesigns(selectedDesigns.filter(d => d._id !== design._id));
        } else if (selectedDesigns.length < 2) {
            setSelectedDesigns([...selectedDesigns, design]);
        }
    };

    if (loading) {
        return <div className="text-center py-8">Loading designs...</div>;
    }

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
                <h1 className="text-3xl font-bold">Compare Building Designs</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Select Designs to Compare</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {designs.map((design) => (
                                <div
                                    key={design._id}
                                    className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent cursor-pointer"
                                    onClick={() => handleDesignSelection(design)}
                                >
                                    <Checkbox
                                        checked={selectedDesigns.includes(design)}
                                        onCheckedChange={() => handleDesignSelection(design)}
                                    />
                                    <div>
                                        <div className="font-medium">{design.name}</div>
                                        <div className="text-sm text-muted-foreground">
                                            Created: {new Date(design.createdAt || '').toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {selectedDesigns.length === 2 && (
                    <StateComparison
                        state1={selectedDesigns[0]}
                        state2={selectedDesigns[1]}
                        timestamp1={new Date(selectedDesigns[0].createdAt || '')}
                        timestamp2={new Date(selectedDesigns[1].createdAt || '')}
                        differences={{}}
                    />
                )}
            </div>
        </div>
    );
} 