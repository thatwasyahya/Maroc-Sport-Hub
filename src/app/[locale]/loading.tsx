'use client';

import { Loader2 } from 'lucide-react';

/**
 * Ce composant est automatiquement affiché par Next.js comme une UI de chargement
 * instantanée pendant la navigation entre les routes.
 * Il s'affiche en attendant que le contenu de la nouvelle page soit rendu.
 */
export default function Loading() {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}
