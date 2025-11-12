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


const headerMappings: { [key: string]: (keyof Facility | 'lat' | 'lng') } = {
  'reference region': 'reference_region',
  'référence région': 'reference_region',
  'region': 'region',
  'région': 'region',
  'province': 'province',
  'commune': 'commune',
  'milieu': 'milieu',
  'installations sportives': 'installations_sportives',
  'catégorie abrégée': 'category',
  'nom de l\'établissement': 'name',
  'nom': 'name',
  'localisation': 'address',
  'adresse': 'address',
  'longitude': 'lng',
  'latitude': 'lat',
  'propriété': 'ownership',
  'entité gestionnaire': 'managing_entity',
  'date dernière rénovation': 'last_renovation_date',
  'superficie': 'surface_area',
  'capacité d\'accueil': 'capacity',
  'effectif': 'staff_count',
  'état de l\'établissement': 'establishment_state',
  'espace aménagé': 'developed_space',
  'titre foncier': 'titre_foncier_numero',
  'etat du bâtiment': 'building_state',
  'etat des équipements': 'equipment_state',
  'nombre du personnel du secteur sport affecté': 'sports_staff_count',
  'besoin rh': 'hr_needs',
  'prise en compte': 'rehabilitation_plan',
  'besoin d\'aménagement': 'besoin_amenagement',
  'besoin d\'équipements': 'besoin_equipements',
  'observation': 'observations',
  'bénificiaires': 'beneficiaries',
  'beneficiaires': 'beneficiaries',
  'sports': 'sports',
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
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1, defval: "" });

        if (jsonData.length < 2) {
          throw new Error('La feuille de calcul est vide ou ne contient que des en-têtes.');
        }

        const headers: string[] = jsonData[0];
        const rows = jsonData.slice(1);
        
        const columnIndexMap: { [key in (keyof Facility | 'lat' | 'lng')]?: number } = {};

        headers.forEach((header, index) => {
            if (typeof header !== 'string') return;
            const normalizedHeader = header.trim().toLowerCase().replace(/\s\s+/g, ' ');
            for (const key in headerMappings) {
                if (normalizedHeader.includes(key)) {
                    const mappedField = headerMappings[key];
                    if (!columnIndexMap[mappedField]) {
                        columnIndexMap[mappedField] = index;
                    }
                }
            }
        });

        const facilities: Partial<Facility>[] = rows.map((rowArray: any[]) => {
          let row: Partial<Facility> & { lat?: number, lng?: number } = {};
          
          Object.entries(columnIndexMap).forEach(([field, index]) => {
              const mappedField = field as (keyof Facility | 'lat' | 'lng');
              let value = rowArray[index];
              if (value === null || value === undefined || String(value).trim() === '') return;

              if (mappedField === 'lat' || mappedField === 'lng') {
                const num = toFloat(value);
                if (num !== undefined) (row as any)[mappedField] = num;
              } else if (['surface_area', 'capacity', 'staff_count', 'sports_staff_count', 'beneficiaries'].includes(mappedField)) {
                  const num = toInteger(value);
                  if (num !== undefined) (row as any)[mappedField] = num;
              } else if (['hr_needs', 'besoin_amenagement', 'besoin_equipements', 'developed_space'].includes(mappedField)) {
                  (row as any)[mappedField] = toBoolean(value);
              } else if (mappedField === 'sports' && typeof value === 'string') {
                  row.sports = value.split(/[,;]/).map(s => s.trim()).filter(Boolean);
              } else if (mappedField === 'last_renovation_date' && (value instanceof Date || !isNaN(Date.parse(value)))) {
                  row.last_renovation_date = value instanceof Date ? value : new Date(value);
              } else if (Object.keys(stateMappings).includes(mappedField)) {
                  const key = mappedField as keyof typeof stateMappings;
                  const code = String(value).trim();
                  if (stateMappings[key] && (stateMappings[key] as any)[code]) {
                      (row as any)[key] = (stateMappings[key] as any)[code];
                  } else {
                      (row as any)[key] = String(value);
                  }
              }
              else {
                  (row as any)[mappedField] = String(value).trim();
              }
          });

          if (typeof row.lat === 'number' && typeof row.lng === 'number') {
             row.location = { lat: row.lat, lng: row.lng };
          }
          delete row.lat;
          delete row.lng;
          
          if (!row.name || !row.location) return null;
          
          row.adminId = user.uid;
          if (!row.sports) row.sports = [];

          return row;
        }).filter((f): f is Facility => f !== null && f.name !== undefined && f.location !== undefined);

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

    reader.readAsArrayBuffer(file);
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
                type: facilityData.type || 'outdoor',
                accessible: facilityData.accessible || false,
                city: facilityData.commune || '', 
                
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
