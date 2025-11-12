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
import { useFirestore, useUser } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Upload, File, Loader2, CheckCircle, AlertTriangle, ArrowRight, X } from 'lucide-react';
import type { Facility } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { ScrollArea } from '../ui/scroll-area';

type ImportStep = 'upload' | 'mapping' | 'preview' | 'importing' | 'finished';

const REQUIRED_FIELDS = ['name', 'location.lat', 'location.lng'];

const DB_FIELDS: { key: keyof Facility | string, label: string, required?: boolean, notes?: string }[] = [
    { key: 'name', label: 'Nom de l\'établissement', required: true },
    { key: 'location.lat', label: 'Latitude', required: true, notes: 'Coordonnée numérique' },
    { key: 'location.lng', label: 'Longitude', required: true, notes: 'Coordonnée numérique' },
    { key: 'region', label: 'Région' },
    { key: 'province', label: 'Province' },
    { key: 'commune', label: 'Commune' },
    { key: 'address', label: 'Adresse' },
    { key: 'milieu', label: 'Milieu (Urbain/Rural)' },
    { key: 'installations_sportives', label: 'Type d\'installation' },
    { key: 'categorie_abregee', label: 'Catégorie abrégée' },
    { key: 'ownership', label: 'Propriété' },
    { key: 'managing_entity', label: 'Entité gestionnaire' },
    { key: 'last_renovation_date', label: 'Date dernière rénovation', notes: 'Format date' },
    { key: 'surface_area', label: 'Superficie (m²)', notes: 'Numérique' },
    { key: 'capacity', label: 'Capacité d\'accueil', notes: 'Numérique' },
    { key: 'staff_count', label: 'Effectif total', notes: 'Numérique' },
    { key: 'establishment_state', label: 'État de l\'établissement' },
    { key: 'building_state', label: 'État du bâtiment' },
    { key: 'equipment_state', label: 'État des équipements' },
    { key: 'sports_staff_count', label: 'Personnel du secteur sport', notes: 'Numérique' },
    { key: 'hr_needs', label: 'Besoin en RH', notes: 'Oui/Non' },
    { key: 'besoin_amenagement', label: 'Besoin d\'aménagement', notes: 'Oui/Non' },
    { key: 'besoin_equipements', label: 'Besoin d\'équipements', notes: 'Oui/Non' },
    { key: 'rehabilitation_plan', label: 'Plan de réhabilitation' },
    { key: 'observations', label: 'Observations' },
    { key: 'sports', label: 'Sports', notes: 'Séparés par des virgules' },
];

