"use client";

import dynamic from 'next/dynamic';
import type { Facility } from '@/lib/types';

const MapView = dynamic(() => import('@/components/map-container'), {
  ssr: false,
  loading: () => <div className="bg-muted w-full h-full flex items-center justify-center"><p>Loading Map...</p></div>,
});

export default function HomeMapContainer({ facilities }: { facilities: Facility[] }) {
    return <MapView facilities={facilities} />;
}
