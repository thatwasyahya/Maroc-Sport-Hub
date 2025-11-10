'use client';

import type { Facility } from '@/lib/types';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { MapPin, Accessibility, Sun, Moon, Sprout } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { sportsIconsMap, equipmentIconsMap } from '@/lib/icons';

export default function FacilityDetails({ facility }: { facility: Facility }) {
  const facilityEquipments = facility.equipments || [];

  return (
    <div className="space-y-6 pb-6">
      <div className="relative w-full h-64">
        <Image
          src={facility.photos?.[0] || 'https://picsum.photos/seed/facility/800/600'}
          alt={facility.name}
          fill
          className="object-cover"
          data-ai-hint="sports facility"
        />
      </div>
      
      <div className="px-6">
        <div className="flex items-center text-muted-foreground text-sm mb-4">
          <MapPin className="w-4 h-4 mr-2" />
          <span>{facility.address}</span>
        </div>
        <div className="flex flex-wrap gap-2 mb-6">
          {facility.sports.map(sport => {
            const Icon = sportsIconsMap[sport] || Sprout;
            return (
              <Badge key={sport} variant="secondary" className="flex items-center gap-1.5 py-1 px-2">
                <Icon className="w-3.5 h-3.5" />
                {sport}
              </Badge>
            )
          })}
        </div>
        <p className="text-muted-foreground mb-6">{facility.description}</p>
      </div>
      
      <Separator />

      <div className="px-6 grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center gap-3"><Accessibility/> {facility.accessible ? "Accès PMR" : "Non accessible PMR"}</div>
        <div className="flex items-center gap-3">{facility.type === "indoor" ? <Moon /> : <Sun />} {facility.type.charAt(0).toUpperCase() + facility.type.slice(1)}</div>
      </div>

      {facilityEquipments.length > 0 && <Separator />}

      {facilityEquipments.length > 0 && (
        <div className="px-6">
          <h3 className="text-lg font-semibold mb-3">Équipements Inclus</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {facilityEquipments.map(item => {
              const Icon = equipmentIconsMap[item.name] || Sprout;
              return (
                <div key={item.name} className="flex items-center gap-3 text-muted-foreground">
                  <Icon className="w-4 h-4" />
                  <span>{item.name} ({item.quantity})</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  );
}
