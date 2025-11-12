'use client';

import { useState, useRef, useCallback } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { writeBatch, collection, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileUp, FileCheck2, AlertCircle, X, ChevronsUpDown, Check } from 'lucide-react';
import Papa from 'papaparse';
import { ScrollArea } from '../ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import type { Facility, EstablishmentState, BuildingState, EquipmentState } from '@/lib/types';


interface ImportFacilitiesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const requiredDbFields = [
    { key: 'name', label: 'Nom de l\'établissement', notes: 'Obligatoire' },
    { key: 'location', label: 'Coordonnées (Latitude/Longitude)', notes: 'Obligatoire' },
];

const optionalDbFields = [
    { key: 'reference_region', label: 'Référence Région', notes: 'Numérique' },
    { key: 'region', label: 'Région' },
    { key: 'province', label: 'Province' },
    { key: 'commune', label: 'Commune' },
    { key: 'milieu', label: 'Milieu (Urbain/Rural)' },
    { key: 'installations_sportives', label: 'Type d\'installation' },
    { key: 'categorie_abregee', label: 'Catégorie abrégée' },
    { key: 'address', label: 'Adresse/Localisation' },
    { key: 'ownership', label: 'Propriété' },
    { key: 'managing_entity', label: 'Entité gestionnaire' },
    { key: 'last_renovation_date', label: 'Date dernière rénovation', notes: 'Format date' },
    { key: 'surface_area', label: 'Superficie (m²)', notes: 'Numérique' },
    { key: 'capacity', label: 'Capacité d\'accueil', notes: 'Numérique' },
    { key: 'staff_count', label: 'Effectif total', notes: 'Numérique' },
    { key: 'establishment_state', label: 'État de l\'établissement' },
    { key: 'developed_space', label: 'Espace aménagé', notes: 'Booléen (oui/non)' },
    { key: 'titre_foncier_numero', label: 'N° Titre Foncier' },
    { key: 'building_state', label: 'État du bâtiment' },
    { key: 'equipment_state', label: 'État des équipements' },
    { key: 'sports_staff_count', label: 'Personnel du secteur sport', notes: 'Numérique' },
    { key: 'hr_needs', label: 'Besoin en RH', notes: 'Booléen (oui/non)' },
    { key: 'rehabilitation_plan', label: 'Plan de réhabilitation' },
    { key: 'besoin_amenagement', label: 'Besoin d\'aménagement', notes: 'Booléen (oui/non)' },
    { key: 'besoin_equipements', label: 'Besoin d\'équipements', notes: 'Booléen (oui/non)' },
    { key: 'observations', label: 'Observations' },
    { key: 'beneficiaries', label: 'Bénéficiaires', notes: 'Numérique' },
];

const allDbFields = [...requiredDbFields, ...optionalDbFields];

type Step = 'select_file' | 'map_columns' | 'preview' | 'importing';

