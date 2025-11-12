'use client';

import { useState, useRef, useCallback } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { writeBatch, collection } from 'firebase/firestore';
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
import type { Facility } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { ScrollArea } from '../ui/scroll-area';
import Papa from 'papaparse';

interface ImportFacilitiesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ImportFacilitiesDialog({ open, onOpenChange }: ImportFacilitiesDialogProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<Partial<Facility>[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetState = () => {
    setFileName(null);
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
  
  const cleanColumnName = (col: string) => {
    return col
        .trim()
        .toLowerCase()
        .replace(/ /g, "_")
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
        .replace(/ç/g, "c")
        // Remove special chars and parentheses
        .replace(/[()]/g, '')
        // Replace multiple underscores with a single one
        .replace(/_+/g, '_');
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    resetState();
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/csv') {
      setError('Veuillez sélectionner un fichier au format .csv');
      return;
    }
    
    setFileName(file.name);
    setIsProcessing(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: header => cleanColumnName(header),
      complete: (results) => {
        processData(results.data);
      },
      error: (err) => {
        console.error("PapaParse error:", err);
        setError(`Erreur lors de la lecture du fichier CSV: ${err.message}`);
        setIsProcessing(false);
      }
    });
  };

  const processData = (data: any[]) => {
    if (!user) {
      setError('Vous devez être connecté pour importer des données.');
      setIsProcessing(false);
      return;
    }

    const headerMappings: Record<keyof Facility, string[]> = {
      name: ['nom_de_letablissement', 'nom'],
      reference_region: ['reference_region'],
      region: ['region'],
      province: ['province'],
      commune: ['commune'],
      milieu: ['milieu_urbain___rural'],
      installations_sportives: ['installations_sportives'],
      categorie_abregee: ['categorie_abregee'],
      address: ['localisation'],
      longitude: ['longitude'],
      latitude: ['latitude'],
      ownership: ['propriete'],
      managing_entity: ['entite_gestionnaire'],
      last_renovation_date: ['date_derniere_renovation'],
      surface_area: ['superficie'],
      capacity: ['capacite_daccueil'],
      effectif: ['effectif'],
      establishment_state: ['etat_de_letablissement__1_[operationnel]_2_[en_arret]_3_[pret]_(a_etre_inaugure)_4_[en_cours_doperationnalisation]_(pret_avec_besoins/conditions)_5_[en_cours_de_construction]'],
      developed_space: ['espace_amenage'],
      titre_foncier_numero: ['الرسم_العقاري_رقم)_(...)_titre_foncier_n_…..'],
      building_state: ['etat_du_batiment__1_[bon]_2_[moyen]_3_[mauvais]_4_[mediocre]'],
      equipment_state: ['etat_des_equipements__0__non_equipe_1_[bon]_2_[moyen]_3_[mauvais]_4_[mediocre]'],
      sports_staff_count: ['nombre_du_personnel_du_secteur_sport_affecte'],
      hr_needs: ['besoin__rh'],
      rehabilitation_plan: ['prise_en_compte_dans_le__cadre_du_prog_de_rehabilitation_annee_...............'],
      besoin_amenagement: ['besoin_damenagement'],
      besoin_equipements: ['besoin_dequipements'],
      observations: ['observation_sur__les_mesures_a_mettre_en_place_pour_reouverture'],
      beneficiaries: ['benificiares'],
      // Fields not in the provided file will be ignored
      id: [], adminId: [], location: [], sports: [], type: [], accessible: [], description: [], photoUrl: [], equipments: [], createdAt: [], updatedAt: [], city: []
    };
    
    const facilities: Partial<Facility>[] = data.map((row) => {
        const facility: Partial<Facility> = { adminId: user.uid };
        let hasLocation = false;
        let lat: number | null = null;
        let lng: number | null = null;

        for (const [facilityKey, possibleHeaders] of Object.entries(headerMappings)) {
            for (const header of possibleHeaders) {
                if (row[header] !== undefined) {
                    const value = row[header];
                    if (facilityKey === 'latitude' || facilityKey === 'longitude') {
                        const num = parseFloat(String(value).replace(',', '.'));
                        if (!isNaN(num)) {
                            if (facilityKey === 'latitude') lat = num;
                            if (facilityKey === 'longitude') lng = num;
                        }
                    } else if (typeof (facility as any)[facilityKey] === 'boolean') {
                       (facility as any)[facilityKey] = ['oui', 'yes', 'true', '1'].includes(String(value).toLowerCase());
                    } else if (typeof (facility as any)[facilityKey] === 'number') {
                       (facility as any)[facilityKey] = parseFloat(String(value).replace(',', '.')) || undefined;
                    } else {
                       (facility as any)[facilityKey] = value || undefined;
                    }
                    break;
                }
            }
        }
        
        if (lat !== null && lng !== null) {
            facility.location = { lat, lng };
            hasLocation = true;
        }

        if (facility.name && hasLocation) {
            return facility;
        }
        return null;
    }).filter((f): f is Partial<Facility> => f !== null);

    if (facilities.length === 0) {
        setError("Aucune ligne valide n'a pu être lue. Vérifiez que les colonnes 'nom de l'etablissement' (ou 'nom'), 'latitude' et 'longitude' sont présentes et remplies avec des données valides.");
    } else {
        setParsedData(facilities);
    }
    setIsProcessing(false);
  };
  
  const handleImport = async () => {
    if (parsedData.length === 0 || !firestore) return;
    setIsProcessing(true);
    
    try {
        const batch = writeBatch(firestore);
        const facilitiesCollection = collection(firestore, 'facilities');
        
        parsedData.forEach(facilityData => {
            const docRef = collection(firestore, 'facilities').doc(); // Auto-generate ID
            batch.set(docRef, facilityData);
        });

        await batch.commit();
        toast({
            title: "Importation réussie",
            description: `${parsedData.length} installations ont été importées avec succès.`,
        });
        handleClose(false);
    } catch (error: any) {
        console.error("Error importing data:", error);
        setError(`Erreur lors de l'importation : ${error.message}`);
        toast({
            variant: "destructive",
            title: "Échec de l'importation",
            description: `Une erreur s'est produite lors de l'importation des données. ${error.message}`,
        });
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Importer des Installations</DialogTitle>
          <DialogDescription>
            Téléchargez un fichier .csv pour importer plusieurs installations à la fois.
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

            {!parsedData.length && (
                <div className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center">
                    {isProcessing ? (
                        <>
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            <p className="text-muted-foreground">Traitement du fichier...</p>
                        </>
                    ) : (
                       <>
                        <FileUp className="h-10 w-10 text-muted-foreground" />
                        <h3 className="text-lg font-semibold">Télécharger un fichier CSV</h3>
                        <p className="text-sm text-muted-foreground">Cliquez sur le bouton ci-dessous pour sélectionner un fichier.</p>
                        <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                          Sélectionner un fichier
                        </Button>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" className="hidden" />
                       </>
                    )}
                </div>
            )}
            
            {parsedData.length > 0 && (
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
            )}

        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => handleClose(false)} disabled={isProcessing}>
            Annuler
          </Button>
          <Button onClick={handleImport} disabled={isProcessing || parsedData.length === 0}>
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Importer {parsedData.length > 0 ? `${parsedData.length} installation(s)`: ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
