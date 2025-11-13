'use client';

import { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, deleteDoc } from 'firebase/firestore';
import type { Facility } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, Loader2, Upload, Eye } from 'lucide-react';
import AddFacilityDialog from '@/components/dashboard/AddFacilityDialog';
import ImportFacilitiesDialog from '@/components/dashboard/ImportFacilitiesDialog';
import { useTranslations } from 'next-intl';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import FacilityDetails from '@/components/facility-details';
import { useToast } from '@/hooks/use-toast';

export default function FacilitiesPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const t = useTranslations('Dashboard.Facilities');
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const facilitiesCollectionRef = useMemoFirebase(
    () => collection(firestore, 'facilities'),
    [firestore]
  );
  const { data: facilities, isLoading: facilitiesLoading } = useCollection<Facility>(facilitiesCollectionRef);

  const handleAddNew = () => {
    setSelectedFacility(null);
    setIsAddDialogOpen(true);
  };

  const handleEdit = (facility: Facility) => {
    setSelectedFacility(facility);
    setIsAddDialogOpen(true);
  };

  const handleView = (facility: Facility) => {
    setSelectedFacility(facility);
    setIsViewDialogOpen(true);
  };
  
  const handleDelete = async (facilityId: string) => {
    if (!firestore || !user) return;
    setProcessingId(facilityId);
    try {
      await deleteDoc(doc(firestore, 'facilities', facilityId));
      toast({
        title: "Installation supprimée",
        description: "L'installation a été supprimée avec succès.",
      });
    } catch (error: any) {
      console.error("Error deleting facility: ", error);
      toast({
        variant: "destructive",
        title: "Erreur de suppression",
        description: error.message,
      });
    } finally {
      setProcessingId(null);
    }
  };


  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t('title')}</CardTitle>
            <CardDescription>{t('description')}</CardDescription>
          </div>
          <div className="flex gap-2">
             <Button onClick={() => setIsImportDialogOpen(true)} variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Importer
            </Button>
            <Button onClick={handleAddNew}>
              <PlusCircle className="mr-2 h-4 w-4" />
              {t('addButton')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('tableHeaderName')}</TableHead>
                <TableHead>Province</TableHead>
                <TableHead>Commune</TableHead>
                <TableHead>État</TableHead>
                <TableHead>{t('tableHeaderSports')}</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {facilitiesLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    {t('loading')}
                  </TableCell>
                </TableRow>
              ) : facilities && facilities.length > 0 ? (
                facilities.map((facility) => (
                  <TableRow key={facility.id}>
                    <TableCell className="font-medium">{facility.name}</TableCell>
                    <TableCell>{facility.province}</TableCell>
                    <TableCell>{facility.commune}</TableCell>
                    <TableCell>
                        {facility.establishment_state && <Badge variant="secondary">{facility.establishment_state}</Badge>}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(facility.sports || []).map((sport) => (
                          <Badge key={sport} variant="outline">{sport}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                        {processingId === facility.id ? (
                           <Loader2 className="ml-auto h-5 w-5 animate-spin" />
                        ) : (
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleView(facility)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(facility)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                      <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                                        <AlertDialogDescription>Cette action est irréversible. L'installation sera définitivement supprimée.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(facility.id)} className="bg-destructive hover:bg-destructive/90">
                                            Supprimer
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        )}
                      </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    {t('noFacilities')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {isAddDialogOpen && (
        <AddFacilityDialog 
          open={isAddDialogOpen} 
          onOpenChange={setIsAddDialogOpen} 
          facility={selectedFacility}
        />
      )}
      
      {isImportDialogOpen && (
          <ImportFacilitiesDialog
            open={isImportDialogOpen}
            onOpenChange={setIsImportDialogOpen}
          />
      )}

      <Dialog open={isViewDialogOpen} onOpenChange={(open) => { if (!open) setSelectedFacility(null); setIsViewDialogOpen(open); }}>
          <DialogContent className="max-w-3xl p-0">
              {selectedFacility && (
                  <>
                      <DialogHeader className="p-6 pb-4">
                          <DialogTitle className="font-headline text-3xl">{selectedFacility.name}</DialogTitle>
                          <DialogDescription>{selectedFacility.address}</DialogDescription>
                      </DialogHeader>
                      <ScrollArea className="max-h-[70vh]">
                        <FacilityDetails facility={selectedFacility} />
                      </ScrollArea>
                  </>
              )}
          </DialogContent>
      </Dialog>

    </>
  );
}
