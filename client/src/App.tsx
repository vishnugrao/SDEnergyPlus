import { useState, useEffect } from 'react';
import { BuildingConfigForm } from './components/BuildingConfigForm';
import { AnalysisDashboard } from './components/AnalysisDashboard';
import { Toaster } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { toast } from 'sonner';

interface BuildingDesign {
    _id: string;
    name: string;
    facades: {
        north: { height: number; width: number; wwr: number; shgc: number };
        south: { height: number; width: number; wwr: number; shgc: number };
        east: { height: number; width: number; wwr: number; shgc: number };
        west: { height: number; width: number; wwr: number; shgc: number };
    };
    skylight?: {
        width: number;
        length: number;
    };
}

function App() {
    const [buildingDesigns, setBuildingDesigns] = useState<BuildingDesign[]>([]);
    const [selectedDesign, setSelectedDesign] = useState<string | null>(null);

    useEffect(() => {
        fetchBuildingDesigns();
    }, []);

    const fetchBuildingDesigns = async () => {
        try {
            const response = await fetch('http://localhost:5050/building-designs');
            if (!response.ok) {
                throw new Error('Failed to fetch building designs');
            }
            const data = await response.json();
            setBuildingDesigns(data);
        } catch (error) {
            toast.error('Failed to fetch building designs');
            console.error(error);
        }
    };

    return (
        <div className="min-h-screen bg-background p-6">
            <Toaster />
            <div className="max-w-7xl mx-auto space-y-8">
                <h1 className="text-3xl font-bold">Building Energy Analysis</h1>
                
                <Card>
                    <CardHeader>
                        <CardTitle>Select Building Design</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {buildingDesigns.map((design) => (
                                <Button
                                    key={design._id}
                                    variant={selectedDesign === design._id ? 'default' : 'outline'}
                                    onClick={() => setSelectedDesign(design._id)}
                                    className="w-full"
                                >
                                    {design.name}
                                </Button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <BuildingConfigForm />
                {selectedDesign && <AnalysisDashboard />}
            </div>
        </div>
    );
}

export default App;