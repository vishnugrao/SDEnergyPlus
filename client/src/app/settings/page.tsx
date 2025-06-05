import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="defaultCity">Default City</Label>
              <Input id="defaultCity" placeholder="Enter default city" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultSeason">Default Season</Label>
              <Input id="defaultSeason" placeholder="Enter default season" />
            </div>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Energy Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cop">Coefficient of Performance (COP)</Label>
              <Input id="cop" type="number" placeholder="Enter COP value" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="electricityRate">Default Electricity Rate (₹/kWh)</Label>
              <Input id="electricityRate" type="number" placeholder="Enter electricity rate" />
            </div>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 