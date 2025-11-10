"use client";

import L from 'leaflet';
import 'leaflet.markercluster';
import { useEffect, useRef } from 'react';
import type { Facility } from '@/lib/types';
import { sportsIconsMap } from '@/lib/icons';
import { renderToStaticMarkup } from 'react-dom/server';

// Default Leaflet icon setup
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

const MapView = ({ facilities, center, zoom, onMarkerClick }: { facilities: Facility[], center: [number, number], zoom: number, onMarkerClick: (facility: Facility) => void }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markerClusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);

  useEffect(() => {
    if (mapRef.current && !mapInstance.current) {
      mapInstance.current = L.map(mapRef.current, {
        center: center,
        zoom: zoom,
        scrollWheelZoom: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapInstance.current);
    } else if (mapInstance.current) {
      mapInstance.current.setView(center, zoom);
    }
  }, [center, zoom]); 

  useEffect(() => {
    if (mapInstance.current) {
      if (markerClusterGroupRef.current) {
        markerClusterGroupRef.current.clearLayers();
      } else {
        markerClusterGroupRef.current = L.markerClusterGroup();
        mapInstance.current.addLayer(markerClusterGroupRef.current);
      }

      facilities.forEach(facility => {
        const marker = L.marker([facility.location.lat, facility.location.lng]);
        
        const sportIcons = facility.sports.map(sport => {
            const Icon = sportsIconsMap[sport];
            return Icon ? `<div class="tooltip-icon">${renderToStaticMarkup(<Icon className="w-4 h-4" />)}</div>` : '';
        }).join('');
        
        const popupContent = `
          <div class="p-1 font-sans">
            <h3 class="font-bold text-lg mb-1">${facility.name}</h3>
            <p class="text-sm text-gray-500">${facility.city}, ${facility.region}</p>
            <div class="flex gap-1 mt-2">${sportIcons}</div>
          </div>
        `;
        
        marker.bindPopup(popupContent);
        
        marker.on('click', () => {
          onMarkerClick(facility);
        });

        markerClusterGroupRef.current?.addLayer(marker);
      });
      
      mapInstance.current.invalidateSize();
    }
  }, [facilities, onMarkerClick]);

  return <div ref={mapRef} className="h-full w-full z-0" />;
};

export default MapView;
