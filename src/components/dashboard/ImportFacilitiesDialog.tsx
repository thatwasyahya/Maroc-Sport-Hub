'use client';

import { useState, useCallback, useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { writeBatch, collection, serverTimestamp, doc } from 'firebase/firestore';
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
import { Loader2, FileUp, FileCheck2, AlertCircle, RefreshCw } from 'lucide-react';
import Papa from 'papaparse';
import { ScrollArea } from '../ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import type { Facility } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

interface ImportFacilitiesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const dbFields: { key: keyof Facility | 'latitude' | 'longitude', label: string, notes?: string, required?: boolean, keywords: string[] }[] = [
    { key: 'name', label: 'Nom de l\'établissement', required: true, keywords: ['nom_de_letablissement', 'nom'] },
    { key: 'latitude', label: 'Latitude', required: true, keywords: ['latitude'] },
    { key: 'longitude', label: 'Longitude', required: true, keywords: ['longitude'] },
    { key: 'region', label: 'Région', keywords: ['region'] },
    { key: 'province', label: 'Province', keywords: ['province'] },
    { key: 'commune', label: 'Commune', keywords: ['commune'] },
    { key: 'milieu', label: 'Milieu (Urbain/Rural)', keywords: ['milieu_urbain___rural', 'milieu'] },
    { key: 'installations_sportives', label: 'Type d\'installation', keywords: ['installations_sportives'] },
    { key: 'categorie_abregee', label: 'Catégorie abrégée', keywords: ['categorie_abregee'] },
    { key: 'address', label: 'Adresse/Localisation', keywords: ['localisation', 'adresse'] },
    { key: 'ownership', label: 'Propriété', keywords: ['propriete'] },
    { key: 'managing_entity', label: 'Entité gestionnaire', keywords: ['entite_gestionnaire'] },
    { key: 'last_renovation_date', label: 'Date dernière rénovation', notes: 'Format AAAA-MM-JJ', keywords: ['date_derniere_renovation'] },
    { key: 'surface_area', label: 'Superficie (m²)', notes: 'Numérique', keywords: ['superficie'] },
    { key: 'capacity', label: 'Capacité d\'accueil', notes: 'Numérique', keywords: ['capacite_daccueil', 'capacite'] },
    { key: 'staff_count', label: 'Effectif total', notes: 'Numérique', keywords: ['effectif'] },
    { key: 'establishment_state', label: 'État de l\'établissement', keywords: ['etat_de_letablissement'] },
    { key: 'developed_space', label: 'Espace aménagé', notes: 'Booléen (oui/non)', keywords: ['espace_amenage'] },
    { key: 'titre_foncier_numero', label: 'N° Titre Foncier', keywords: ['titre_foncier_n'] },
    { key: 'building_state', label: 'État du bâtiment', keywords: ['etat_du_batiment'] },
    { key: 'equipment_state', label: 'État des équipements', keywords: ['etat_des_equipements'] },
    { key: 'sports_staff_count', label: 'Personnel du secteur sport', notes: 'Numérique', keywords: ['nombre_du_personnel_du_secteur_sport_affecte'] },
    { key: 'hr_needs', label: 'Besoin en RH', notes: 'Booléen (oui/non)', keywords: ['besoin__rh'] },
    { key: 'besoin_amenagement', label: 'Besoin d\'aménagement', notes: 'Booléen (oui/non)', keywords: ['besoin_damenagement'] },
    { key: 'besoin_equipements', label: 'Besoin d\'équipements', notes: 'Booléen (oui/non)', keywords: ['besoin_dequipements'] },
    { key: 'observations', label: 'Observations', keywords: ['observation_sur__les_mesures'] },
    { key: 'beneficiaries', label: 'Bénéficiaires', notes: 'Numérique', keywords: ['benificiares', 'beneficiaires'] },
];

const cleanColumnName = (col: string): string => {
    if (!col) return '';
    return col.trim().toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
        .replace(/[^a-z0-9_]/g, '_') // Replace non-alphanumeric with underscore
        .replace(/_+/g, '_'); // Replace multiple underscores with a single one
};


export default function ImportFacilitiesDialog({ open, onOpenChange }: ImportFacilitiesDialogProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [fileData, setFileData] = useState<any[]>([]);
  
  const [columnMap, setColumnMap] = useState<Record<string, string>>({});
  const [parsedData, setParsedData] = useState<Partial<Facility>[]>([]);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview'>('upload');

  const resetState = useCallback(() => {
    setFile(null);
    setFileHeaders([]);
    setFileData([]);
    setColumnMap({});
    setParsedData([]);
    setIsProcessing(false);
    setError(null);
    setStep('upload');
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
        resetState();
        return;
    };
     if (!selectedFile.name.endsWith('.csv')) {
      setError('Veuillez sélectionner un fichier au format .csv');
      setFile(null);
      return;
    }
    setFile(selectedFile);
  };
  
 useEffect(() => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const text = e.target?.result as string;
            Papa.parse(text, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    if (results.errors.length) {
                        setError(`Erreur lors de la lecture du CSV : ${results.errors[0].message}`);
                        return;
                    }
                    if (!results.meta.fields || results.meta.fields.length === 0) {
                        setError("Le fichier CSV est vide ou les en-têtes sont manquants.");
                        return;
                    }
                    const originalHeaders = results.meta.fields;
                    setFileHeaders(originalHeaders);
                    setFileData(results.data);

                    const newColumnMap: Record<string, string> = {};
                    const cleanedFileHeaders = originalHeaders.map(h => ({ original: h, cleaned: cleanColumnName(h) }));

                    for (const dbField of dbFields) {
                        const foundHeader = cleanedFileHeaders.find(header => 
                            dbField.keywords.some(kw => header.cleaned.includes(kw))
                        );
                        if (foundHeader) {
                            newColumnMap[dbField.key] = foundHeader.original;
                        }
                    }
                    setColumnMap(newColumnMap);
                    setStep('mapping');
                },
                error: (err: any) => {
                    setError(`Erreur PapaParse : ${err.message}`);
                }
            });
        } catch (err: any) {
            setError(`Une erreur inattendue est survenue: ${err.message}`);
        }
    };
    reader.readAsText(file, 'ISO-8859-1');
  }, [file]);

  const toBoolean = (value: any): boolean => {
    if (typeof value === 'string') {
        const lowerValue = value.trim().toLowerCase();
        return ['oui', 'yes', 'true', '1'].includes(lowerValue);
    }
    return !!value;
  }
  
  const processData = () => {
    if (!user) {
      setError('Vous devez être connecté pour importer des données.');
      return;
    }

    const requiredMappingsMet = dbFields.filter(f => f.required).every(field => columnMap[field.key] && columnMap[field.key] !== 'ignore_column');
    if (!requiredMappingsMet) {
        setError("Le mappage des champs obligatoires (Nom, Latitude, Longitude) est requis.");
        return;
    }
    
    setError(null);

    const facilities: Partial<Facility>[] = fileData.map((row) => {
      let facilityData: Partial<any> = { adminId: user.uid, sports: [], equipments: [] };
      
      for (const dbField of dbFields) {
          const fileHeader = columnMap[dbField.key];
          if (fileHeader && columnMap[dbField.key] !== 'ignore_column' && row[fileHeader] !== undefined && row[fileHeader] !== null) {
             const value = row[fileHeader];
             if (typeof value === 'string' && value.trim() === '') continue;
             facilityData[dbField.key] = value;
          }
      }
      
      // Use 'installations_sportives' as a fallback for 'name'
      let name = facilityData.name ? String(facilityData.name).trim() : null;
      if (!name && facilityData.installations_sportives) {
        name = String(facilityData.installations_sportives).trim();
      }

      const latString = String(facilityData.latitude || '').replace(',', '.').trim();
      const lngString = String(facilityData.longitude || '').replace(',', '.').trim();
      
      const lat = parseFloat(latString);
      const lng = parseFloat(lngString);
      
      if (name && !isNaN(lat) && !isNaN(lng)) {
        return {
          ...facilityData,
          name,
          location: { lat, lng },
          surface_area: facilityData.surface_area ? parseFloat(String(facilityData.surface_area).replace(',', '.')) : undefined,
          capacity: facilityData.capacity ? parseInt(String(facilityData.capacity), 10) : undefined,
          staff_count: facilityData.staff_count ? parseInt(String(facilityData.staff_count), 10) : undefined,
          sports_staff_count: facilityData.sports_staff_count ? parseInt(String(facilityData.sports_staff_count), 10) : undefined,
          beneficiaries: facilityData.beneficiaries ? parseInt(String(facilityData.beneficiaries), 10) : undefined,
          hr_needs: toBoolean(facilityData.hr_needs),
          besoin_amenagement: toBoolean(facilityData.besoin_amenagement),
          besoin_equipements: toBoolean(facilityData.besoin_equipements),
          developed_space: toBoolean(facilityData.developed_space),
          sports: [], // Default to empty array, can be populated later
          equipments: [], // Default to empty array
        };
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
  
  const handleImport = () => {
    if (parsedData.length === 0) {
        setError('Aucune donnée à importer.');
        return;
    }
    setIsProcessing(true);
    const batch = writeBatch(firestore);
    parsedData.forEach(facilityData => {
        const docRef = doc(collection(firestore, 'facilities'));
        batch.set(docRef, {
            ...facilityData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
    });

    batch.commit()
      .then(() => {
          toast({
              title: "Importation réussie",
              description: `${parsedData.length} installations ont été importées avec succès.`,
          });
          onOpenChange(false);
      })
      .catch((error: any) => {
          setError(`Erreur lors de l'importation : ${error.message}`);
      })
      .finally(() => {
          setIsProcessing(false);
      });
  }

  const renderUploadStep = () => (
    <div className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center">
        <FileUp className="h-10 w-10 text-muted-foreground" />
        <h3 className="text-lg font-semibold">Télécharger un fichier CSV</h3>
        <p className="text-sm text-muted-foreground">Cliquez sur le bouton pour sélectionner un fichier .csv depuis votre ordinateur. Assurez-vous que le fichier est encodé en UTF-8 ou ISO-8859-1.</p>
        <Button type="button" variant="outline" onClick={() => document.getElementById('csv-input')?.click()}>
          Sélectionner un fichier
        </Button>
        <input type="file" id="csv-input" onChange={handleFileChange} accept=".csv" className="hidden" />
    </div>
  );

  const renderMappingStep = () => (
    <>
      <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/50 p-3 mb-4">
        <div className='flex items-center gap-3'>
            <FileCheck2 className="h-6 w-6 text-green-600" />
            <div>
                <p className="font-medium">{file?.name}</p>
                <p className="text-sm text-muted-foreground">Fichier prêt. Veuillez mapper les colonnes ci-dessous.</p>
            </div>
        </div>
        <Button variant="ghost" size="icon" onClick={resetState}><RefreshCw className="h-4 w-4" /></Button>
      </div>
      <ScrollArea className="h-96">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 p-1">
            {dbFields.map(field => (
                <div key={field.key} className="space-y-1">
                    <label className="font-medium text-sm">
                        {field.label}
                        {field.required && <span className="text-destructive ml-1">*</span>}
                    </label>
                    {field.notes && <p className="text-xs text-muted-foreground">{field.notes}</p>}
                    <Select onValueChange={(value) => setColumnMap(prev => ({...prev, [field.key]: value}))} value={columnMap[field.key] || ''}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir une colonne..." />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="ignore_column">-- Ignorer --</SelectItem>
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

  const renderPreviewStep = () => (
     <>
        <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/50 p-3 mb-4">
            <div className='flex items-center gap-3'>
                <FileCheck2 className="h-6 w-6 text-green-600" />
                <div>
                    <p className="font-medium">Aperçu de l'importation</p>
                    <p className="text-sm text-muted-foreground">{parsedData.length} lignes seront importées.</p>
                </div>
            </div>
        </div>
        <ScrollArea className="h-96">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead>Région</TableHead>
                        <TableHead>Province</TableHead>
                        <TableHead>Latitude</TableHead>
                        <TableHead>Longitude</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {parsedData.slice(0, 10).map((facility, index) => (
                        <TableRow key={index}>
                            <TableCell>{facility.name}</TableCell>
                            <TableCell>{facility.region}</TableCell>
                            <TableCell>{facility.province}</TableCell>
                            <TableCell>{facility.location?.lat}</TableCell>
                            <TableCell>{facility.location?.lng}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
             {parsedData.length > 10 && <p className="text-sm text-center text-muted-foreground mt-2">Et {parsedData.length - 10} autres lignes...</p>}
        </ScrollArea>
     </>
  );

  const renderContent = () => {
    if (step === 'mapping') return renderMappingStep();
    if (step === 'preview') return renderPreviewStep();
    return renderUploadStep();
  };
  
  const requiredMappingsMet = dbFields.filter(f => f.required).every(field => columnMap[field.key] && columnMap[field.key] !== 'ignore_column');

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) resetState(); onOpenChange(isOpen); }}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Importer des Installations depuis un CSV</DialogTitle>
          <DialogDescription>
            Étape {step === 'upload' ? 1 : step === 'mapping' ? 2 : 3} sur 3: {
                step === 'upload' ? 'Sélectionnez un fichier.' :
                step === 'mapping' ? 'Mappez les colonnes.' :
                'Prévisualisez et importez.'
            }
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
            {renderContent()}
        </div>

        <DialogFooter>
          {step !== 'upload' && <Button variant="outline" onClick={() => setStep(step === 'preview' ? 'mapping' : 'upload')}>Précédent</Button>}
          <Button variant="ghost" onClick={() => { onOpenChange(false); resetState(); }}>Annuler</Button>
          {step === 'mapping' && 
            <Button onClick={processData} disabled={!requiredMappingsMet}>
                Étape suivante : Prévisualiser
            </Button>
          }
          {step === 'preview' &&
             <Button onClick={handleImport} disabled={isProcessing}>
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isProcessing ? 'Importation...' : `Importer ${parsedData.length} Lignes`}
            </Button>
          }
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
