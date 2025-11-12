'use client';

import { useState, useRef, useCallback } from 'react';
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
import { Loader2, FileUp, FileCheck2, AlertCircle, X, ChevronsUpDown, Check } from 'lucide-react';
import Papa from 'papaparse';
import { ScrollArea } from '../ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import type { Facility } from '@/lib/types';


interface ImportFacilitiesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const requiredDbFields = [
    { key: 'nom_de_letablissement', label: 'Nom de l\'établissement', notes: 'Obligatoire' },
    { key: 'latitude', label: 'Latitude', notes: 'Obligatoire' },
    { key: 'longitude', label: 'Longitude', notes: 'Obligatoire' },
];

const optionalDbFields = [
    { key: 'reference_region', label: 'Référence Région', notes: 'Numérique' },
    { key: 'region', label: 'Région' },
    { key: 'province', label: 'Province' },
    { key: 'commune', label: 'Commune' },
    { key: 'milieu_urbain___rural', label: 'Milieu (Urbain/Rural)' },
    { key: 'installations_sportives', label: 'Type d\'installation' },
    { key: 'categorie_abregee', label: 'Catégorie abrégée' },
    { key: 'localisation', label: 'Adresse/Localisation' },
    { key: 'propriete', label: 'Propriété' },
    { key: 'entite_gestionnaire', label: 'Entité gestionnaire' },
    { key: 'date_derniere_renovation', label: 'Date dernière rénovation', notes: 'Format date' },
    { key: 'superficie', label: 'Superficie (m²)', notes: 'Numérique' },
    { key: 'capacite_daccueil', label: 'Capacité d\'accueil', notes: 'Numérique' },
    { key: 'effectif', label: 'Effectif total', notes: 'Numérique' },
    { key: 'etat_de_letablissement__1_[operationnel]_2_[en_arret]_3_[pret]_(a_etre_inaugure)_4_[en_cours_doperationnalisation]_(pret_avec_besoins/conditions)_5_[en_cours_de_construction]', label: 'État de l\'établissement' },
    { key: 'espace_amenage', label: 'Espace aménagé', notes: 'Booléen (oui/non)' },
    { key: 'الرسم_العقاري_رقم)_(...)_titre_foncier_n_…..', label: 'N° Titre Foncier' },
    { key: 'etat_du_batiment__1_[bon]_2_[moyen]_3_[mauvais]_4_[mediocre]', label: 'État du bâtiment' },
    { key: 'etat_des_equipements__0__non_equipe_1_[bon]_2_[moyen]_3_[mauvais]_4_[mediocre]', label: 'État des équipements' },
    { key: 'nombre_du_personnel_du_secteur_sport_affecte', label: 'Personnel du secteur sport', notes: 'Numérique' },
    { key: 'besoin__rh', label: 'Besoin en RH', notes: 'Booléen (oui/non)' },
    { key: 'prise_en_compte_dans_le__cadre_du_prog_de_rehabilitation_annee_...............', label: 'Plan de réhabilitation' },
    { key: 'besoin_damenagement', label: 'Besoin d\'aménagement', notes: 'Booléen (oui/non)' },
    { key: 'besoin_dequipements', label: 'Besoin d\'équipements', notes: 'Booléen (oui/non)' },
    { key: 'observation_sur__les_mesures_a_mettre_en_place_pour_reouverture', label: 'Observations' },
    { key: 'benificiares', label: 'Bénéficiaires', notes: 'Numérique' },
];

const allDbFields = [...requiredDbFields, ...optionalDbFields];

