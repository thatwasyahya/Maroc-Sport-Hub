'use client';

import { useState, useEffect } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
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
import { defaultData } from '@/lib/data';

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

  // Use default data directly, ignoring Firestore for now.
  const [facilities, setFacilities] = useState<Facility[]>(defaultData.facilities);
  const [facilitiesLoading, setFacilitiesLoading] = useState(false);


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
      // This is a local delete for now as we are using default data.
      setFacilities(prev => prev.filter(f => f.id !== facilityId));
      toast({
        title: "Installation supprimée (localement)",
        description: "L'installation a été retirée de la liste actuelle.",
      });
      // In a real scenario with a connected DB, you would use:
      // await deleteDoc(doc(firestore, 'facilities', facilityId));
      // toast({
      //   title: "Installation supprimée",
      //   description: "L'installation a été supprimée avec succès.",
      // });
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
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <CardTitle>{t('title')}</CardTitle>
            <CardDescription>{t('description')}</CardDescription>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
             <Button onClick={() => setIsImportDialogOpen(true)} variant="outline" className="w-full md:w-auto">
              <Upload className="mr-2 h-4 w-4" />
              Importer
            </Button>
            <Button onClick={handleAddNew} className="w-full md:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" />
              {t('addButton')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('tableHeaderName')}</TableHead>
                  <TableHead className="hidden sm:table-cell">Province</TableHead>
                  <TableHead className="hidden lg:table-cell">Commune</TableHead>
                  <TableHead>État</TableHead>
                  <TableHead className="hidden md:table-cell">{t('tableHeaderSports')}</TableHead>
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
                      <TableCell className="hidden sm:table-cell">{facility.province}</TableCell>
                      <TableCell className="hidden lg:table-cell">{facility.commune}</TableCell>
                      <TableCell>
                          {facility.establishment_state && <Badge variant="secondary">{facility.establishment_state}</Badge>}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {(facility.sports || []).map((sport) => (
                            <Badge key={sport} variant="outline">{sport}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                          {processingId === facility.id ? (
                             <Loader2 className="ml-auto h-5 w-5 animate-spin" />
                          ) : (
                            <div className="flex justify-end gap-1 md:gap-2">
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
          </div>
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
                      <ScrollArea className="max-h-[70vh] md:max-h-[80vh]">
                        <FacilityDetails facility={selectedFacility} />
                      </ScrollArea>
                  </>
              )}
          </DialogContent>
      </Dialog>

    </>
  );
}
