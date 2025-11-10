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
import { Accessibility, Calendar, Building2, MapPin, Moon, Sun, User } from 'lucide-react';
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">{request.name}</DialogTitle>
          <DialogDescription>
            Demande d'ajout soumise par <span className="font-medium">{request.userName}</span>.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-6">
            <div className="space-y-4 py-4">
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
                    <h3 className="font-semibold">Informations Générales</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                            <div>
                                <p className="font-medium">Adresse</p>
                                <p className="text-muted-foreground">{request.address}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground" />
                            <div>
                                <p className="font-medium">Ville & Région</p>
                                <p className="text-muted-foreground">{request.city}, {request.region}</p>
                            </div>
                        </div>
                         <div className="flex items-start gap-2">
                            {request.type === 'indoor' ? <Moon className="h-4 w-4 mt-0.5 text-muted-foreground" /> : <Sun className="h-4 w-4 mt-0.5 text-muted-foreground" />}
                            <div>
                                <p className="font-medium">Type</p>
                                <p className="text-muted-foreground">{request.type}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <Accessibility className="h-4 w-4 mt-0.5 text-muted-foreground" />
                            <div>
                                <p className="font-medium">Accessibilité</p>
                                <p className="text-muted-foreground">{request.accessible ? 'Oui' : 'Non'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <Separator />

                <div className="grid gap-2">
                    <h3 className="font-semibold">Description</h3>
                    <p className="text-sm text-muted-foreground">{request.description}</p>
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
