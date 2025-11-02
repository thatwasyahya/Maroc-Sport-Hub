"use client";

import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import { useEffect, useRef } from 'react';
import type { Facility } from '@/lib/types';
import Link from 'next/link';

// Fix for default icon path issues with webpack
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const MarkerClusterGroup = ({ facilities }: { facilities: Facility[] }) => {
  const map = useMap();

  useEffect(() => {
    const markerClusterGroup = L.markerClusterGroup();

    facilities.forEach(facility => {
      const marker = L.marker([facility.location.lat, facility.location.lng]);
      // The popup content is now a simple div. We will use React to render into it.
      marker.bindPopup(`
        <div class="p-1">
          <h3 class="font-bold text-lg"><a href="/facilities/${facility.id}" class="hover:underline">${facility.name}</a></h3>
          <p class="text-sm text-muted-foreground">${facility.city}, ${facility.region}</p>
          <p class="text-sm mt-1">${facility.sports.join(', ')}</p>
        </div>
      `);
      markerClusterGroup.addLayer(marker);
    });

    map.addLayer(markerClusterGroup);

    return () => {
      map.removeLayer(markerClusterGroup);
    };
  }, [facilities, map]);

  return null;
};

const MapView = ({ facilities }: { facilities: Facility[] }) => {
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
