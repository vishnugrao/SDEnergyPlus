import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Plus, Building2, Home, BarChart2 } from 'lucide-react';
import { BuildingDesign } from '@/types/building';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Checkbox } from './ui/checkbox';

interface BuildingGroup {
    _id: string;
    name: string;
    designs: BuildingDesign[];
    createdAt: Date;
}

export function BuildingDashboard() {
    const [buildingGroups, setBuildingGroups] = useState<BuildingGroup[]>([]);
    const [selectedBuildings, setSelectedBuildings] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchBuildings();
    }, []);

    const fetchBuildings = async () => {
        try {
            // Check if server is accessible
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const serverCheck = await fetch('http://localhost:5050/health', {
                method: 'HEAD',
                signal: controller.signal
            }).catch(() => null);

            clearTimeout(timeoutId);

            if (!serverCheck) {
                throw new Error('Server is not accessible. Please ensure the server is running.');
            }

            const response = await fetch('http://localhost:5050/building-designs', {
                headers: {
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(
                    `Failed to fetch buildings: ${response.status} ${response.statusText}${
                        errorData ? ` - ${JSON.stringify(errorData)}` : ''
                    }`
                );
            }

            const designs: BuildingDesign[] = await response.json();
            
            // Group designs by building
            const groups = designs.reduce((acc: BuildingGroup[], design) => {
                const groupId = design._id || `temp-${Date.now()}`;
                const existingGroup = acc.find(group => group._id === groupId);
                if (existingGroup) {
                    existingGroup.designs.push(design);
                } else {
                    acc.push({
                        _id: groupId,
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
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            toast.error(errorMessage);
            console.error('Building fetch error:', {
                error,
                timestamp: new Date().toISOString(),
                url: 'http://localhost:5050/building-designs'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBuilding = () => {
        router.push('/building/new');
    };

    const handleCompareDesigns = (_id: string) => {
        router.push(`/building/${_id}/compare`);
    };

    const handleViewAnalysis = () => {
        if (selectedBuildings.length === 0) {
            toast.error('Please select at least one building to view analytics');
            return;
        }
        router.push(`/building/analysis?ids=${selectedBuildings.join(',')}`);
    };

    const toggleBuildingSelection = (_id: string) => {
        setSelectedBuildings(prev =>
            prev.includes(_id)
                ? prev.filter(id => id !== _id)
                : [...prev, _id]
        );
    };

    if (loading) {
        return <div className="text-center py-8">Loading buildings...</div>;
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Building Designs</h1>
                <div className="flex gap-4">
                    <Button 
                        onClick={handleViewAnalysis}
                        disabled={selectedBuildings.length === 0}
                    >
                        <BarChart2 className="h-4 w-4 mr-2" />
                        View Analytics
                    </Button>
                    <Button onClick={handleCreateBuilding}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create New Building
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {buildingGroups.map((group) => (
                    <Card 
                        key={group._id}
                        className={`transition-colors hover:bg-accent cursor-pointer ${
                            selectedBuildings.includes(group._id) ? 'bg-accent' : ''
                        }`}
                        onClick={() => toggleBuildingSelection(group._id)}
                    >
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    {group.name.includes('Commercial') ? (
                                        <Building2 className="h-5 w-5" />
                                    ) : (
                                        <Home className="h-5 w-5" />
                                    )}
                                    <span
                                        className="cursor-pointer hover:text-primary"
                                        onClick={(e) => { e.stopPropagation(); toggleBuildingSelection(group._id); }}
                                    >
                                        {group.name}
                                    </span>
                                </CardTitle>
                                <Checkbox
                                    checked={selectedBuildings.includes(group._id)}
                                    onCheckedChange={() => toggleBuildingSelection(group._id)}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="text-sm text-muted-foreground">
                                    Created: {format(group.createdAt, 'PPp')}
                                </div>
                                <div className="text-sm">
                                    {group.designs.length} design{group.designs.length !== 1 ? 's' : ''}
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="default"
                                        className="w-full"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            router.push(`/dashboard/${group._id}/edit`);
                                        }}
                                    >
                                        Edit Building
                                    </Button>
                                    {group.designs.length > 1 && (
                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleCompareDesigns(group._id);
                                            }}
                                        >
                                            Compare Designs
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
} 