export default function ImportFacilitiesDialog({ open, onOpenChange }: ImportFacilitiesDialogProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('select_file');
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [fileData, setFileData] = useState<any[]>([]);
  
  const [columnMap, setColumnMap] = useState<Record<string, string>>({});
  const [parsedData, setParsedData] = useState<Partial<Facility>[]>([]);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetState = () => {
    setStep('select_file');
    setFileName(null);
    setFileHeaders([]);
    setFileData([]);
    setColumnMap({});
    setParsedData([]);
    setIsProcessing(false);
    setError(null);
    if(fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      resetState();
    }
    onOpenChange(isOpen);
  };
  
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    resetState();
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setError('Veuillez sélectionner un fichier au format .csv');
      return;
    }
    
    setFileName(file.name);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      preview: 5, // Only need headers and a few rows to start
      complete: (results) => {
        if(results.errors.length) {
            setError(`Erreur lors de la lecture du fichier CSV: ${results.errors[0].message}`);
            return;
        }
        setFileHeaders(results.meta.fields || []);
        setFileData(results.data); // Store all data now
        setStep('map_columns');
      },
      error: (err: any) => {
        setError(`Erreur lors de la lecture du fichier CSV: ${err.message}`);
      }
    });
  };
  
  const handleColumnMapChange = (dbField: string, fileHeader: string) => {
    setColumnMap(prev => ({...prev, [dbField]: fileHeader}));
  };

  const processMappedData = () => {
    if (!user) {
      setError('Vous devez être connecté pour importer des données.');
      return;
    }
    
    // Check if required fields are mapped
    if (!columnMap.name || (!columnMap.latitude && !columnMap.longitude && !columnMap.location)) {
        setError("Le mappage des champs obligatoires (Nom, Latitude, Longitude) est requis.");
        return;
    }

    const facilities: Partial<Facility>[] = fileData.map((row) => {
        const facility: Partial<Facility> = { adminId: user.uid };
        let lat: number | null = null;
        let lng: number | null = null;

        for (const dbField of allDbFields) {
            const fileHeader = columnMap[dbField.key];
            if (fileHeader && row[fileHeader] !== undefined) {
                const value = row[fileHeader];
                
                if (dbField.key === 'latitude' || dbField.key === 'longitude') {
                    const num = parseFloat(String(value).replace(',', '.'));
                    if (!isNaN(num)) {
                        if (dbField.key === 'latitude') lat = num;
                        if (dbField.key === 'longitude') lng = num;
                    }
                } else if (dbField.notes?.includes('Numérique')) {
                    (facility as any)[dbField.key] = parseFloat(String(value).replace(',', '.')) || undefined;
                } else if (dbField.notes?.includes('Booléen')) {
                    (facility as any)[dbField.key] = ['oui', 'yes', 'true', '1'].includes(String(value).toLowerCase());
                } else {
                    (facility as any)[dbField.key] = value || undefined;
                }
            }
        }
        
        // Special case for combined location
        const locationHeader = columnMap.location;
        if(locationHeader && typeof row[locationHeader] === 'string') {
            const parts = row[locationHeader].split(/[,; ]+/);
            if(parts.length === 2) {
                const parsedLat = parseFloat(parts[0]);
                const parsedLng = parseFloat(parts[1]);
                if(!isNaN(parsedLat) && !isNaN(parsedLng)) {
                    lat = parsedLat;
                    lng = parsedLng;
                }
            }
        }

        if (lat !== null && lng !== null) {
            facility.location = { lat, lng };
        }

        if (facility.name && facility.location) {
            return facility;
        }
        return null;
    }).filter((f): f is Partial<Facility> => f !== null);

    if (facilities.length === 0) {
         setError("Aucune ligne valide n'a pu être lue. Vérifiez votre mappage et le contenu du fichier.");
         return;
    }
    
    setParsedData(facilities);
    setStep('preview');
  };
  
  const handleImport = async () => {
    if (parsedData.length === 0 || !firestore) return;
    setStep('importing');
    
    try {
        const batch = writeBatch(firestore);
        
        parsedData.forEach(facilityData => {
            const docRef = doc(collection(firestore, 'facilities')); // Auto-generate ID
            batch.set(docRef, {
                ...facilityData,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
        });

        await batch.commit();
        toast({
            title: "Importation réussie",
            description: `${parsedData.length} installations ont été importées avec succès.`,
        });
        handleClose(true);
    } catch (error: any) {
        setError(`Erreur lors de l'importation : ${error.message}`);
        toast({
            variant: "destructive",
            title: "Échec de l'importation",
            description: `Une erreur s'est produite lors de l'importation des données. ${error.message}`,
        });
        setStep('preview'); // Go back to preview on error
    }
  };

  const renderStepContent = () => {
    switch(step) {
        case 'select_file':
            return (
                <div className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center">
                    <FileUp className="h-10 w-10 text-muted-foreground" />
                    <h3 className="text-lg font-semibold">Télécharger un fichier CSV</h3>
                    <p className="text-sm text-muted-foreground">Cliquez sur le bouton pour sélectionner un fichier .csv depuis votre ordinateur.</p>
                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                      Sélectionner un fichier
                    </Button>
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".csv" className="hidden" />
                </div>
            );
        case 'map_columns':
            return (
                <>
                <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3 mb-4">
                    <FileCheck2 className="h-6 w-6 text-green-600" />
                    <div>
                        <p className="font-medium">{fileName}</p>
                        <p className="text-sm text-muted-foreground">Fichier prêt. Veuillez mapper les colonnes.</p>
                    </div>
                </div>
                <ScrollArea className="h-96">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 p-1">
                      {allDbFields.map(field => (
                          <div key={field.key} className="space-y-1">
                              <label className="font-medium text-sm">
                                  {field.label}
                                  {requiredDbFields.some(f => f.key === field.key) && <span className="text-destructive ml-1">*</span>}
                              </label>
                              {field.notes && <p className="text-xs text-muted-foreground">{field.notes}</p>}
                              <Select onValueChange={(value) => handleColumnMapChange(field.key, value)} value={columnMap[field.key]}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Choisir une colonne..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="--skip--">Ignorer cette colonne</SelectItem>
                                    {fileHeaders.map(header => (
                                        <SelectItem key={header} value={header}>{header}</SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                          </div>
                      ))}
                  </div>
                </ScrollArea>
                </>
            );
        case 'preview':
             return (
                <>
                    <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
                        <FileCheck2 className="h-6 w-6 text-green-600" />
                        <div>
                            <p className="font-medium">{fileName}</p>
                            <p className="text-sm text-muted-foreground">{parsedData.length} lignes prêtes à être importées.</p>
                        </div>
                    </div>
                    <ScrollArea className="h-72 w-full">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nom</TableHead>
                                    <TableHead>Province</TableHead>
                                    <TableHead>Commune</TableHead>
                                    <TableHead>Latitude</TableHead>
                                    <TableHead>Longitude</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {parsedData.slice(0, 100).map((facility, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium">{facility.name || 'N/A'}</TableCell>
                                        <TableCell>{facility.province || 'N/A'}</TableCell>
                                        <TableCell>{facility.commune || 'N/A'}</TableCell>
                                        <TableCell>{facility.location?.lat.toFixed(4) || 'N/A'}</TableCell>
                                        <TableCell>{facility.location?.lng.toFixed(4) || 'N/A'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                         {parsedData.length > 100 && <p className="text-center text-sm text-muted-foreground mt-4">Et {parsedData.length - 100} autres lignes...</p>}
                    </ScrollArea>
                </>
            );
        case 'importing':
             return (
                <div className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-muted-foreground">Importation en cours...</p>
                </div>
            );
    }
  }

  const renderFooter = () => {
    switch (step) {
        case 'select_file':
            return (
                 <>
                    <Button variant="ghost" onClick={() => handleClose(false)}>Annuler</Button>
                 </>
            );
        case 'map_columns':
            return (
                <>
                    <Button variant="ghost" onClick={() => setStep('select_file')}>Retour</Button>
                    <Button onClick={processMappedData}>Étape suivante : Prévisualiser</Button>
                </>
            );
        case 'preview':
            return (
                <>
                    <Button variant="ghost" onClick={() => setStep('map_columns')}>Retour au mappage</Button>
                    <Button onClick={handleImport}>Importer {parsedData.length} ligne(s)</Button>
                </>
            );
        default:
            return <Button variant="ghost" onClick={() => handleClose(false)}>Fermer</Button>;
    }
  };


  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Importer des Installations depuis un CSV</DialogTitle>
          <DialogDescription>
            Suivez les étapes pour importer vos données d'installations.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erreur</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            {renderStepContent()}
        </div>

        <DialogFooter>
          {renderFooter()}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
