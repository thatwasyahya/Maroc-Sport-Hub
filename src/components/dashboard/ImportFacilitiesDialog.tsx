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
    { key: 'name', label: 'Nom de l\'établissement', required: true, keywords: ['nom', 'name', 'etablissement', 'installation', 'facility'] },
    { key: 'latitude', label: 'Latitude', required: true, keywords: ['latitude', 'lat', 'y', 'coord_y'] },
    { key: 'longitude', label: 'Longitude', required: true, keywords: ['longitude', 'lon', 'lng', 'long', 'x', 'coord_x'] },
    { key: 'region', label: 'Région', keywords: ['region', 'reg'] },
    { key: 'province', label: 'Province', keywords: ['province', 'prov'] },
    { key: 'commune', label: 'Commune', keywords: ['commune', 'com'] },
    { key: 'milieu', label: 'Milieu (Urbain/Rural)', keywords: ['milieu', 'environnement', 'urban', 'rural'] },
    { key: 'installations_sportives', label: 'Type d\'installation', keywords: ['installation', 'type', 'sportive', 'sport'] },
    { key: 'categorie_abregee', label: 'Catégorie abrégée', keywords: ['categorie', 'cat', 'abreg'] },
    { key: 'address', label: 'Adresse/Localisation', keywords: ['adresse', 'address', 'localisation', 'location', 'lieu'] },
    { key: 'ownership', label: 'Propriété', keywords: ['propriete', 'property', 'owner', 'proprietaire'] },
    { key: 'managing_entity', label: 'Entité gestionnaire', keywords: ['entite', 'gestionnaire', 'gestion', 'management', 'manager'] },
    { key: 'last_renovation_date', label: 'Date dernière rénovation', notes: 'Format AAAA-MM-JJ', keywords: ['renovation', 'date', 'derniere', 'last'] },
    { key: 'surface_area', label: 'Superficie (m²)', notes: 'Numérique', keywords: ['superficie', 'surface', 'area', 'taille', 'size'] },
    { key: 'capacity', label: 'Capacité d\'accueil', notes: 'Numérique', keywords: ['capacite', 'capacity', 'accueil', 'places'] },
    { key: 'staff_count', label: 'Effectif total', notes: 'Numérique', keywords: ['effectif', 'staff', 'personnel', 'employees'] },
    { key: 'establishment_state', label: 'État de l\'établissement', keywords: ['etat', 'state', 'etablissement', 'condition'] },
    { key: 'developed_space', label: 'Espace aménagé', notes: 'Booléen (oui/non)', keywords: ['espace', 'amenage', 'developed', 'space'] },
    { key: 'titre_foncier_numero', label: 'N° Titre Foncier', keywords: ['titre', 'foncier', 'numero', 'number', 'land'] },
    { key: 'building_state', label: 'État du bâtiment', keywords: ['batiment', 'building', 'etat', 'state', 'construction'] },
    { key: 'equipment_state', label: 'État des équipements', keywords: ['equipement', 'equipment', 'etat', 'materiel'] },
    { key: 'sports_staff_count', label: 'Personnel du secteur sport', notes: 'Numérique', keywords: ['personnel', 'sport', 'secteur', 'nombre'] },
    { key: 'hr_needs', label: 'Besoin en RH', notes: 'Booléen (oui/non)', keywords: ['besoin', 'rh', 'ressources', 'humaines', 'hr', 'need'] },
    { key: 'besoin_amenagement', label: 'Besoin d\'aménagement', notes: 'Booléen (oui/non)', keywords: ['besoin', 'amenagement', 'development', 'need'] },
    { key: 'besoin_equipements', label: 'Besoin d\'équipements', notes: 'Booléen (oui/non)', keywords: ['besoin', 'equipement', 'equipment', 'need'] },
    { key: 'observations', label: 'Observations', keywords: ['observation', 'remarque', 'comment', 'note'] },
    { key: 'beneficiaries', label: 'Bénéficiaires', keywords: ['beneficiaire', 'beneficiary', 'users', 'utilisateurs'] },
];

