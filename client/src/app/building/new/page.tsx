'use client';

import { BuildingConfigForm } from '@/components/BuildingConfigForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NewBuildingPage() {
    const router = useRouter();

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
                <h1 className="text-3xl font-bold">Create New Building Design</h1>
            </div>
            <BuildingConfigForm />
        </div>
    );
} 