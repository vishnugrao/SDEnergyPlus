import { BuildingComparison } from '@/components/BuildingComparison';

export default function AnalysisPage() {
  // This would typically come from your data store or API
  const mockBuildings = [
    {
      name: 'Building 1',
      facades: {
        north: { height: 10, width: 20, wwr: 0.3, shgc: 0.4 },
        south: { height: 10, width: 20, wwr: 0.3, shgc: 0.4 },
        east: { height: 10, width: 20, wwr: 0.3, shgc: 0.4 },
        west: { height: 10, width: 20, wwr: 0.3, shgc: 0.4 },
      },
    },
    {
      name: 'Building 2',
      facades: {
        north: { height: 12, width: 25, wwr: 0.4, shgc: 0.5 },
        south: { height: 12, width: 25, wwr: 0.4, shgc: 0.5 },
        east: { height: 12, width: 25, wwr: 0.4, shgc: 0.5 },
        west: { height: 12, width: 25, wwr: 0.4, shgc: 0.5 },
      },
    },
  ];

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Building Analysis</h1>
      <BuildingComparison buildings={mockBuildings} />
    </div>
  );
} 