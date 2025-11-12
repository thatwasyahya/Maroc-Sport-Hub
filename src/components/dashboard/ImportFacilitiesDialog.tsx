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
import { Loader2, FileUp, FileCheck2, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';
import { ScrollArea } from '../ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import type { Facility } from '@/lib/types';


interface ImportFacilitiesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const requiredDbFields = [
    { key: 'name', label: 'Nom de l\'établissement', notes: 'Obligatoire' },
    { key: 'latitude', label: 'Latitude', notes: 'Obligatoire' },
    { key: 'longitude', label: 'Longitude', notes: 'Obligatoire' },
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

const headerMappings: { [key: string]: string } = {
  'name': 'nom_de_letablissement',
  'latitude': 'latitude',
  'longitude': 'longitude',
  'reference_region': 'reference_region',
  'region': 'region',
  'province': 'province',
  'commune': 'commune',
  'milieu': 'milieu_urbain___rural',
  'installations_sportives': 'installations_sportives',
  'categorie_abregee': 'categorie_abregee',
  'address': 'localisation',
  'ownership': 'propriete',
  'managing_entity': 'entite_gestionnaire',
  'last_renovation_date': 'date_derniere_renovation',
  'surface_area': 'superficie',
  'capacity': 'capacite_daccueil',
  'staff_count': 'effectif',
  'establishment_state': 'etat_de_letablissement__1_[operationnel]_2_[en_arret]_3_[pret]_(a_etre_inaugure)_4_[en_cours_doperationnalisation]_(pret_avec_besoins/conditions)_5_[en_cours_de_construction]',
  'developed_space': 'espace_amenage',
  'titre_foncier_numero': 'الرسم_العقاري_رقم)_(...)_titre_foncier_n_…..',
  'building_state': 'etat_du_batiment__1_[bon]_2_[moyen]_3_[mauvais]_4_[mediocre]',
  'equipment_state': 'etat_des_equipements__0__non_equipe_1_[bon]_2_[moyen]_3_[mauvais]_4_[mediocre]',
  'sports_staff_count': 'nombre_du_personnel_du_secteur_sport_affecte',
  'hr_needs': 'besoin__rh',
  'rehabilitation_plan': 'prise_en_compte_dans_le__cadre_du_prog_de_rehabilitation_annee_...............',
  'besoin_amenagement': 'besoin_damenagement',
  'besoin_equipements': 'besoin_dequipements',
  'observations': 'observation_sur__les_mesures_a_mettre_en_place_pour_reouverture',
  'beneficiaries': 'benificiares',
};


const cleanColumnName = (col: string): string => {
    return col.trim().toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/-/g, '_')
        .replace(/'/g, '')
        .replace(/"/g, '')
        .replace(/:/g, '')
        .replace(/\n/g, '_')
        .replace(/[éèê]/g, 'e')
        .replace(/[àâ]/g, 'a')
        .replace(/ô/g, 'o')
        .replace(/[îï]/g, 'i')
        .replace(/ç/g, 'c')
        .replace(/[^a-z0-9_]/g, '');
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

  const resetState = useCallback(() => {
    setFile(null);
    setFileHeaders([]);
    setFileData([]);
    setColumnMap({});
    setParsedData([]);
    setIsProcessing(false);
    setError(null);
  }, []);

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      resetState();
    }
    onOpenChange(isOpen);
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
        resetState();
        return;
    };
     if (!selectedFile.name.endsWith('.csv')) {
      setError('Veuillez sélectionner un fichier au format .csv');
      resetState();
      return;
    }
    setFile(selectedFile);
  };

  useEffect(() => {
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
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
                  setFileHeaders(results.meta.fields);
                  setFileData(results.data);

                  // Auto-map columns
                  const newColumnMap: Record<string, string> = {};
                  const cleanedFileHeaders = results.meta.fields.map(h => ({ original: h, cleaned: cleanColumnName(h) }));

                  for (const dbFieldKey in headerMappings) {
                      const expectedCleanedHeader = headerMappings[dbFieldKey];
                      const foundHeader = cleanedFileHeaders.find(h => h.cleaned.includes(expectedCleanedHeader));
                      if (foundHeader) {
                          newColumnMap[dbFieldKey] = foundHeader.original;
                      }
                  }
                  setColumnMap(newColumnMap);
              },
              error: (err: any) => {
                  setError(`Erreur PapaParse : ${err.message}`);
              }
          });
      };
      reader.readAsText(file);
  }, [file]);


  const processAndImport = () => {
    if (!user) {
      setError('Vous devez être connecté pour importer des données.');
      return;
    }

    const requiredMappingsMet = requiredDbFields.every(field => columnMap[field.key]);
    if (!requiredMappingsMet) {
        setError("Le mappage des champs obligatoires (Nom, Latitude, Longitude) est requis.");
        return;
    }
    
    setIsProcessing(true);

    const facilities: Partial<Facility>[] = fileData.map((row) => {
      const facility: Partial<any> = { adminId: user.uid };
      
      for (const dbFieldKey in columnMap) {
        const fileHeader = columnMap[dbFieldKey];
        if (fileHeader && row[fileHeader] !== undefined && row[fileHeader] !== null && String(row[fileHeader]).trim() !== '') {
          const value = String(row[fileHeader]).trim();
          facility[dbFieldKey] = value;
        }
      }

      const name = facility.name;
      const lat = parseFloat(String(facility.latitude).replace(',', '.'));
      const lng = parseFloat(String(facility.longitude).replace(',', '.'));

      if (name && !isNaN(lat) && !isNaN(lng)) {
        return {
          ...facility,
          name,
          location: { lat, lng },
          // Type conversions
          surface_area: facility.surface_area ? parseFloat(String(facility.surface_area).replace(',', '.')) : undefined,
          capacity: facility.capacity ? parseInt(String(facility.capacity), 10) : undefined,
          staff_count: facility.staff_count ? parseInt(String(facility.staff_count), 10) : undefined,
          sports_staff_count: facility.sports_staff_count ? parseInt(String(facility.sports_staff_count), 10) : undefined,
          beneficiaries: facility.beneficiaries ? parseInt(String(facility.beneficiaries), 10) : undefined,
          hr_needs: ['oui', 'yes', 'true', '1'].includes(String(facility.hr_needs).toLowerCase()),
          besoin_amenagement: ['oui', 'yes', 'true', '1'].includes(String(facility.besoin_amenagement).toLowerCase()),
          besoin_equipements: ['oui', 'yes', 'true', '1'].includes(String(facility.besoin_equipements).toLowerCase()),
          developed_space: ['oui', 'yes', 'true', '1'].includes(String(facility.developed_space).toLowerCase()),
        };
      }
      return null;
    }).filter((f): f is Partial<Facility> => f !== null);

    if (facilities.length === 0) {
      setError("Aucune ligne valide n'a pu être lue. Vérifiez votre mappage et le contenu du fichier.");
      setIsProcessing(false);
      return;
    }
    
    setParsedData(facilities);
    
    const batch = writeBatch(firestore);
    facilities.forEach(facilityData => {
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
              description: `${facilities.length} installations ont été importées avec succès.`,
          });
          handleClose(true);
      })
      .catch((error: any) => {
          setError(`Erreur lors de l'importation : ${error.message}`);
      })
      .finally(() => {
          setIsProcessing(false);
      });
  };

  const renderContent = () => {
    if (fileData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center">
            <FileUp className="h-10 w-10 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Télécharger un fichier CSV</h3>
            <p className="text-sm text-muted-foreground">Cliquez sur le bouton pour sélectionner un fichier .csv depuis votre ordinateur.</p>
            <Button type="button" variant="outline" onClick={() => document.getElementById('csv-input')?.click()}>
              Sélectionner un fichier
            </Button>
            <input type="file" id="csv-input" onChange={handleFileChange} accept=".csv" className="hidden" />
        </div>
      )
    }

    return (
      <>
        <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3 mb-4">
            <FileCheck2 className="h-6 w-6 text-green-600" />
            <div>
                <p className="font-medium">{file?.name}</p>
                <p className="text-sm text-muted-foreground">Fichier prêt. Veuillez mapper les colonnes ci-dessous.</p>
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
                      <Select onValueChange={(value) => setColumnMap(prev => ({...prev, [field.key]: value}))} value={columnMap[field.key] || ''}>
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
  }

  const requiredMappingsMet = requiredDbFields.every(field => columnMap[field.key] && columnMap[field.key] !== '--skip--');

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Importer des Installations depuis un CSV</DialogTitle>
          <DialogDescription>
            Étape 1: Sélectionnez un fichier. Étape 2: Mappez les colonnes. Étape 3: Importez.
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
          <Button variant="ghost" onClick={() => handleClose(false)}>Annuler</Button>
          <Button onClick={processAndImport} disabled={fileData.length === 0 || isProcessing || !requiredMappingsMet}>
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isProcessing ? 'Importation...' : `Importer ${parsedData.length > 0 ? parsedData.length : ''} Lignes`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