const cleanColumnName = (col: string): string => {
    return col
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/-/g, "_")
        .replace(/'/g, "")
        .replace(/"/g, "")
        .replace(/:/g, "")
        .replace(/\n/g, "_")
        .replace(/é/g, "e")
        .replace(/è/g, "e")
        .replace(/ê/g, "e")
        .replace(/à/g, "a")
        .replace(/â/g, "a")
        .replace(/ô/g, "o")
        .replace(/î/g, "i")
        .replace(/ï/g, "i")
        .replace(/ç/g, "c");
};

export default function ImportFacilitiesDialog({ open, onOpenChange }: ImportFacilitiesDialogProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState<string | null>(null);
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [fileData, setFileData] = useState<any[]>([]);
  
  const [columnMap, setColumnMap] = useState<Record<string, string>>({});
  const [parsedData, setParsedData] = useState<Partial<Facility>[]>([]);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetState = useCallback(() => {
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
  }, []);

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
      complete: (results) => {
        if(results.errors.length) {
            setError(`Erreur lors de la lecture du fichier CSV: ${results.errors[0].message}`);
            return;
        }
        setFileHeaders(results.meta.fields || []);
        setFileData(results.data);
      },
      error: (err: any) => {
        setError(`Erreur lors de la lecture du fichier CSV: ${err.message}`);
      }
    });
  };
  
  const handleColumnMapChange = (dbField: string, fileHeader: string) => {
    setColumnMap(prev => ({...prev, [dbField]: fileHeader}));
  };

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
        let name: string | null = null;
        let lat: number | null = null;
        let lng: number | null = null;

        for (const dbFieldKey in columnMap) {
            const fileHeader = columnMap[dbFieldKey];
            if (fileHeader && row[fileHeader] !== undefined && row[fileHeader] !== null) {
                const value = row[fileHeader];
                
                if (dbFieldKey === 'nom_de_letablissement') {
                    name = String(value);
                    facility['name'] = name;
                } else if (dbFieldKey === 'latitude') {
                    const num = parseFloat(String(value).replace(',', '.'));
                    if (!isNaN(num)) lat = num;
                } else if (dbFieldKey === 'longitude') {
                    const num = parseFloat(String(value).replace(',', '.'));
                    if (!isNaN(num)) lng = num;
                } else {
                    const dbFieldInfo = allDbFields.find(f => f.key === dbFieldKey);
                    if (dbFieldInfo?.notes?.includes('Numérique')) {
                      facility[dbFieldKey] = parseFloat(String(value).replace(',', '.')) || undefined;
                    } else if (dbFieldInfo?.notes?.includes('Booléen')) {
                      facility[dbFieldKey] = ['oui', 'yes', 'true', '1'].includes(String(value).toLowerCase());
                    } else {
                       facility[dbFieldKey] = String(value);
                    }
                }
            }
        }

        if (name && lat !== null && lng !== null) {
            facility.location = { lat, lng };
            // Map the cleaned keys to the expected Facility interface keys
            const finalFacility: Partial<Facility> = {
                adminId: facility.adminId,
                name: facility.name,
                location: facility.location,
                reference_region: facility.reference_region,
                region: facility.region,
                province: facility.province,
                commune: facility.commune,
                milieu: facility.milieu_urbain___rural,
                installations_sportives: facility.installations_sportives,
                categorie_abregee: facility.categorie_abregee,
                address: facility.localisation,
                ownership: facility.propriete,
                managing_entity: facility.entite_gestionnaire,
                last_renovation_date: facility.date_derniere_renovation,
                surface_area: facility.superficie,
                capacity: facility.capacite_daccueil,
                staff_count: facility.effectif,
                establishment_state: facility.etat_de_letablissement__1_operationnel_2_en_arret_3_pret_a_etre_inaugure_4_en_cours_doperationnalisation_pret_avec_besoins_conditions_5_en_cours_de_construction,
                developed_space: facility.espace_amenage,
                titre_foncier_numero: facility['الرسم_العقاري_رقم)_(...)_titre_foncier_n_…..'],
                building_state: facility.etat_du_batiment__1_bon_2_moyen_3_mauvais_4_mediocre,
                equipment_state: facility.etat_des_equipements__0__non_equipe_1_bon_2_moyen_3_mauvais_4_mediocre,
                sports_staff_count: facility.nombre_du_personnel_du_secteur_sport_affecte,
                hr_needs: facility.besoin__rh,
                rehabilitation_plan: facility.prise_en_compte_dans_le__cadre_du_prog_de_rehabilitation_annee,
                besoin_amenagement: facility.besoin_damenagement,
                besoin_equipements: facility.besoin_dequipements,
                observations: facility.observation_sur__les_mesures_a_mettre_en_place_pour_reouverture,
                beneficiaries: facility.benificiares,
            };
            return finalFacility;
        }
        return null;
    }).filter((f): f is Partial<Facility> => f !== null);

    if (facilities.length === 0) {
         setError("Aucune ligne valide n'a pu être lue. Vérifiez votre mappage et le contenu du fichier.");
         setIsProcessing(false);
         return;
    }
    
    setParsedData(facilities); // For potential preview, though we go straight to import
    
    // Perform the import
    const batch = writeBatch(firestore);
    facilities.forEach(facilityData => {
        const docRef = doc(collection(firestore, 'facilities')); // Auto-generate ID
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
          toast({
              variant: "destructive",
              title: "Échec de l'importation",
              description: `Une erreur s'est produite. ${error.message}`,
          });
      })
      .finally(() => {
          setIsProcessing(false);
      });
  };

  const renderContent = () => {
    if (!fileName) {
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
      )
    }

    if (parsedData.length > 0) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-green-500/50 bg-green-500/10 p-12 text-center">
                <Loader2 className="h-10 w-10 animate-spin text-green-600" />
                <p className="text-muted-foreground">Importation de {parsedData.length} lignes...</p>
            </div>
        )
    }

    return (
      <>
        <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3 mb-4">
            <FileCheck2 className="h-6 w-6 text-green-600" />
            <div>
                <p className="font-medium">{fileName}</p>
                <p className="text-sm text-muted-foreground">Fichier prêt. Veuillez mapper les colonnes ci-dessous.</p>
            </div>
        </div>
        <ScrollArea className="h-96">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 p-1">
              {[...requiredDbFields, ...optionalDbFields].map(field => (
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
          <Button onClick={processAndImport} disabled={!fileName || isProcessing || !requiredMappingsMet}>
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isProcessing ? 'Importation...' : 'Importer les Données'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
