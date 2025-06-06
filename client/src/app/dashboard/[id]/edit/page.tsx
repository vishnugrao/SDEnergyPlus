'use client';

import { useEffect, useState } from 'react';
import { BuildingConfigForm } from '@/components/BuildingConfigForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { BuildingDesign } from '@/types/building';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export default function EditBuildingPage() {
    const router = useRouter();
    const params = useParams();
    const [building, setBuilding] = useState<BuildingDesign | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!params?.id) return;
        fetchBuilding();
    }, [params?.id]);

    const fetchBuilding = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch(`http://localhost:5050/building-designs/${params.id}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch building design');
            }
            
            const data = await response.json();
            setBuilding(data);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An error occurred while fetching the building';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto py-8 flex items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto py-8">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <Button onClick={() => router.back()}>Go Back</Button>
                </div>
            </div>
        );
    }

    if (!building) {
        return (
            <div className="container mx-auto py-8">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Building Not Found</h2>
                    <Button onClick={() => router.back()}>Go Back</Button>
                </div>
            </div>
        );
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
                <h1 className="text-3xl font-bold">Edit Building Design</h1>
            </div>
            <BuildingConfigForm initialData={building} />
        </div>
    );
} 