export default function ImportFacilitiesDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const [step, setStep] = useState<ImportStep>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [fileHeaders, setFileHeaders] = useState<string[]>([]);
    const [columnMapping, setColumnMapping] = useState<Record<string, string | undefined>>({});
    const [parsedData, setParsedData] = useState<Partial<Facility>[]>([]);
    const [error, setError] = useState<string | null>(null);

    const resetState = () => {
        setStep('upload');
        setFile(null);
        setFileHeaders([]);
        setColumnMapping({});
        setParsedData([]);
        setError(null);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setError(null);

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = event.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                if (jsonData.length < 1) {
                    setError('Le fichier est vide ou illisible.');
                    return;
                }
                const headers = (jsonData[0] as string[]).map(h => h.trim());
                setFileHeaders(headers.filter(h => h)); 
                
                // Auto-mapping attempt
                const initialMapping: Record<string, string> = {};
                const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/gi, '');

                DB_FIELDS.forEach(field => {
                    const normalizedFieldLabel = normalize(field.label);
                    const foundHeader = headers.find(h => {
                        const normalizedHeader = normalize(h);
                        return normalizedHeader.includes(normalizedFieldLabel);
                    });
                    if (foundHeader) {
                        initialMapping[field.key] = foundHeader;
                    }
                });
                setColumnMapping(initialMapping);
                setStep('mapping');
            } catch (err) {
                console.error(err);
                setError('Erreur lors de la lecture du fichier. Assurez-vous que c\'est un fichier Excel valide.');
            }
        };
        reader.readAsBinaryString(selectedFile);
    };

    const handleMappingChange = (dbField: string, fileHeader: string) => {
        setColumnMapping(prev => ({ ...prev, [dbField]: fileHeader === '--ignore--' ? undefined : fileHeader }));
    };

    const processData = () => {
        setError(null);
        const mappingIsValid = REQUIRED_FIELDS.every(fieldKey => !!columnMapping[fieldKey]);
        if (!mappingIsValid) {
            setError('Veuillez mapper les champs obligatoires: Nom, Latitude et Longitude.');
            return;
        }

        try {
            const reader = new FileReader();
            reader.onload = (event) => {
                const data = event.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

                const facilities: Partial<Facility>[] = jsonData.map(row => {
                    const facility: Partial<Facility> & { location?: { lat: number, lng: number }} = {};
                    
                    for (const [dbFieldKey, fileHeader] of Object.entries(columnMapping)) {
                        if (fileHeader && row[fileHeader] !== undefined) {
                            let value = row[fileHeader];
                            
                            if (dbFieldKey.startsWith('location.')) {
                                const coordKey = dbFieldKey.split('.')[1] as 'lat' | 'lng';
                                const numValue = parseFloat(String(value).replace(',', '.'));
                                if (!isNaN(numValue)) {
                                    if (!facility.location) facility.location = { lat: 0, lng: 0 };
                                    facility.location[coordKey] = numValue;
                                }
                            } else if (['hr_needs', 'besoin_amenagement', 'besoin_equipements', 'developed_space', 'accessible'].includes(dbFieldKey)) {
                                 const boolValue = ['true', 'oui', 'yes', '1', 'vrai'].includes(String(value).toLowerCase());
                                (facility as any)[dbFieldKey] = boolValue;
                            } else if (['surface_area', 'capacity', 'staff_count', 'sports_staff_count', 'beneficiaries'].includes(dbFieldKey)) {
                                const numValue = parseFloat(String(value).replace(',', '.'));
                                if(!isNaN(numValue)) (facility as any)[dbFieldKey] = numValue;
                            } else if (dbFieldKey === 'last_renovation_date' && typeof value === 'number') {
                                // Handle Excel date serial number
                                const date = XLSX.SSF.parse_date_code(value);
                                (facility as any)[dbFieldKey] = new Date(date.y, date.m - 1, date.d);
                            } else if (dbFieldKey === 'sports' && typeof value === 'string') {
                                facility.sports = value.split(',').map(s => s.trim());
                            } else {
                               (facility as any)[dbFieldKey] = value;
                            }
                        }
                    }
                    return facility;
                }).filter(f => f.name && f.location?.lat && f.location?.lng);
                
                if (facilities.length === 0) {
                    throw new Error("Aucune ligne valide n'a pu être lue. Vérifiez votre mappage et le contenu du fichier.");
                }
                
                setParsedData(facilities);
                setStep('preview');
            };
            reader.readAsBinaryString(file!);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Une erreur est survenue lors du traitement des données.');
        }
    };
    
    const handleImport = async () => {
        if (!user || !firestore) return;
        setStep('importing');
        let successCount = 0;
        let errorCount = 0;

        for (const facility of parsedData) {
            try {
                // Ensure default values for arrays
                if (!facility.sports) facility.sports = [];
                if (!facility.equipments) facility.equipments = [];

                const facilityPayload: Partial<Facility> = {
                    ...facility,
                    adminId: user.uid,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                };
                await addDoc(collection(firestore, 'facilities'), facilityPayload);
                successCount++;
            } catch (error) {
                console.error('Erreur d\'importation de ligne:', error);
                errorCount++;
            }
        }
        
        toast({
            title: 'Importation terminée',
            description: `${successCount} installations importées avec succès. ${errorCount > 0 ? `${errorCount} erreurs.` : ''}`,
        });

        setStep('finished');
    };

    const handleClose = () => {
        resetState();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Importer des Installations depuis Excel</DialogTitle>
                    <DialogDescription>
                        Suivez les étapes pour importer vos données.
                    </DialogDescription>
                </DialogHeader>

                {error && (
                    <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-md flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        <p className="text-sm">{error}</p>
                    </div>
                )}

                {step === 'upload' && (
                    <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/30 rounded-lg text-center p-8">
                        <Upload className="h-12 w-12 text-muted-foreground/50 mb-4" />
                        <h3 className="font-semibold text-lg mb-2">Glissez-déposez votre fichier ici</h3>
                        <p className="text-muted-foreground mb-4">ou</p>
                        <Button asChild>
                            <label htmlFor="file-upload">
                                Parcourir les fichiers
                                <input id="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".xlsx, .xls, .csv" />
                            </label>
                        </Button>
                        <p className="text-xs text-muted-foreground mt-4">Formats supportés: .xlsx, .xls, .csv</p>
                    </div>
                )}
                
                {step === 'mapping' && (
                    <div className="flex-1 flex flex-col gap-4 overflow-y-hidden">
                        <h3 className="font-semibold">Étape 2: Mapper les Colonnes</h3>
                        <p className="text-sm text-muted-foreground">Associez les colonnes de votre fichier aux champs de la base de données. Les champs obligatoires sont marqués d'un *.</p>
                        <ScrollArea className="flex-1 pr-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                {DB_FIELDS.map(field => (
                                    <div key={field.key} className="flex flex-col gap-2">
                                        <label className="font-medium text-sm">
                                            {field.label} {field.required && <span className="text-destructive">*</span>}
                                        </label>
                                        <Select
                                            value={columnMapping[field.key]}
                                            onValueChange={(value) => handleMappingChange(field.key, value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Sélectionner une colonne..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="--ignore--">Ignorer cette colonne</SelectItem>
                                                {fileHeaders.map(header => (
                                                    <SelectItem key={header} value={header}>{header}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {field.notes && <p className="text-xs text-muted-foreground">{field.notes}</p>}
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                         <DialogFooter>
                            <Button variant="ghost" onClick={resetState}>Annuler</Button>
                            <Button onClick={processData}>
                                Prévisualiser les Données <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </DialogFooter>
                    </div>
                )}

                {step === 'preview' && (
                     <div className="flex-1 flex flex-col gap-4 overflow-y-hidden">
                        <h3 className="font-semibold">Étape 3: Prévisualisation</h3>
                        <p className="text-sm text-muted-foreground">Vérifiez les données avant l'importation. Seules les 10 premières lignes valides sont affichées.</p>
                        <ScrollArea className="flex-1 border rounded-lg">
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nom</TableHead>
                                        <TableHead>Région</TableHead>
                                        <TableHead>Lat</TableHead>
                                        <TableHead>Lng</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {parsedData.slice(0, 10).map((facility, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{facility.name}</TableCell>
                                            <TableCell>{facility.region || 'N/A'}</TableCell>
                                            <TableCell>{facility.location?.lat.toFixed(4)}</TableCell>
                                            <TableCell>{facility.location?.lng.toFixed(4)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                        <p className="text-sm font-medium">{parsedData.length} lignes seront importées.</p>
                         <DialogFooter>
                            <Button variant="ghost" onClick={() => setStep('mapping')}>Retour</Button>
                            <Button onClick={handleImport}>
                                Lancer l'Importation
                            </Button>
                        </DialogFooter>
                    </div>
                )}

                {(step === 'importing' || step === 'finished') && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                        {step === 'importing' && <>
                            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                            <h3 className="font-semibold text-lg mb-2">Importation en cours...</h3>
                            <p className="text-muted-foreground">Veuillez ne pas fermer cette fenêtre.</p>
                        </>}
                        {step === 'finished' && <>
                            <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                            <h3 className="font-semibold text-lg mb-2">Importation Terminée</h3>
                            <p className="text-muted-foreground">Vos données ont été importées avec succès.</p>
                            <DialogFooter className="mt-6">
                                <Button onClick={handleClose}>Fermer</Button>
                            </DialogFooter>
                        </>}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
