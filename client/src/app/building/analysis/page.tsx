'use client';

import { useSearchParams } from 'next/navigation';
import { BuildingAnalysis } from '@/components/BuildingAnalysis';

export default function BuildingAnalysisPage() {
    const searchParams = useSearchParams();
    const buildingIds = searchParams.get('ids')?.split(',') || [];

    return <BuildingAnalysis buildingIds={buildingIds} />;
} 