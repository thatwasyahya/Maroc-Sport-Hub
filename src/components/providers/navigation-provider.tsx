'use client';

import { useSearchParams } from 'next/navigation';
import { usePathname } from '@/i18n/routing';
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

interface NavigationContextType {
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Désactive le loader lorsque la navigation est terminée (changement de chemin)
    setIsLoading(false);
  }, [pathname, searchParams]);

  const value = { isLoading, setIsLoading };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}