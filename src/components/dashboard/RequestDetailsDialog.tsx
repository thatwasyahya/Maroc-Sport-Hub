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
import { Accessibility, Calendar, Building2, MapPin, Moon, Sun, Users, HardHat, ClipboardList, Package, Building, ShieldQuestion, UserCheck, BarChart, FileText } from 'lucide-react';
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
    if (!value && typeof value !== 'number') return null;
    return (
      <div className="flex items-start gap-3">
        <Icon className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
        <div>
          <p className="font-medium text-sm">{label}</p>
          <p className="text-muted-foreground text-sm">{String(value)}</p>
        </div>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">{request.name}</DialogTitle>
          <DialogDescription>
            Demande d'ajout soumise par <span className="font-medium">{request.userName}</span>.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-6">
            <div className="space-y-6 py-4">
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
                        {detailItem(MapPin, "Adresse", request.address)}
                        {detailItem(Building2, "Ville, Province", `${request.city}, ${request.province || 'N/A'}`)}
                        {detailItem(ShieldQuestion, "Propriété", request.ownership)}
                        {detailItem(UserCheck, "Entité Gestionnaire", request.managing_entity)}
                        {detailItem(request.type === 'indoor' ? Moon : Sun, "Type", request.type)}
                        {detailItem(Accessibility, "Accessibilité", request.accessible ? 'Oui' : 'Non')}
                    </div>
                </div>

                <Separator />

                <div className="grid gap-2">
                    <h3 className="font-semibold text-lg mb-2">Détails de l'Établissement</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {detailItem(BarChart, "État Établissement", request.establishment_state)}
                        {detailItem(Building, "État Bâtiment", request.building_state)}
                        {detailItem(Package, "État Équipements", request.equipment_state)}
                        {detailItem(Users, "Capacité d'accueil", request.capacity)}
                        {detailItem(HardHat, "Effectif", request.staff_count)}
                        {detailItem(Calendar, "Dernière rénovation", request.last_renovation_date ? format(new Date(request.last_renovation_date), 'PPP') : 'N/A')}
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
        </ScrollArea>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
