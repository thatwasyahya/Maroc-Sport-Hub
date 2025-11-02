"use client";

import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import L from 'leaflet';
import 'leaflet.markercluster';
import { useEffect, useRef } from 'react';
import type { Facility } from '@/lib/types';
import Link from 'next/link';

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

const MapView = ({ facilities }: { facilities: Facility[] }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markerClusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);

  useEffect(() => {
    if (mapRef.current && !mapInstance.current) {
      // Create map instance only once
      mapInstance.current = L.map(mapRef.current, {
        center: [33.5731, -7.5898], // Casablanca
        zoom: 7,
        scrollWheelZoom: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapInstance.current);
    }
  }, []); 

  useEffect(() => {
    if (mapInstance.current) {
      // Clear previous markers
      if (markerClusterGroupRef.current) {
        markerClusterGroupRef.current.clearLayers();
      } else {
        markerClusterGroupRef.current = L.markerClusterGroup();
        mapInstance.current.addLayer(markerClusterGroupRef.current);
      }

      // Add new markers
      facilities.forEach(facility => {
        const marker = L.marker([facility.location.lat, facility.location.lng]);
        marker.bindPopup(`
          <div class="p-1">
            <h3 class="font-bold text-lg"><a href="/facilities/${facility.id}" class="hover:underline">${facility.name}</a></h3>
            <p class="text-sm text-muted-foreground">${facility.city}, ${facility.region}</p>
            <p class="text-sm mt-1">${facility.sports.join(', ')}</p>
          </div>
        `);
        markerClusterGroupRef.current?.addLayer(marker);
      });
    }
  }, [facilities]);

  return <div ref={mapRef} className="h-full w-full z-0" />;
};

export default MapView;