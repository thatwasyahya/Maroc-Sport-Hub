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
      <div className="relative w-full h-60 bg-muted flex items-center justify-center">
        <Image
          src={'https://picsum.photos/seed/facility-details/800/600'}
          alt={facility.name}
          fill
          className="object-cover"
          data-ai-hint="sports facility interior"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      </div>
      
      <div className="px-6 space-y-4">
        <div className="flex items-start text-muted-foreground text-sm">
          <MapPin className="w-4 h-4 mr-2 mt-1 shrink-0" />
          <span>{facility.address}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {facility.sports.map(sport => {
            const Icon = sportsIconsMap[sport] || Sprout;
            return (
              <Badge key={sport} variant="secondary" className="flex items-center gap-1.5 py-1 px-3 text-sm">
                <Icon className="w-3.5 h-3.5" />
                {sport}
              </Badge>
            )
          })}
        </div>
        <p className="text-muted-foreground text-base pt-2">{facility.description}</p>
      </div>
      
      <Separator />

      <div className="px-6 grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center gap-3 text-foreground"><Accessibility className="text-primary"/> {facility.accessible ? "Accès PMR" : "Non accessible PMR"}</div>
        <div className="flex items-center gap-3 text-foreground">{facility.type === "indoor" ? <Moon className="text-primary"/> : <Sun className="text-primary" />} {facility.type === "indoor" ? "Intérieur" : "Extérieur"}</div>
      </div>

      {facilityEquipments.length > 0 && <Separator />}

      {facilityEquipments.length > 0 && (
        <div className="px-6">
          <h3 className="text-lg font-semibold mb-4">Équipements Inclus</h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {facilityEquipments.map(item => {
              const Icon = equipmentIconsMap[item.name] || Sprout;
              return (
                <div key={item.name} className="flex items-center gap-3 text-muted-foreground">
                  <Icon className="w-4 h-4 text-primary" />
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
