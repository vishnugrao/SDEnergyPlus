import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Plus, Building2, Home } from 'lucide-react';
import { BuildingDesign } from '@/types/building';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

interface BuildingGroup {
    buildingId: string;
    name: string;
    designs: BuildingDesign[];
    createdAt: Date;
}

export function BuildingDashboard() {
    const [buildingGroups, setBuildingGroups] = useState<BuildingGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchBuildings();
    }, []);

    const fetchBuildings = async () => {
        try {
            const response = await fetch('http://localhost:5050/building-designs');
            if (!response.ok) {
                throw new Error('Failed to fetch buildings');
            }
            const designs: BuildingDesign[] = await response.json();
            
            // Group designs by building
            const groups = designs.reduce((acc: BuildingGroup[], design) => {
                const groupId = design.buildingId || design._id || `temp-${Date.now()}`;
                const existingGroup = acc.find(group => group.buildingId === groupId);
                if (existingGroup) {
                    existingGroup.designs.push(design);
                } else {
                    acc.push({
                        buildingId: groupId,
                        name: design.name,
                        designs: [design],
                        createdAt: new Date(design.createdAt || new Date())
                    });
                }
                return acc;
            }, []);

            // Sort groups by creation date
            groups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            setBuildingGroups(groups);
        } catch (error) {
            toast.error('Failed to fetch buildings');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBuilding = () => {
        router.push('/building/new');
    };

    const handleCompareDesigns = (buildingId: string) => {
        router.push(`/building/${buildingId}/compare`);
    };

    if (loading) {
        return <div className="text-center py-8">Loading buildings...</div>;
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Building Designs</h1>
                <Button onClick={handleCreateBuilding}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Building
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {buildingGroups.map((group) => (
                    <Card key={group.buildingId}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                {group.name.includes('Commercial') ? (
                                    <Building2 className="h-5 w-5" />
                                ) : (
                                    <Home className="h-5 w-5" />
                                )}
                                {group.name}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="text-sm text-muted-foreground">
                                    Created: {format(group.createdAt, 'PPp')}
                                </div>
                                <div className="text-sm">
                                    {group.designs.length} design{group.designs.length !== 1 ? 's' : ''}
                                </div>
                                {group.designs.length > 1 && (
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => handleCompareDesigns(group.buildingId)}
                                    >
                                        Compare Designs
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
} 