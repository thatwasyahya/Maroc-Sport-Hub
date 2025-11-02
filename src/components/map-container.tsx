"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import { useEffect, useRef } from 'react';
import type { Facility } from '@/lib/types';
import { Button } from './ui/button';
import Link from 'next/link';

// Fix for default icon path issues with webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});


const MarkerClusterGroup = ({ facilities }: { facilities: Facility[] }) => {
    const map = useMap();
    const markerClusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  
    useEffect(() => {
      if (map) {
        markerClusterGroupRef.current = L.markerClusterGroup();
        markerClusterGroupRef.current.addTo(map);
      }
  
      return () => {
        if (markerClusterGroupRef.current) {
          map.removeLayer(markerClusterGroupRef.current);
        }
      };
    }, [map]);
  
    useEffect(() => {
      if (markerClusterGroupRef.current) {
        markerClusterGroupRef.current.clearLayers();
        facilities.forEach(facility => {
          const marker = L.marker([facility.location.lat, facility.location.lng]);
          marker.bindPopup(`
            <div class="p-1">
              <h3 class="font-bold text-lg">${facility.name}</h3>
              <p class="text-sm text-muted-foreground">${facility.city}, ${facility.region}</p>
              <p class="text-sm mt-1">${facility.sports.join(', ')}</p>
            </div>
          `);
          markerClusterGroupRef.current?.addLayer(marker);
        });
      }
    }, [facilities, map]);
  
    return null;
};

interface MapViewProps {
  facilities: Facility[];
}

const MapView = ({ facilities }: MapViewProps) => {
  const position: L.LatLngExpression = [33.5731, -7.5898]; // Default to Casablanca

  return (
    <MapContainer center={position} zoom={7} scrollWheelZoom={true} className="h-full w-full z-0">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MarkerClusterGroup facilities={facilities} />
    </MapContainer>
  );
};

export default MapView;
