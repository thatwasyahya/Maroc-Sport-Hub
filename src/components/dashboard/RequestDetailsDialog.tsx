'use client';

import type { FacilityRequest } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Accessibility, Calendar, Building2, MapPin, Moon, Sun, Users, HardHat, ClipboardList, Package, Building, ShieldQuestion, UserCheck, BarChart, FileText, LandPlot, HandCoins, User, Hash, AlertTriangle, Syringe, Wrench, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ScrollArea } from '../ui/scroll-area';

interface RequestDetailsDialogProps {
  request: FacilityRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function RequestDetailsDialog({ request, open, onOpenChange }: RequestDetailsDialogProps) {
  if (!request) return null;
  
  const getStatusBadgeVariant = (status: FacilityRequest['status']) => {
        switch (status) {
            case 'approved': return 'default';
            case 'pending': return 'secondary';
            case 'rejected': return 'destructive';
            default: return 'outline';
        }
    };
    
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
          <p className="font-medium text-sm">{label}</p>
          <p className="text-muted-foreground text-sm">{displayValue}</p>
        </div>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-hidden p-0">
        <div className="flex flex-col h-full max-h-[85vh]">
          <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
            <DialogTitle className="text-2xl">{request.name}</DialogTitle>
            <DialogDescription>
              Demande d'ajout soumise par <span className="font-medium">{request.userName}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 px-6">
            <div className="space-y-6 pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                            {request.createdAt?.seconds ? format(new Date(request.createdAt.seconds * 1000), 'PPP') : 'N/A'}
                        </span>
                    </div>
                    <Badge variant={getStatusBadgeVariant(request.status)}>{request.status}</Badge>
                </div>
                
                <Separator />

                <div className="grid gap-2">
                    <h3 className="font-semibold text-lg mb-2">Informations Générales</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {detailItem(FileText, "Type d'installation", request.installations_sportives)}
                        {detailItem(Badge, "Catégorie", request.categorie_abregee)}
                        {detailItem(MapPin, "Adresse", request.address)}
                        {detailItem(Building2, "Province, Commune", `${request.province || 'N/A'}, ${request.commune || 'N/A'}`)}
                        {detailItem(MapPin, "Région", request.region)}
                        {detailItem(Sun, "Milieu", request.milieu)}
                    </div>
                </div>

                <Separator />
                
                <div className="grid gap-2">
                    <h3 className="font-semibold text-lg mb-2">Propriété et Gestion</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {detailItem(HandCoins, "Propriété", request.ownership)}
                        {detailItem(UserCheck, "Entité Gestionnaire", request.managing_entity)}
                        {detailItem(Hash, "N° Titre Foncier", request.titre_foncier_numero)}
                    </div>
                </div>

                <Separator />

                <div className="grid gap-2">
                    <h3 className="font-semibold text-lg mb-2">Détails Techniques et État</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {detailItem(LandPlot, "Superficie (m²)", request.surface_area)}
                        {detailItem(Users, "Capacité d'accueil", request.capacity)}
                        {detailItem(Calendar, "Dernière rénovation", request.last_renovation_date ? format(new Date(request.last_renovation_date), 'PPP') : 'N/A')}
                        {detailItem(BarChart, "État Établissement", request.establishment_state?.replace(/_/g, ' '))}
                        {detailItem(Building, "État Bâtiment", request.building_state)}
                        {detailItem(Package, "État Équipements", request.equipment_state?.replace(/_/g, ' '))}
                        {detailItem(CheckCircle, "Espace Aménagé", request.developed_space)}
                    </div>
                </div>
                
                 <Separator />

                <div className="grid gap-2">
                    <h3 className="font-semibold text-lg mb-2">Ressources Humaines et Besoins</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {detailItem(Users, "Effectif Total", request.staff_count)}
                        {detailItem(User, "Personnel Sport", request.sports_staff_count)}
                        {detailItem(Users, "Bénéficiaires", request.beneficiaries)}
                        {detailItem(AlertTriangle, "Besoin RH", request.hr_needs)}
                        {detailItem(Wrench, "Besoin Aménagement", request.besoin_amenagement)}
                        {detailItem(Syringe, "Besoin Équipements", request.besoin_equipements)}
                    </div>
                </div>

                <Separator />

                 <div className="grid gap-2">
                    <h3 className="font-semibold">Description</h3>
                    <p className="text-sm text-muted-foreground">{request.description || "Aucune description fournie."}</p>
                </div>

                <Separator />
                
                <div className="grid grid-cols-2 gap-8">
                     <div className="grid gap-2">
                        <h3 className="font-semibold">Sports</h3>
                        <div className="flex flex-wrap gap-2">
                            {request.sports.map(sport => <Badge key={sport} variant="secondary">{sport}</Badge>)}
                        </div>
                    </div>

                    {request.equipments && request.equipments.length > 0 && (
                        <div className="grid gap-2">
                            <h3 className="font-semibold">Équipements</h3>
                            <ul className="list-disc list-inside text-sm text-muted-foreground">
                                {request.equipments.map(eq => <li key={eq.name}>{eq.name} (Qté: {eq.quantity})</li>)}
                            </ul>
                        </div>
                    )}
                </div>
                 
                {request.observations && (
                   <>
                    <Separator />
                    <div className="grid gap-2">
                        <h3 className="font-semibold">Observations</h3>
                        <p className="text-sm text-muted-foreground">{request.observations}</p>
                    </div>
                   </>
                )}


                {request.status === 'rejected' && request.rejectionReason && (
                    <>
                        <Separator />
                        <div className="grid gap-2">
                            <h3 className="font-semibold text-destructive">Raison du Rejet</h3>
                            <p className="text-sm text-destructive/80">{request.rejectionReason}</p>
                        </div>
                    </>
                )}

            </div>
          </div>
          <DialogFooter className="px-6 py-4 border-t flex-shrink-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
