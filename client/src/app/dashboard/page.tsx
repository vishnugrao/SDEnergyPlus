import { BuildingConfigForm } from '@/components/BuildingConfigForm';

export default function DashboardPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Building Configuration</h1>
      <BuildingConfigForm />
    </div>
  );
} 