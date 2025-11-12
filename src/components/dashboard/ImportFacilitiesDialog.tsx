'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useFirestore, useUser } from '@/firebase';
import { collection, writeBatch, serverTimestamp, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UploadCloud, CheckCircle } from 'lucide-react';
import type { Facility, EstablishmentState, BuildingState, EquipmentState } from '@/lib/types';
import { ScrollArea } from '../ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

// Mapping from the app's data model to possible header variations in the Excel file.
// The keys are the fields in our `Facility` type.
// The values are arrays of possible header texts (case-insensitive, trimmed).
const headerMappings: { [key in keyof Partial<Facility> | 'lat' | 'lng']?: string[] } = {
    reference_region: ['reference region', 'référence région'],
    region: ['region', 'région'],
    province: ['province'],
    commune: ['commune'],
    milieu: ['milieu', 'milieu urbain - rural'],
    installations_sportives: ['installations sportives'],
    category: ['catégorie abrégée'],
    name: ["nom de l'établissement", 'nom'],
    address: ['localisation', 'adresse'],
    lng: ['longitude', 'lon'],
    lat: ['latitude', 'lat'],
    ownership: ['propriété'],
    managing_entity: ['entité gestionnaire'],
    last_renovation_date: ['date dernière rénovation'],
    surface_area: ['superficie'],
    capacity: ["capacité d'accueil"],
    staff_count: ['effectif'],
    establishment_state: ["état de l'établissement"],
    developed_space: ['espace aménagé'],
    titre_foncier_numero: ['titre foncier'],
    building_state: ['etat du bâtiment', 'état du bâtiment'],
    equipment_state: ['etat des équipements', 'état des équipements'],
    sports_staff_count: ['nombre du personnel du secteur sport affecté'],
    hr_needs: ['besoin rh'],
    rehabilitation_plan: ['prise en compte'],
    besoin_amenagement: ["besoin d'aménagement"],
    besoin_equipements: ["besoin d'équipements"],
    observations: ['observation'],
    beneficiaries: ['bénificiaires', 'beneficiaires'],
    sports: ['sports'],
};

const stateMappings = {
    establishment_state: { '1': 'Opérationnel', '2': 'En arrêt', '3': 'Prêt', '4': 'En cours de transformation', '5': 'En cours de construction' },
    building_state: { '1': 'Bon', '2': 'Moyen', '3': 'Mauvais', '4': 'Médiocre' },
    equipment_state: { '0': 'Non équipé', '1': 'Bon', '2': 'Moyen', '3': 'Mauvais', '4': 'Médiocre' }
};

const toBoolean = (value: any): boolean => {
    if (typeof value === 'boolean') return value;
    if (value === null || value === undefined) return false;
    const strValue = String(value).toLowerCase().trim();
    return ['true', 'vrai', 'oui', 'yes', '1', 'x'].includes(strValue);
};

const toFloat = (value: any): number | undefined => {
    if (value === null || value === undefined || String(value).trim() === '') return undefined;
    const strValue = String(value).replace(',', '.').trim();
    const num = parseFloat(strValue);
    return isNaN(num) ? undefined : num;
};

const toInteger = (value: any): number | undefined => {
    if (value === null || value === undefined || String(value).trim() === '') return undefined;
    const num = parseInt(String(value).trim(), 10);
    return isNaN(num) ? undefined : num;
};


