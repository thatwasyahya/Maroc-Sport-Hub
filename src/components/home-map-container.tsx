"use client";

import { Facility } from "@/lib/types";
import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('@/components/map-container'), {
  ssr: false,
  loading: () => <div className="bg-muted w-full h-full flex items-center justify-center"><p>Chargement de la carte...</p></div>,
});

export default function HomeMapContainer({ facilities, center, zoom, onMarkerClick }: { facilities: Facility[], center: [number, number], zoom: number, onMarkerClick: (facility: Facility) => void }) {
  return <MapView facilities={facilities} center={center} zoom={zoom} onMarkerClick={onMarkerClick} />;
}
