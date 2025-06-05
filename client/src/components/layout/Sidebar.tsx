'use client';

import { Building, BarChart2, Settings, GitCompare } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';

export function Sidebar() {
  return (
    <div className="w-64 border-r bg-background">
      <div className="flex h-16 items-center border-b px-4">
        <h2 className="text-lg font-semibold">SDEnergyPlus</h2>
      </div>
      <ScrollArea className="h-[calc(100vh-4rem)]">
        <div className="space-y-4 p-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Navigation</h3>
            <nav className="space-y-1">
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="/dashboard">
                  <Building className="mr-2 h-4 w-4" />
                  Buildings
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="/analysis">
                  <BarChart2 className="mr-2 h-4 w-4" />
                  Analysis
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="/compare">
                  <GitCompare className="mr-2 h-4 w-4" />
                  Compare Buildings
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </Button>
            </nav>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Quick Actions</h3>
            <div className="space-y-1">
              <Button variant="outline" className="w-full justify-start">
                New Building
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Compare Selected
              </Button>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
} 