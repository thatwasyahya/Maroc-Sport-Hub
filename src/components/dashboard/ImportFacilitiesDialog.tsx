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
        .replace(/[''`]/g, '') // Remove apostrophes and backticks
        .replace(/[^a-z0-9]/g, '_') // Replace non-alphanumeric with underscore
        .replace(/_+/g, '_') // Replace multiple underscores with a single one
        .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
};

const findBestMatch = (cleanedHeader: string, keywords: string[]): number => {
    let maxScore = 0;
    
    for (const keyword of keywords) {
        const cleanedKeyword = cleanColumnName(keyword);
        
        // Exact match - highest priority
        if (cleanedHeader === cleanedKeyword) {
            return 100;
        }
        
        // Check if one contains the other
        if (cleanedHeader.includes(cleanedKeyword)) {
            const score = (cleanedKeyword.length / cleanedHeader.length) * 90;
            maxScore = Math.max(maxScore, score);
        } else if (cleanedKeyword.includes(cleanedHeader)) {
            const score = (cleanedHeader.length / cleanedKeyword.length) * 85;
            maxScore = Math.max(maxScore, score);
        }
        
        // Check for word boundaries (better for compound words)
        const headerWords = cleanedHeader.split('_');
        const keywordWords = cleanedKeyword.split('_');
        
        let matchingWords = 0;
        for (const hw of headerWords) {
            for (const kw of keywordWords) {
                if (hw === kw || hw.includes(kw) || kw.includes(hw)) {
                    matchingWords++;
                    break;
                }
            }
        }
        
        if (matchingWords > 0) {
            const wordScore = (matchingWords / Math.max(headerWords.length, keywordWords.length)) * 75;
            maxScore = Math.max(maxScore, wordScore);
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
            
            // Détection automatique de l'encodage et du délimiteur
            const detectDelimiter = (sample: string): string => {
                const delimiters = [',', ';', '\t', '|'];
                const counts = delimiters.map(d => (sample.match(new RegExp(`\\${d}`, 'g')) || []).length);
                const maxIndex = counts.indexOf(Math.max(...counts));
                return delimiters[maxIndex];
            };
            
            const firstLines = text.split('\n').slice(0, 3).join('\n');
            const delimiter = detectDelimiter(firstLines);
            
            Papa.parse(text, {
                header: true,
                skipEmptyLines: 'greedy', // Skip lines with all empty values
                delimiter: delimiter,
                transformHeader: (header: string) => header.trim(), // Clean headers
                transform: (value: string) => value.trim(), // Clean values
                complete: (results) => {
                    if (results.errors.length > 0) {
                        // Filter out non-critical errors
                        const criticalErrors = results.errors.filter(e => e.type !== 'Quotes');
                        if (criticalErrors.length > 0) {
                            setError(`Erreur lors de la lecture du CSV : ${criticalErrors[0].message}`);
                            return;
                        }
                    }
                    
                    if (!results.meta.fields || results.meta.fields.length === 0) {
                        setError("Le fichier CSV est vide ou les en-têtes sont manquants.");
                        return;
                    }
                    
                    // Filter out empty headers
                    const originalHeaders = results.meta.fields.filter(h => h && h.trim() !== '');
                    
                    // Filter out completely empty rows
                    const validData = results.data.filter((row: any) => {
                        return Object.values(row).some(v => v !== null && v !== undefined && String(v).trim() !== '');
                    });
                    
                    if (validData.length === 0) {
                        setError("Aucune donnée valide trouvée dans le fichier CSV.");
                        return;
                    }
                    
                    setFileHeaders(originalHeaders);
                    setFileData(validData);

                    const newColumnMap: Record<string, string> = {};
                    const cleanedFileHeaders = originalHeaders.map(h => ({ original: h, cleaned: cleanColumnName(h) }));
                    const usedHeaders = new Set<string>();

                    // Tri des champs par priorité (required first)
                    const sortedDbFields = [...dbFields].sort((a, b) => {
                        if (a.required && !b.required) return -1;
                        if (!a.required && b.required) return 1;
                        return 0;
                    });

                    // Premier passage : correspondances exactes ou très fortes
                    for (const dbField of sortedDbFields) {
                        let bestMatch = { header: '', score: 0 };
                        for (const header of cleanedFileHeaders) {
                            if (usedHeaders.has(header.original)) continue;
                            const score = findBestMatch(header.cleaned, dbField.keywords);
                            if (score > bestMatch.score) {
                                bestMatch = { header: header.original, score };
                            }
                        }
                        if (bestMatch.score >= 50) { // Seuil de confiance abaissé à 50%
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
    
    // Essayer plusieurs encodages
    reader.onerror = () => {
        setError("Erreur de lecture du fichier. Vérifiez l'encodage du fichier.");
    };
    
    // Essayer UTF-8 d'abord, puis ISO-8859-1
    reader.readAsText(file, 'UTF-8');
  }, [file]);

  const toBoolean = (value: any): boolean => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') {
        const lowerValue = value.trim().toLowerCase();
        return ['oui', 'yes', 'true', '1', 'vrai', 'o', 'y'].includes(lowerValue);
    }
    return !!value;
  }
  
  const parseNumber = (value: any): number | undefined => {
    if (value === null || value === undefined || value === '') return undefined;
    if (typeof value === 'number') return isNaN(value) ? undefined : value;
    
    const str = String(value).trim()
        .replace(/\s/g, '') // Remove spaces
        .replace(/,/g, '.'); // Replace comma with dot
    
    const num = parseFloat(str);
    return isNaN(num) ? undefined : num;
  }
  
  const parseDate = (value: any): Date | undefined => {
    if (!value) return undefined;
    
    const date = new Date(value);
    if (!isNaN(date.getTime())) return date;
    
    // Try parsing different date formats
    const formats = [
        /(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
        /(\d{2})\/(\d{2})\/(\d{4})/, // DD/MM/YYYY
        /(\d{2})-(\d{2})-(\d{4})/, // DD-MM-YYYY
    ];
    
    const str = String(value).trim();
    for (const format of formats) {
        const match = str.match(format);
        if (match) {
            if (format.toString().includes('(\\d{4})')) {
                // YYYY-MM-DD
                const date = new Date(match[1] + '-' + match[2] + '-' + match[3]);
                if (!isNaN(date.getTime())) return date;
            } else {
                // DD/MM/YYYY or DD-MM-YYYY
                const date = new Date(match[3] + '-' + match[2] + '-' + match[1]);
                if (!isNaN(date.getTime())) return date;
            }
        }
    }
    
    return undefined;
  }
  
  const processData = () => {
    if (!user) {
      setError('Vous devez être connecté pour importer des données.');
      return;
    }
    
    setError(null);
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    const facilities: Partial<Facility>[] = fileData.map((row, index) => {
        try {
            let facilityData: Partial<any> = { 
                adminId: user.uid, 
                sports: [], 
                equipments: [] 
            };
            
            for (const dbField of dbFields) {
                const fileHeader = columnMap[dbField.key];
                if (!fileHeader || columnMap[dbField.key] === 'ignore_column') continue;
                
                let value = row[fileHeader];
                
                // Skip empty values
                if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
                    continue;
                }
                
                // Type conversion with better error handling
                try {
                    switch(dbField.key) {
                        case 'surface_area':
                        case 'capacity':
                        case 'staff_count':
                        case 'sports_staff_count':
                        case 'beneficiaries':
                            const numValue = parseNumber(value);
                            if (numValue !== undefined) {
                                facilityData[dbField.key] = numValue;
                            }
                            break;
                            
                        case 'hr_needs':
                        case 'besoin_amenagement':
                        case 'besoin_equipements':
                        case 'developed_space':
                            facilityData[dbField.key] = toBoolean(value);
                            break;
                            
                        case 'last_renovation_date':
                            const dateValue = parseDate(value);
                            if (dateValue) {
                                facilityData[dbField.key] = dateValue;
                            }
                            break;
                            
                        default:
                            // String fields - trim whitespace
                            facilityData[dbField.key] = typeof value === 'string' ? value.trim() : value;
                            break;
                    }
                } catch (conversionError) {
                    console.warn(`Erreur conversion ligne ${index + 2}, champ ${dbField.key}:`, conversionError);
                }
            }
            
            // Extract name - prioritize name field, fallback to installations_sportives
            const name = (facilityData.name || facilityData.installations_sportives || '').trim();
            
            // Extract and parse coordinates with better error handling
            let lat: number | undefined;
            let lng: number | undefined;
            
            if (columnMap['latitude'] && row[columnMap['latitude']]) {
                lat = parseNumber(row[columnMap['latitude']]);
            }
            
            if (columnMap['longitude'] && row[columnMap['longitude']]) {
                lng = parseNumber(row[columnMap['longitude']]);
            }
            
            // Validate required fields
            if (!name) {
                errors.push(`Ligne ${index + 2}: Nom manquant`);
                errorCount++;
                return null;
            }
            
            const finalData: Partial<Facility> = { ...facilityData, name };
            
            // Add location if valid coordinates
            if (lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng)) {
                // Validate coordinate ranges
                if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                    finalData.location = { lat, lng };
                } else {
                    errors.push(`Ligne ${index + 2}: Coordonnées invalides (lat: ${lat}, lng: ${lng})`);
                }
            }
            
            // Clean up temporary latitude/longitude fields
            delete (finalData as any).latitude;
            delete (finalData as any).longitude;
            
            successCount++;
            return finalData;
        } catch (rowError: any) {
            errorCount++;
            errors.push(`Ligne ${index + 2}: ${rowError.message}`);
            return null;
        }
    }).filter((f): f is Partial<Facility> => f !== null);

    if (facilities.length === 0) {
      setError(`Aucune ligne valide n'a pu être traitée. ${errors.slice(0, 5).join(', ')}`);
      return;
    }
    
    if (errors.length > 0 && errors.length < 10) {
        toast({
            title: "Avertissement",
            description: `${successCount} lignes traitées, ${errorCount} ignorées. ${errors.slice(0, 3).join('; ')}`,
            variant: "default",
        });
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
      <DialogContent className="w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-hidden p-0">
        <div className="flex flex-col max-h-[90vh]">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle>Importer des Installations depuis un CSV</DialogTitle>
            <DialogDescription>
              Étape {step === 'upload' ? 1 : step === 'mapping' ? 2 : 3} sur 3: {
                  step === 'upload' ? 'Sélectionnez un fichier.' :
                  step === 'mapping' ? 'Mappez les colonnes.' :
                  'Prévisualisez et importez.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="overflow-y-auto px-6 pb-4">
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erreur</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            {renderContent()}
        </div>

        <DialogFooter className="px-6 py-4 border-t">
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
