'use client';

import type { Facility } from '@/lib/types';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { MapPin, Accessibility, Sun, Moon, Sprout, Building, Users, HardHat, Calendar, ShieldQuestion, UserCheck, Package, BarChart, LandPlot, HandCoins, User, Hash, AlertTriangle, Wrench, Syringe, CheckCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { sportsIconsMap } from '@/lib/icons';
import { format } from 'date-fns';

export default function FacilityDetails({ facility }: { facility: Facility }) {

  const detailItem = (Icon: React.ElementType, label: string, value: React.ReactNode) => {
    if (!value && typeof value !== 'number' && typeof value !== 'boolean') return null;
     let displayValue = String(value);
    if (typeof value === 'boolean') {
        displayValue = value ? 'Oui' : 'Non';
    }
    return (
      <div className="flex items-start gap-3 text-foreground">
        <Icon className="h-4 w-4 mt-1 text-primary flex-shrink-0" />
        <div>
          <p className="font-medium text-sm">{label}</p>
          <p className="text-muted-foreground text-sm">{displayValue}</p>
        </div>
      </div>
    );
  }

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
          <span>{facility.address}, {facility.commune}, {facility.province}, {facility.region}</span>
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

      <div className="px-6 grid grid-cols-2 gap-4">
        {detailItem(Sun, "Milieu", facility.milieu)}
        {detailItem(Accessibility, "Accès PMR", facility.accessible ? "Oui" : "Non")}
        {detailItem(HandCoins, "Propriété", facility.ownership)}
        {detailItem(UserCheck, "Gestionnaire", facility.managing_entity)}
        {detailItem(Hash, "N° Titre Foncier", facility.titre_foncier_numero)}
      </div>

       <Separator />

      <div className="px-6 space-y-4">
          <h3 className="text-lg font-semibold">Détails de l'Établissement</h3>
          <div className="grid grid-cols-2 gap-4">
              {detailItem(BarChart, "État Établissement", facility.establishment_state?.replace(/_/g, ' '))}
              {detailItem(Building, "État Bâtiment", facility.building_state)}
              {detailItem(Package, "État Équipements", facility.equipment_state?.replace(/_/g, ' '))}
              {detailItem(LandPlot, "Superficie (m²)", facility.surface_area)}
              {detailItem(Users, "Capacité", facility.capacity)}
              {detailItem(Calendar, "Dernière Rénovation", facility.last_renovation_date ? format(new Date(facility.last_renovation_date), 'PPP') : 'N/A')}
              {detailItem(CheckCircle, "Espace Aménagé", facility.developed_space)}
          </div>
      </div>

      <Separator />
      
      <div className="px-6 space-y-4">
          <h3 className="text-lg font-semibold">Ressources Humaines et Besoins</h3>
           <div className="grid grid-cols-2 gap-4">
              {detailItem(Users, "Effectif Total", facility.staff_count)}
              {detailItem(User, "Personnel Sport", facility.sports_staff_count)}
              {detailItem(AlertTriangle, "Besoin RH", facility.hr_needs)}
              {detailItem(Wrench, "Besoin Aménagement", facility.besoin_amenagement)}
              {detailItem(Syringe, "Besoin Équipements", facility.besoin_equipements)}
              {detailItem(Users, "Bénéficiaires", facility.beneficiaries)}
          </div>
      </div>


      {facility.equipments && facility.equipments.length > 0 && (
        <>
          <Separator />
          <div className="px-6">
            <h3 className="text-lg font-semibold mb-4">Équipements Inclus</h3>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              {facility.equipments.map(item => (
                <li key={item.name}>{item.name} (Qté: {item.quantity})</li>
              ))}
            </ul>
          </div>
        </>
      )}

      {facility.observations && (
        <>
          <Separator />
          <div className="px-6">
            <h3 className="text-lg font-semibold mb-2">Observations</h3>
            <p className="text-sm text-muted-foreground">{facility.observations}</p>
          </div>
        </>
      )}

    </div>
  );
}
