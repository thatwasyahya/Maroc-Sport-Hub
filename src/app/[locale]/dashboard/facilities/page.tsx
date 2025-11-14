
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
  
  const getCleanDataForExport = () => {
      return facilities.map(f => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id, adminId, ...rest } = f;
          return rest;
      });
  }

  const handleExportJSON = () => {
    const dataToExport = getCleanDataForExport();
    const json = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    downloadFile(blob, 'facilities.json');
  };
  
  const handleExportXLSX = () => {
    const dataToExport = facilities.map(f => ({
      [t('export.name')]: f.name,
      [t('export.description')]: f.description,
      [t('export.sports')]: f.sports?.join(', '),
      [t('export.equipments')]: f.equipments?.map(e => `${e.name} (${e.quantity})`).join(', '),
      [t('export.region')]: f.region,
      [t('export.province')]: f.province,
      [t('export.commune')]: f.commune,
      [t('export.address')]: f.address,
      [t('export.milieu')]: f.milieu,
      [t('export.type')]: f.type,
      [t('export.accessible')]: f.accessible ? 'Oui' : 'Non',
      [t('export.lat')]: f.location?.lat,
      [t('export.lng')]: f.location?.lng,
      [t('export.ownership')]: f.ownership,
      [t('export.managing_entity')]: f.managing_entity,
      [t('export.last_renovation_date')]: f.last_renovation_date,
      [t('export.surface_area')]: f.surface_area,
      [t('export.capacity')]: f.capacity,
      [t('export.staff_count')]: f.staff_count,
      [t('export.establishment_state')]: f.establishment_state,
      [t('export.building_state')]: f.building_state,
      [t('export.equipment_state')]: f.equipment_state,
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, t('title'));
    const xlsxBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([xlsxBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    downloadFile(blob, `${t('title')}.xlsx`);
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
              {t('importButton')}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full md:w-auto">
                  <FileDown className="mr-2 h-4 w-4" />
                  {t('exportButton')}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={handleExportJSON}>{t('exportJSON')}</DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportXLSX}>{t('exportXLSX')}</DropdownMenuItem>
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
                    {t('selectedCount', {count: selectedRowKeys.length})}
                </div>
                <AlertDialog open={isBulkDeleteAlertOpen} onOpenChange={setIsBulkDeleteAlertOpen}>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                            <Trash2 className="mr-2 h-4 w-4"/>
                            {t('deleteSelected')}
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{t('confirmDeleteTitle')}</AlertDialogTitle>
                            <AlertDialogDescription>
                                {t('confirmDeleteDescription', {count: selectedRowKeys.length})}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive hover:bg-destructive/90">
                                {t('delete')}
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
                        indeterminate={isSomeSelected ? true : undefined}
                    />
                  </TableHead>
                  <TableHead>{t('tableHeaderName')}</TableHead>
                  <TableHead className="hidden sm:table-cell">{t('tableHeaderProvince')}</TableHead>
                  <TableHead className="hidden lg:table-cell">{t('tableHeaderCommune')}</TableHead>
                  <TableHead>{t('tableHeaderState')}</TableHead>
                  <TableHead className="hidden md:table-cell">{t('tableHeaderSports')}</TableHead>
                  <TableHead className="text-right">{t('tableHeaderActions')}</TableHead>
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
                                        {t('viewAction')}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleEdit(facility)}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        {t('editAction')}
                                    </DropdownMenuItem>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive px-2 py-1.5 font-normal text-sm relative flex cursor-default select-none items-center rounded-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                {t('deleteAction')}
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>{t('confirmDeleteTitle')}</AlertDialogTitle>
                                                <AlertDialogDescription>{t('confirmDeleteSingleDescription')}</AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(facility.id)} className="bg-destructive hover:bg-destructive/90">
                                                    {t('delete')}
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

    

    