'use client';

import { useState } from 'react';
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

// Functions to safely convert data types from the parsed JSON
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

const toDate = (value: any): Date | undefined => {
    if (!value) return undefined;
    const date = new Date(value);
    return isNaN(date.getTime()) ? undefined : date;
};

// Simplified mapping of potential keys from a generic conversion API to our model
const headerMappings: { [key: string]: keyof Facility | 'lat' | 'lng' } = {
    'reference region': 'reference_region',
    'référence région': 'reference_region',
    'region': 'region',
    'région': 'region',
    'province': 'province',
    'commune': 'commune',
    'milieu urbain - rural': 'milieu',
    'installations sportives': 'installations_sportives',
    'catégorie abrégée': 'category',
    "nom de l'établissement": 'name',
    'nom': 'name',
    'localisation': 'address',
    'adresse': 'address',
    'longitude': 'lng',
    'lon': 'lng',
    'latitude': 'lat',
    'propriété': 'ownership',
    'entité gestionnaire': 'managing_entity',
    'date dernière rénovation': 'last_renovation_date',
    'superficie': 'surface_area',
    "capacité d'accueil": 'capacity',
    'effectif': 'staff_count',
    "état de l'établissement": 'establishment_state',
    'espace aménagé': 'developed_space',
    'titre foncier': 'titre_foncier_numero',
    'etat du bâtiment': 'building_state',
    'état du bâtiment': 'building_state',
    'etat des équipements': 'equipment_state',
    'état des équipements': 'equipment_state',
    'nombre du personnel du secteur sport affecté': 'sports_staff_count',
    'besoin rh': 'hr_needs',
    'prise en compte': 'rehabilitation_plan',
    "besoin d'aménagement": 'besoin_amenagement',
    "besoin d'équipements": 'besoin_equipements',
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

  const parseFile = async () => {
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

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Use a reliable external API to convert XLS/XLSX to JSON
      const response = await fetch('https://api2.docconversion.online/v1/convert/xls-to-json', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Erreur du service de conversion: ${response.statusText}`);
      }

      const jsonResult = await response.json();

      if (!jsonResult || !Array.isArray(jsonResult) || jsonResult.length === 0) {
        throw new Error('Le fichier est vide ou dans un format non reconnu par le service de conversion.');
      }

      // Now, map the clean JSON to our data model
      const facilities = jsonResult.map((rawRow: any) => {
        let facility: Partial<Facility> & { lat?: number, lng?: number } = {};
        
        for (const rawHeader in rawRow) {
            const normalizedHeader = rawHeader.toLowerCase().trim();
            
            // Find a matching key in our mappings
            const modelField = Object.keys(headerMappings).find(key => normalizedHeader.includes(key));
            
            if (modelField) {
                 const targetField = headerMappings[modelField];
                 (facility as any)[targetField] = rawRow[rawHeader];
            }
        }

        // --- Data Type Conversions ---
        facility.lat = toFloat(facility.lat);
        facility.lng = toFloat(facility.lng);

        if (facility.lat && facility.lng) {
            facility.location = { lat: facility.lat, lng: facility.lng };
        }

        facility.surface_area = toInteger(facility.surface_area);
        facility.capacity = toInteger(facility.capacity);
        facility.staff_count = toInteger(facility.staff_count);
        facility.sports_staff_count = toInteger(facility.sports_staff_count);
        facility.beneficiaries = toInteger(facility.beneficiaries);
        
        facility.hr_needs = toBoolean(facility.hr_needs);
        facility.besoin_amenagement = toBoolean(facility.besoin_amenagement);
        facility.besoin_equipements = toBoolean(facility.besoin_equipements);
        facility.developed_space = toBoolean(facility.developed_space);

        facility.last_renovation_date = toDate(facility.last_renovation_date);
        
        if (typeof facility.sports === 'string') {
            facility.sports = facility.sports.split(/[,;]/).map(s => s.trim()).filter(Boolean);
        } else {
            facility.sports = [];
        }

        // Map state fields
        Object.keys(stateMappings).forEach(key => {
            const field = key as keyof typeof stateMappings;
            const code = String(facility[field]).trim();
            if (stateMappings[field] && (stateMappings[field] as any)[code]) {
                (facility as any)[field] = (stateMappings[field] as any)[code];
            }
        });
        
        if (!facility.name || !facility.location) {
             return null;
        }
          
        facility.adminId = user.uid;

        return facility;

      }).filter((f): f is Facility => f !== null);

      if (facilities.length === 0) {
        throw new Error("Aucune ligne valide n'a pu être lue après conversion. Vérifiez que le fichier contient bien les colonnes 'nom', 'latitude', et 'longitude' avec des données valides.");
      }

      setParsedData(facilities);
    } catch (err: any) {
      console.error("Parsing error:", err);
      setError(`Erreur lors de l'analyse du fichier : ${err.message}`);
    } finally {
      setIsParsing(false);
    }
  };

  const handleImport = async () => {
    if (parsedData.length === 0 || !firestore || !user) return;
    
    setIsImporting(true);
    try {
        const batch = writeBatch(firestore);
        const facilitiesCollectionRef = collection(firestore, 'facilities');

        parsedData.forEach(facilityData => {
            const docRef = doc(facilitiesCollectionRef); 
            const { lat, lng, ...rest } = facilityData as any;
            const payload = {
                ...rest,
                location: facilityData.location,
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
          <DialogTitle>Importer des Installations depuis un Fichier</DialogTitle>
          <DialogDescription>
            Sélectionnez un fichier .xlsx ou .csv. Le système le convertira et essaiera de mapper les colonnes.
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

    