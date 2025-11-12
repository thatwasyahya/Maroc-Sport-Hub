'use client';

import type { Facility } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { MapPin, Accessibility, Sun, Sprout, Building, Users, HardHat, Calendar, UserCheck, Package, BarChart, LandPlot, HandCoins, User, Hash, AlertTriangle, Wrench, Syringe, CheckCircle, FileText } from 'lucide-react';
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
      <div className="flex items-start gap-3">
        <Icon className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
        <div>
          <p className="font-medium text-sm text-foreground">{label}</p>
          <p className="text-muted-foreground text-sm">{displayValue}</p>
        </div>
      </div>
    );
  }

  const renderSection = (title: string, children: React.ReactNode) => {
    // A helper to only render a section if it has visible children
    const childArray = React.Children.toArray(children);
    if (childArray.every(child => child === null)) {
      return null;
    }
    return (
      <>
        <Separator />
        <div className="px-6 space-y-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-4">
            {children}
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="space-y-6 pb-6">
      <div className="px-6 pt-4 space-y-4">
        <div className="flex items-start text-muted-foreground text-sm">
          <MapPin className="w-4 h-4 mr-2 mt-1 shrink-0" />
          <span>{facility.commune}, {facility.province}, {facility.region}</span>
        </div>
        
        {facility.sports && facility.sports.length > 0 && (
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
        )}
        {facility.description && <p className="text-muted-foreground text-base pt-2">{facility.description}</p>}
      </div>
      
      {renderSection("Informations Générales",
        <>
            {detailItem(FileText, "Type d'installation", facility.installations_sportives)}
            {detailItem(Badge, "Catégorie", facility.categorie_abregee)}
            {detailItem(Sun, "Milieu", facility.milieu)}
            {detailItem(Accessibility, "Accès PMR", facility.accessible ? "Oui" : "Non")}
        </>
      )}
      
      {renderSection("Propriété et Gestion",
        <>
            {detailItem(HandCoins, "Propriété", facility.ownership)}
            {detailItem(UserCheck, "Gestionnaire", facility.managing_entity)}
            {detailItem(Hash, "N° Titre Foncier", facility.titre_foncier_numero)}
        </>
      )}
      
      {renderSection("Détails de l'Établissement",
        <>
            {detailItem(BarChart, "État Établissement", facility.establishment_state?.replace(/_/g, ' '))}
            {detailItem(Building, "État Bâtiment", facility.building_state)}
            {detailItem(Package, "État Équipements", facility.equipment_state?.replace(/_/g, ' '))}
            {detailItem(LandPlot, "Superficie (m²)", facility.surface_area)}
            {detailItem(Users, "Capacité", facility.capacity)}
            {detailItem(Calendar, "Dernière Rénovation", facility.last_renovation_date ? format(new Date(facility.last_renovation_date), 'PPP') : 'N/A')}
            {detailItem(CheckCircle, "Espace Aménagé", facility.developed_space)}
        </>
      )}

      {renderSection("Ressources Humaines et Besoins",
        <>
            {detailItem(Users, "Effectif Total", facility.staff_count)}
            {detailItem(User, "Personnel Sport", facility.sports_staff_count)}
            {detailItem(Users, "Bénéficiaires", facility.beneficiaries)}
            {detailItem(AlertTriangle, "Besoin RH", facility.hr_needs)}
            {detailItem(Wrench, "Besoin Aménagement", facility.besoin_amenagement)}
            {detailItem(Syringe, "Besoin Équipements", facility.besoin_equipements)}
        </>
      )}

      {facility.equipments && facility.equipments.length > 0 && (
        <>
          <Separator />
          <div className="px-6">
            <h3 className="text-lg font-semibold mb-3">Équipements Inclus</h3>
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

      {facility.rehabilitation_plan && (
        <>
          <Separator />
          <div className="px-6">
            <h3 className="text-lg font-semibold mb-2">Plan de réhabilitation</h3>
            <p className="text-sm text-muted-foreground">{facility.rehabilitation_plan}</p>
          </div>
        </>
      )}

    </div>
  );
}