interface ImportFacilitiesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ImportFacilitiesDialog({ open, onOpenChange }: ImportFacilitiesDialogProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [parsedData, setParsedData] = useState<Partial<Facility>[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setParsedData([]);
    }
  };

  const parseFile = () => {
    if (!file) {
      setError('Veuillez sélectionner un fichier.');
      return;
    }
    if (!user) {
      setError('Vous devez être connecté pour importer des données.');
      return;
    }

    setIsParsing(true);
    setError(null);
    setParsedData([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert sheet to CSV string first
        const csvData = XLSX.utils.sheet_to_csv(worksheet, { header: 1 });
        const lines = csvData.split('\n');

        if (lines.length < 2) {
          throw new Error('La feuille de calcul est vide ou ne contient que des en-têtes.');
        }

        const rawHeaders = lines[0].split(',');

        // 1. Create a map from our model field to the column index in the sheet
        const columnIndexMap: { [key: string]: number } = {};
        
        Object.entries(headerMappings).forEach(([modelField, possibleHeaders]) => {
            const normalizedPossibleHeaders = possibleHeaders.map(h => h.toLowerCase().replace(/[^a-z0-9]/gi, ''));
            
            rawHeaders.forEach((rawHeader, index) => {
                const normalizedHeader = rawHeader.toLowerCase().trim().replace(/[^a-z0-9]/gi, '');
                if (normalizedPossibleHeaders.some(h => normalizedHeader.includes(h))) {
                    if (columnIndexMap[modelField] === undefined) { // Take the first match
                        columnIndexMap[modelField] = index;
                    }
                }
            });
        });

        // 2. Process each data row using the columnIndexMap
        const facilities: Partial<Facility>[] = lines.slice(1).map(line => {
          const rowArray = line.split(',');
          let facility: Partial<Facility> & { lat?: number, lng?: number } = {};

          Object.entries(columnIndexMap).forEach(([modelField, index]) => {
            const value = rowArray[index];
            if (value === null || value === undefined || String(value).trim() === '') return;
            
            let processedValue: any = String(value).trim();
            
            const field = modelField as keyof Facility | 'lat' | 'lng';

            if (field === 'lat' || field === 'lng') {
              processedValue = toFloat(value);
            } else if (['surface_area', 'capacity', 'staff_count', 'sports_staff_count', 'beneficiaries'].includes(field)) {
              processedValue = toInteger(value);
            } else if (['hr_needs', 'besoin_amenagement', 'besoin_equipements', 'developed_space'].includes(field)) {
              processedValue = toBoolean(value);
            } else if (field === 'sports' && typeof value === 'string') {
              processedValue = value.split(/[,;]/).map(s => s.trim()).filter(Boolean);
            } else if (field === 'last_renovation_date') {
               const dateNumber = parseFloat(value);
               if (!isNaN(dateNumber) && dateNumber > 1) {
                  // It's likely an Excel date serial number
                  processedValue = XLSX.SSF.parse_date_code(dateNumber);
               } else if (!isNaN(Date.parse(value))) {
                  processedValue = new Date(value);
               } else {
                  processedValue = undefined;
               }
            } else if (Object.keys(stateMappings).includes(field)) {
                const key = field as keyof typeof stateMappings;
                const code = String(value).trim();
                if (stateMappings[key] && (stateMappings[key] as any)[code]) {
                    processedValue = (stateMappings[key] as any)[code];
                }
            }
            
            (facility as any)[modelField] = processedValue;
          });
          
          if (typeof facility.lat === 'number' && typeof facility.lng === 'number') {
             facility.location = { lat: facility.lat, lng: facility.lng };
          }
          delete facility.lat;
          delete facility.lng;

          if (!facility.name || !facility.location) {
             return null;
          }
          
          facility.adminId = user.uid;
          if (!facility.sports) facility.sports = [];

          return facility;

        }).filter((f): f is Facility => f !== null);
        
        if (facilities.length === 0) {
            throw new Error("Aucune ligne valide n'a pu être lue. Vérifiez que les colonnes 'nom de l'établissement' (ou 'nom'), 'latitude' et 'longitude' sont présentes et remplies avec des données valides.");
        }

        setParsedData(facilities);

      } catch (err: any) {
        console.error("Parsing error:", err);
        setError(`Erreur lors de l'analyse du fichier : ${err.message}`);
      } finally {
        setIsParsing(false);
      }
    };

    reader.onerror = () => {
        setError("Impossible de lire le fichier.");
        setIsParsing(false);
    };

    reader.readAsBinaryString(file);
  };

  const handleImport = async () => {
    if (parsedData.length === 0 || !firestore || !user) return;
    
    setIsImporting(true);
    try {
        const batch = writeBatch(firestore);
        const facilitiesCollectionRef = collection(firestore, 'facilities');

        parsedData.forEach(facilityData => {
            const docRef = doc(facilitiesCollectionRef); 
            const payload = {
                ...facilityData,
                sports: facilityData.sports || [],
                type: 'outdoor', // Default value
                accessible: facilityData.accessible || false,
                city: facilityData.commune || '', // Use commune as city
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };
            batch.set(docRef, payload);
        });

        await batch.commit();

        toast({
            title: 'Importation réussie',
            description: `${parsedData.length} installations ont été ajoutées à la base de données.`,
        });
        resetState();
        onOpenChange(false);
    } catch (error: any) {
        console.error("Import error:", error);
        toast({
            variant: 'destructive',
            title: 'Échec de l\'importation',
            description: error.message || 'Une erreur est survenue lors de l\'écriture dans la base de données.',
        });
    } finally {
        setIsImporting(false);
    }
  };

  const resetState = () => {
    setFile(null);
    setParsedData([]);
    setError(null);
    setIsParsing(false);
    setIsImporting(false);
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      resetState();
    }
    onOpenChange(isOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Importer des Installations depuis Excel</DialogTitle>
          <DialogDescription>
            Sélectionnez un fichier .xlsx ou .csv. Le système essaiera de faire correspondre automatiquement les colonnes.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
            {!parsedData.length ? (
                <div className="flex flex-col items-center gap-4 p-8 border-2 border-dashed rounded-lg">
                    <UploadCloud className="w-12 h-12 text-muted-foreground" />
                    <Input id="file-upload" type="file" accept=".xlsx, .csv" onChange={handleFileChange} className="w-fit" />
                    {file && <p className="text-sm text-muted-foreground">{file.name}</p>}
                    <Button onClick={parseFile} disabled={!file || isParsing}>
                        {isParsing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {isParsing ? 'Analyse en cours...' : 'Analyser le fichier'}
                    </Button>
                    {error && <p className="text-sm text-destructive mt-2 max-w-md text-center">{error}</p>}
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-lg">
                       <CheckCircle className="h-5 w-5"/>
                       <p className="font-medium text-sm">{parsedData.length} installation(s) prête(s) à être importée(s). Vérifiez les données ci-dessous.</p>
                    </div>
                    <ScrollArea className="h-72 border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nom</TableHead>
                                    <TableHead>Région</TableHead>
                                    <TableHead>Adresse</TableHead>
                                    <TableHead>Sports</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {parsedData.map((facility, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{facility.name}</TableCell>
                                        <TableCell>{facility.region}</TableCell>
                                        <TableCell>{facility.address}</TableCell>
                                        <TableCell>{facility.sports?.join(', ')}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </div>
            )}
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleImport} disabled={parsedData.length === 0 || isImporting}>
            {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isImporting ? 'Importation...' : `Importer ${parsedData.length > 0 ? parsedData.length : ''} Installation(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