const cleanColumnName = (col: string): string => {
    if (!col) return '';
    return col.trim().toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
        .replace(/['']/g, '') // Remove apostrophes
        .replace(/[^a-z0-9]/g, '_') // Replace non-alphanumeric with underscore
        .replace(/_+/g, '_') // Replace multiple underscores with a single one
        .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
};

const findBestMatch = (cleanedHeader: string, keywords: string[]): number => {
    let maxScore = 0;
    for (const keyword of keywords) {
        const cleanedKeyword = cleanColumnName(keyword);
        if (cleanedHeader === cleanedKeyword) {
            return 100; // Exact match
        }
        if (cleanedHeader.includes(cleanedKeyword) || cleanedKeyword.includes(cleanedHeader)) {
            const score = Math.max(
                cleanedKeyword.length / cleanedHeader.length,
                cleanedHeader.length / cleanedKeyword.length
            ) * 80;
            maxScore = Math.max(maxScore, score);
        }
    }
    return maxScore;
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
                    const usedHeaders = new Set<string>();

                    // Premier passage : correspondances exactes ou très fortes
                    for (const dbField of dbFields) {
                        let bestMatch = { header: '', score: 0 };
                        for (const header of cleanedFileHeaders) {
                            if (usedHeaders.has(header.original)) continue;
                            const score = findBestMatch(header.cleaned, dbField.keywords);
                            if (score > bestMatch.score) {
                                bestMatch = { header: header.original, score };
                            }
                        }
                        if (bestMatch.score >= 60) { // Seuil de confiance à 60%
                            newColumnMap[dbField.key] = bestMatch.header;
                            usedHeaders.add(bestMatch.header);
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
        return ['oui', 'yes', 'true', '1', 'vrai'].includes(lowerValue);
    }
    return !!value;
  }
  
  const processData = () => {
    if (!user) {
      setError('Vous devez être connecté pour importer des données.');
      return;
    }
    
    setError(null);

    const facilities: Partial<Facility>[] = fileData.map((row) => {
        let facilityData: Partial<any> = { adminId: user.uid, sports: [], equipments: [] };
        
        for (const dbField of dbFields) {
            const fileHeader = columnMap[dbField.key];
            if (fileHeader && columnMap[dbField.key] !== 'ignore_column' && row[fileHeader] !== undefined && row[fileHeader] !== null) {
               let value = row[fileHeader];
               if (typeof value === 'string' && value.trim() === '') continue;
               
               // Type conversion
               switch(dbField.key) {
                   case 'surface_area':
                   case 'capacity':
                   case 'staff_count':
                   case 'sports_staff_count':
                   case 'beneficiaries':
                       value = parseFloat(String(value).replace(',', '.'));
                       break;
                   case 'hr_needs':
                   case 'besoin_amenagement':
                   case 'besoin_equipements':
                   case 'developed_space':
                       value = toBoolean(value);
                       break;
                   case 'last_renovation_date':
                       const date = new Date(value);
                       if (isNaN(date.getTime())) continue; // Skip invalid date
                       value = date;
                       break;
               }
               facilityData[dbField.key] = value;
            }
        }
        
        const name = facilityData.name || facilityData.installations_sportives;
  
        const latString = String(row[columnMap['latitude']] || '').replace(',', '.').trim();
        const lngString = String(row[columnMap['longitude']] || '').replace(',', '.').trim();
        
        const lat = parseFloat(latString);
        const lng = parseFloat(lngString);
        
        if (name) {
            const finalData: Partial<Facility> = { ...facilityData, name };
            
            if (!isNaN(lat) && !isNaN(lng)) {
                finalData.location = { lat, lng };
            }
            
            delete (finalData as any).latitude;
            delete (finalData as any).longitude;
            
            return finalData;
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

        // Sanitize the object before sending to Firestore
        const sanitizedData = Object.fromEntries(
            Object.entries(facilityData).filter(([key, v]) => v !== undefined && v !== null && (typeof v !== 'number' || !isNaN(v)))
        );

        batch.set(docRef, {
            ...sanitizedData,
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
          resetState();
      })
      .catch((error: any) => {
          console.error("Firestore batch commit error: ", error);
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

  const renderMappingStep = () => {
    const mappedCount = Object.values(columnMap).filter(v => v && v !== 'ignore_column').length;
    const requiredMapped = dbFields.filter(f => f.required).every(f => columnMap[f.key] && columnMap[f.key] !== 'ignore_column');
    
    return (
    <>
      <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/50 p-3 mb-4">
        <div className='flex items-center gap-3'>
            <FileCheck2 className="h-6 w-6 text-green-600" />
            <div>
                <p className="font-medium">{file?.name}</p>
                <p className="text-sm text-muted-foreground">
                  {mappedCount} colonne(s) mappée(s) • {fileData.length} ligne(s) détectée(s)
                  {!requiredMapped && <span className="text-destructive ml-2">⚠️ Champs requis manquants</span>}
                </p>
            </div>
        </div>
        <Button variant="ghost" size="icon" onClick={resetState}><RefreshCw className="h-4 w-4" /></Button>
      </div>
      <ScrollArea className="h-96">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 p-1">
            {dbFields.map(field => {
              const isMapped = columnMap[field.key] && columnMap[field.key] !== 'ignore_column';
              return (
                <div key={field.key} className="space-y-1">
                    <label className="font-medium text-sm flex items-center gap-2">
                        {field.label}
                        {field.required && <span className="text-destructive">*</span>}
                        {isMapped && <span className="text-xs text-green-600">✓</span>}
                    </label>
                    {field.notes && <p className="text-xs text-muted-foreground">{field.notes}</p>}
                    <Select onValueChange={(value) => setColumnMap(prev => ({...prev, [field.key]: value}))} value={columnMap[field.key] || ''}>
                      <SelectTrigger className={field.required && !isMapped ? 'border-destructive' : ''}>
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
              );
            })}
        </div>
      </ScrollArea>
    </>
  );
};

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
                            <TableCell>{facility.location?.lat || 'N/A'}</TableCell>
                            <TableCell>{facility.location?.lng || 'N/A'}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
             {parsedData.length > 10 && <p className="text-sm text-center text-muted-foreground mt-2">Et {parsedData.length - 10} autres lignes...</p>}
        </ScrollArea>
     </>
  );

  const renderContent = () => {
    switch(step) {
        case 'mapping': return renderMappingStep();
        case 'preview': return renderPreviewStep();
        case 'upload':
        default:
            return renderUploadStep();
    }
  };
  
  const requiredMappingsMet = dbFields.filter(f => f.required).every(field => columnMap[field.key] && columnMap[field.key] !== 'ignore_column');

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) resetState(); onOpenChange(isOpen); }}>
      <DialogContent className="w-[95vw] sm:max-w-4xl max-h-[90vh] flex flex-col">
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
        
        <div className="flex-1 overflow-auto space-y-4 py-4">
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erreur</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            {renderContent()}
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="ghost" onClick={() => { onOpenChange(false); }}>Annuler</Button>
          {step === 'upload' && !file &&
            <Button onClick={() => document.getElementById('csv-input')?.click()}>Sélectionner un fichier</Button>
          }
          {step === 'mapping' && 
            <>
              <Button variant="outline" onClick={() => setStep('upload')}>Précédent</Button>
              <Button onClick={processData}>
                  Étape Suivante : Prévisualiser
              </Button>
            </>
          }
          {step === 'preview' &&
            <>
              <Button variant="outline" onClick={() => setStep('mapping')}>Précédent</Button>
              <Button onClick={handleImport} disabled={isProcessing}>
                  {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isProcessing ? 'Importation...' : `Importer ${parsedData.length} Lignes`}
              </Button>
            </>
          }
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
