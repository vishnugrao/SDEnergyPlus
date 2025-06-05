"use client";

import { ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function Breadcrumb() {
  const pathname = usePathname();
  const pathnames = pathname.split('/').filter((x: string) => x);

  return (
    <nav className="flex items-center space-x-1 px-4 py-2 border-b">
      <Link
        href="/"
        className="text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <Home className="h-4 w-4" />
      </Link>
      {pathnames.map((value: string, index: number) => {
        const last = index === pathnames.length - 1;
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;

        return (
          <div key={to} className="flex items-center">
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <Link
              href={to}
              className={cn(
                'ml-1 text-sm font-medium',
                last
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {value.charAt(0).toUpperCase() + value.slice(1)}
            </Link>
          </div>
        );
      })}
    </nav>
  );
} 