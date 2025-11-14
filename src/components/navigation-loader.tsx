'use client';

import { useNavigation } from '@/components/providers/navigation-provider';
import { Loader2 } from 'lucide-react';

export function NavigationLoader() {
  const { isLoading } = useNavigation();

  if (!isLoading) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}