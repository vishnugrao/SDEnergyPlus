import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { Undo2, Redo2, History, Building2, Home, Scale, Trash2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';

interface HistoryControlsProps {
    canUndo: boolean;
    canRedo: boolean;
    onUndo: () => void;
    onRedo: () => void;
    history: Array<{
        state: any;
        timestamp: Date;
    }>;
    onStateSelect: (index: number) => void;
    onCompare: (index1: number, index2: number) => void;
    onRandomFill: (type: 'commercial' | 'residential') => void;
    onClearDatabase: () => void;
}

export function HistoryControls({
    canUndo,
    canRedo,
    onUndo,
    onRedo,
    history,
    onStateSelect,
    onCompare,
    onRandomFill,
    onClearDatabase
}: HistoryControlsProps) {
    const [selectedStates, setSelectedStates] = useState<number[]>([]);

    const handleStateSelection = (index: number) => {
        if (selectedStates.includes(index)) {
            setSelectedStates(selectedStates.filter(i => i !== index));
        } else if (selectedStates.length < 2) {
            setSelectedStates([...selectedStates, index]);
        }
    };

    const handleCompare = () => {
        if (selectedStates.length === 2) {
            onCompare(selectedStates[0], selectedStates[1]);
            setSelectedStates([]);
        }
    };

    // Group history items by building name
    const groupedHistory = history.reduce((acc, item, index) => {
        const buildingName = item.state.name;
        if (!acc[buildingName]) {
            acc[buildingName] = [];
        }
        acc[buildingName].push({ ...item, index });
        return acc;
    }, {} as Record<string, Array<typeof history[0] & { index: number }>>);

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        History
                    </CardTitle>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    onClick={onClearDatabase}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Clear database</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex gap-2 mb-4">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={onUndo}
                        disabled={!canUndo}
                    >
                        <Undo2 className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={onRedo}
                        disabled={!canRedo}
                    >
                        <Redo2 className="h-4 w-4" />
                    </Button>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => onRandomFill('commercial')}
                                >
                                    <Building2 className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Fill with random commercial values</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => onRandomFill('residential')}
                                >
                                    <Home className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Fill with random residential values</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>

                <ScrollArea className="h-[300px]">
                    <div className="space-y-4">
                        {Object.entries(groupedHistory).map(([buildingName, items]) => (
                            <div key={buildingName} className="space-y-2">
                                <div className="text-sm font-semibold text-muted-foreground px-2">
                                    {buildingName}
                                </div>
                                {items.map((item) => (
                                    <div
                                        key={item.index}
                                        className={`p-2 rounded-lg border hover:bg-accent cursor-pointer ${
                                            selectedStates.includes(item.index) ? 'bg-accent' : ''
                                        }`}
                                        onClick={() => handleStateSelection(item.index)}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                checked={selectedStates.includes(item.index)}
                                                onCheckedChange={() => handleStateSelection(item.index)}
                                            />
                                            <div>
                                                <div className="text-sm font-medium">
                                                    {format(item.timestamp, 'PPpp')}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </ScrollArea>

                {selectedStates.length === 2 && (
                    <div className="mt-4">
                        <Button
                            variant="default"
                            className="w-full"
                            onClick={handleCompare}
                        >
                            <Scale className="h-4 w-4 mr-2" />
                            Compare Selected Buildings
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
} 