// This component is intentionally left blank. 
// The map implementation was moved to home-map-container.tsx to resolve a Next.js rendering issue.
// This file can be safely deleted if it is no longer referenced anywhere.
"use client";
import MapView from '@/components/map-container';
import type { Facility } from '@/lib/types';

export default function HomeMap({ facilities }: { facilities: Facility[] }) {
  return <MapView facilities={facilities} />;
}
