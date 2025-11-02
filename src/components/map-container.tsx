"use client";

import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import L from 'leaflet';
import 'leaflet.markercluster';
import { useEffect, useRef } from 'react';
import type { Facility } from '@/lib/types';
import { Button } from './ui/button';
import { renderToStaticMarkup } from 'react-dom/server';
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

const MapView = ({ facilities, center, zoom }: { facilities: Facility[], center: [number, number], zoom: number }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markerClusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);

  useEffect(() => {
    if (mapRef.current && !mapInstance.current) {
      // Create map instance only once
      mapInstance.current = L.map(mapRef.current, {
        center: center,
        zoom: zoom,
        scrollWheelZoom: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapInstance.current);
    } else if (mapInstance.current) {
      // If map already exists, just update its view
      mapInstance.current.setView(center, zoom);
    }
  }, [center, zoom]); 

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
        
        const popupContent = `
          <div class="p-1 font-sans">
            <h3 class="font-bold text-lg mb-1">${facility.name}</h3>
            <p class="text-sm text-gray-500">${facility.city}, ${facility.region}</p>
            <p class="text-sm mt-2 font-semibold">${facility.sports.join(', ')}</p>
            <a href="/facilities/${facility.id}" class="block w-full text-center mt-3 bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 rounded-md text-sm font-medium">
              View Details
            </a>
          </div>
        `;
        
        marker.bindPopup(popupContent);
        markerClusterGroupRef.current?.addLayer(marker);
      });
    }
  }, [facilities]);

  return <div ref={mapRef} className="h-full w-full z-0" />;
};

export default MapView;
