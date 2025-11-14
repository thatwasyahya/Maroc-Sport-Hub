'use client';

import { useState, useEffect } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import type { Facility } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, Loader2, Upload, Eye, FileDown, MoreHorizontal } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

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
  
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [isBulkDeleteAlertOpen, setIsBulkDeleteAlertOpen] = useState(false);

  // Use default data directly, ignoring Firestore for now.
  const [facilities, setFacilities] = useState<Facility[]>(defaultData.facilities);
  const [facilitiesLoading, setFacilitiesLoading] = useState(false);
  
  const isAllSelected = selectedRowKeys.length > 0 && selectedRowKeys.length === facilities.length;
  const isSomeSelected = selectedRowKeys.length > 0 && selectedRowKeys.length < facilities.length;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRowKeys(facilities.map(f => f.id));
    } else {
      setSelectedRowKeys([]);
    }
  };

  const handleRowSelect = (rowId: string, checked: boolean) => {
    if (checked) {
      setSelectedRowKeys(prev => [...prev, rowId]);
    } else {
      setSelectedRowKeys(prev => prev.filter(id => id !== rowId));
    }
  };

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
      setFacilities(prev => prev.filter(f => f.id !== facilityId));
      toast({
        title: "Installation supprimée (localement)",
        description: "L'installation a été retirée de la liste actuelle.",
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
  
  const handleBulkDelete = async () => {
    setFacilities(prev => prev.filter(f => !selectedRowKeys.includes(f.id)));
    toast({
        title: `${selectedRowKeys.length} installations supprimées`,
        description: "Les installations sélectionnées ont été retirées de la liste.",
    });
    setSelectedRowKeys([]);
    setIsBulkDeleteAlertOpen(false);
  };
  
  const downloadFile = (content: Blob, fileName: string) => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCSV = () => {
    const csv = Papa.unparse(facilities);
    // Add BOM for Excel to recognize UTF-8
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    downloadFile(blob, 'facilities.csv');
  };

  const handleExportJSON = () => {
    const json = JSON.stringify(facilities, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    downloadFile(blob, 'facilities.json');
  };
  
  const handleExportXLSX = () => {
    const worksheet = XLSX.utils.json_to_sheet(facilities);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Installations');
    const xlsxBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([xlsxBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    downloadFile(blob, 'facilities.xlsx');
  };


  return (
    <>
      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <CardTitle>{t('title')}</CardTitle>
            <CardDescription>{t('description')}</CardDescription>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
             <Button onClick={() => setIsImportDialogOpen(true)} variant="outline" className="w-full md:w-auto">
              <Upload className="mr-2 h-4 w-4" />
              Importer
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full md:w-auto">
                  <FileDown className="mr-2 h-4 w-4" />
                  Exporter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={handleExportCSV}>Exporter en CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportJSON}>Exporter en JSON</DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportXLSX}>Exporter en XLSX (Excel)</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={handleAddNew} className="w-full md:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" />
              {t('addButton')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
           {selectedRowKeys.length > 0 && (
            <div className="flex items-center justify-between gap-4 p-4 mb-4 bg-muted border rounded-lg">
                <div className="text-sm font-medium">
                    {selectedRowKeys.length} installation(s) sélectionnée(s)
                </div>
                <AlertDialog open={isBulkDeleteAlertOpen} onOpenChange={setIsBulkDeleteAlertOpen}>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                            <Trash2 className="mr-2 h-4 w-4"/>
                            Supprimer la sélection
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Cette action est irréversible. {selectedRowKeys.length} installations seront définitivement supprimées.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive hover:bg-destructive/90">
                                Supprimer
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
           )}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                   <TableHead className="w-[40px]">
                    <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={(checked) => handleSelectAll(!!checked)}
                        aria-label="Select all"
                        indeterminate={isSomeSelected}
                    />
                  </TableHead>
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
                    <TableCell colSpan={7} className="h-24 text-center">
                      {t('loading')}
                    </TableCell>
                  </TableRow>
                ) : facilities && facilities.length > 0 ? (
                  facilities.map((facility) => (
                    <TableRow key={facility.id} data-state={selectedRowKeys.includes(facility.id) && "selected"}>
                      <TableCell>
                        <Checkbox
                            checked={selectedRowKeys.includes(facility.id)}
                            onCheckedChange={(checked) => handleRowSelect(facility.id, !!checked)}
                            aria-label="Select row"
                        />
                      </TableCell>
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
                            <div className="flex justify-end gap-1 md:gap-0">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleView(facility)}>
                                        <Eye className="mr-2 h-4 w-4" />
                                        Voir
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleEdit(facility)}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Modifier
                                    </DropdownMenuItem>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive px-2 py-1.5 font-normal text-sm relative flex cursor-default select-none items-center rounded-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Supprimer
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
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          )}
                        </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
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

    