'use client';

import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { ScrollArea } from '../ui/scroll-area';
import { sports } from '@/lib/data';
import { getRegions } from '@/lib/maroc-api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { PlusCircle, Trash2, Search, Loader2, CalendarIcon } from 'lucide-react';
import { MultiSelect } from '@/components/ui/multi-select';
import type { FacilityRequest, EstablishmentState, BuildingState, EquipmentState } from '@/lib/types';
import { geocodeAddress } from '@/services/nominatim';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar } from '../ui/calendar';
import { Switch } from '../ui/switch';


const facilityRequestSchema = z.object({
  name: z.string().min(1, 'Nom est requis.'),
  address: z.string().min(1, 'Adresse est requise.'),

  region: z.string().min(1, "Région est requise."),
  province: z.string().optional(),
  commune: z.string().optional(),
  milieu: z.enum(['Urbain', 'Rural']).optional(),

  installations_sportives: z.string().optional(),
  categorie_abregee: z.string().optional(),
  
  ownership: z.string().optional(),
  managing_entity: z.string().optional(),
  titre_foncier_numero: z.string().optional(),

  last_renovation_date: z.date().optional(),

  surface_area: z.coerce.number().optional(),
  capacity: z.coerce.number().optional(),
  staff_count: z.coerce.number().optional(),
  sports_staff_count: z.coerce.number().optional(),
  beneficiaries: z.coerce.number().optional(),

  establishment_state: z.enum(['Opérationnel', 'En arrêt', 'Prêt', 'En cours de transformation', 'En cours de construction', 'Non défini']).optional(),
  building_state: z.enum(['Bon', 'Moyen', 'Mauvais', 'Médiocre', 'Non défini']).optional(),
  equipment_state: z.enum(['Non équipé', 'Bon', 'Moyen', 'Mauvais', 'Médiocre', 'Non défini']).optional(),

  hr_needs: z.boolean().default(false),
  besoin_amenagement: z.boolean().default(false),
  besoin_equipements: z.boolean().default(false),

  rehabilitation_plan: z.string().optional(),
  observations: z.string().optional(),
  
  description: z.string().optional(),
  sports: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "Vous devez sélectionner au moins un sport.",
  }),
  equipments: z.array(z.object({
    name: z.string().min(1, 'Nom ne peut être vide.'),
    quantity: z.string().min(1, 'Quantité est requise.'),
  })).optional(),
  type: z.enum(["indoor", "outdoor"]),
  accessible: z.boolean().default(false),
  developed_space: z.boolean().default(false),
});

type FacilityRequestFormValues = z.infer<typeof facilityRequestSchema>;

interface AddFacilityRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddFacilityRequestDialog({ open, onOpenChange }: AddFacilityRequestDialogProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingStatus, setGeocodingStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  const regions = getRegions();

  const sportOptions = sports.map(sport => ({ value: sport, label: sport }));

  const form = useForm<FacilityRequestFormValues>({
    resolver: zodResolver(facilityRequestSchema),
    defaultValues: {
      name: '',
      address: '',
      region: '',
      sports: [],
      equipments: [],
      type: 'outdoor',
      accessible: false,
      hr_needs: false,
      besoin_amenagement: false,
      besoin_equipements: false,
      developed_space: false,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "equipments",
  });
  
  const selectedRegion = form.watch('region');

  useEffect(() => {
    setGeocodingStatus('idle');
  }, [selectedRegion, form]);

  const addressWatched = form.watch('address');
  useEffect(() => {
    setGeocodingStatus('idle');
  }, [addressWatched]);

  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  const handleGeocode = async () => {
    const address = form.getValues("address");
    const region = form.getValues("region");
    const city = form.getValues("city");
    const province = form.getValues("province");
    const commune = form.getValues("commune");
    
    if (!address) {
      toast({
        variant: "destructive",
        title: "Adresse manquante",
        description: "Veuillez remplir l'adresse avant de continuer.",
      });
      return;
    }

    setIsGeocoding(true);
    setGeocodingStatus('idle');
    try {
      // Passer tous les paramètres disponibles pour une meilleure précision
      const location = await geocodeAddress(address, city, province, commune);
      if (location) {
        setLat(location.lat);
        setLng(location.lng);
        setGeocodingStatus('success');
        toast({
          title: "Emplacement trouvé",
          description: `Coordonnées: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`,
        });
      } else {
        setGeocodingStatus('error');
        toast({
          variant: "destructive",
          title: "Emplacement introuvable",
          description: "Impossible de trouver les coordonnées. Vérifiez l'adresse, la commune et la province.",
        });
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      setGeocodingStatus('error');
      toast({
        variant: "destructive",
        title: "Erreur de géocodage",
        description: "Une erreur s'est produite lors de la recherche de l'adresse.",
      });
    } finally {
      setIsGeocoding(false);
    }
  };

  const onSubmit = (data: FacilityRequestFormValues) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in.' });
      return;
    }

    setIsSubmitting(true);

    const newRequestData: Omit<FacilityRequest, 'id' | 'city'> = {
      ...data,
      userId: user.uid,
      userName: user.displayName || user.email || 'Anonymous',
      userEmail: user.email || '',
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    if (lat !== null && lng !== null) {
        newRequestData.location = { lat, lng };
    }

    const requestsCollectionRef = collection(firestore, 'facilityRequests');
    addDocumentNonBlocking(requestsCollectionRef, newRequestData);

    toast({
      title: 'Demande Soumise',
      description: `Votre demande pour ${data.name} a été soumise pour examen.`,
    });
    form.reset();
    setLat(null);
    setLng(null);
    setGeocodingStatus('idle');
    onOpenChange(false);
    setIsSubmitting(false);
  };
  
  const establishmentStates: EstablishmentState[] = ['Opérationnel', 'En arrêt', 'Prêt', 'En cours de transformation', 'En cours de construction', 'Non défini'];
  const buildingStates: BuildingState[] = ['Bon', 'Moyen', 'Mauvais', 'Médiocre', 'Non défini'];
  const equipmentStates: EquipmentState[] = ['Non équipé', 'Bon', 'Moyen', 'Mauvais', 'Médiocre', 'Non défini'];


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Proposer une Nouvelle Installation</DialogTitle>
          <DialogDescription>
            Remplissez les détails ci-dessous. Votre proposition sera examinée par un administrateur.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <ScrollArea className="h-[70vh] p-4">
              <div className="space-y-6">
                
                <h3 className="text-lg font-medium border-b pb-2">Informations Générales</h3>
                <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Nom de l'établissement*</FormLabel>
                        <FormControl><Input placeholder="ex: Stade Municipal" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="installations_sportives" render={({ field }) => (
                      <FormItem>
                          <FormLabel>Type d'installation</FormLabel>
                          <FormControl><Input placeholder="ex: Stade, Salle couverte" {...field} /></FormControl>
                          <FormMessage />
                      </FormItem>
                  )}/>
                  <FormField control={form.control} name="categorie_abregee" render={({ field }) => (
                      <FormItem>
                          <FormLabel>Catégorie abrégée</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                      </FormItem>
                  )}/>
                </div>
                
                <h3 className="text-lg font-medium border-b pb-2">Localisation</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="region" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Région*</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Sélectionner une région" /></SelectTrigger></FormControl>
                                <SelectContent>{regions.map((region) => (<SelectItem key={region.name} value={region.name}>{region.name}</SelectItem>))}</SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}/>
                    <FormField control={form.control} name="province" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Province</FormLabel>
                            <FormControl><Input placeholder="Province" {...field} /></FormControl>
                             <FormMessage />
                        </FormItem>
                    )}/>
                     <FormField control={form.control} name="commune" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Commune</FormLabel>
                            <FormControl><Input placeholder="Commune" {...field} /></FormControl>
                             <FormMessage />
                        </FormItem>
                    )}/>
                    <FormField control={form.control} name="milieu" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Milieu</FormLabel>
                             <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Sélectionner un milieu" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="Urbain">Urbain</SelectItem>
                                    <SelectItem value="Rural">Rural</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}/>
                </div>
                
                 <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Adresse/Localisation*</FormLabel>
                        <div className="flex gap-2 items-start">
                            <FormControl><Input placeholder="ex: 123 Rue Principale, Quartier..." {...field} /></FormControl>
                            <div className='flex flex-col gap-1'>
                                <Button type="button" onClick={handleGeocode} disabled={isGeocoding}>
                                    <Search className="mr-2 h-4 w-4" />
                                    {isGeocoding ? 'Recherche...' : 'Trouver sur la carte'}
                                </Button>
                                {geocodingStatus === 'success' && <FormDescription className='text-green-600'>Coordonnées trouvées !</FormDescription>}
                                {geocodingStatus === 'error' && <FormDescription className='text-destructive'>Échec de la recherche.</FormDescription>}
                            </div>
                        </div>
                        <FormMessage />
                    </FormItem>
                )}/>

                <h3 className="text-lg font-medium border-b pb-2">Propriété et Gestion</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="ownership" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Propriété</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>
                    <FormField control={form.control} name="managing_entity" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Entité gestionnaire</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>
                    <FormField control={form.control} name="titre_foncier_numero" render={({ field }) => (
                        <FormItem>
                            <FormLabel>N° Titre Foncier</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>
                </div>
                
                <h3 className="text-lg font-medium border-b pb-2">Spécifications Techniques</h3>
                <FormField control={form.control} name="last_renovation_date" render={({ field }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel>Date de dernière rénovation</FormLabel>
                         <Popover>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                    {field.value ? format(field.value, "PPP") : <span>Choisir une date</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date() || date < new Date("1900-01-01")} initialFocus />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                    </FormItem>
                )}/>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="surface_area" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Superficie (m²)</FormLabel>
                            <FormControl><Input type="number" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>
                     <FormField control={form.control} name="capacity" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Capacité d'accueil</FormLabel>
                            <FormControl><Input type="number" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>
                </div>

                <div className="space-y-4 rounded-md border p-4">
                    <h3 className="text-sm font-medium">État Actuel</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       <FormField control={form.control} name="establishment_state" render={({ field }) => (
                           <FormItem><FormLabel>État de l'établissement</FormLabel>
                               <Select onValueChange={field.onChange} defaultValue={field.value}>
                                   <FormControl><SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger></FormControl>
                                   <SelectContent>{establishmentStates.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
                               </Select>
                           <FormMessage /></FormItem>
                       )}/>
                       <FormField control={form.control} name="building_state" render={({ field }) => (
                           <FormItem><FormLabel>État du bâtiment</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                   <FormControl><SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger></FormControl>
                                   <SelectContent>{buildingStates.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                               </Select>
                           <FormMessage /></FormItem>
                       )}/>
                       <FormField control={form.control} name="equipment_state" render={({ field }) => (
                           <FormItem><FormLabel>État des équipements</FormLabel>
                               <Select onValueChange={field.onChange} defaultValue={field.value}>
                                   <FormControl><SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger></FormControl>
                                   <SelectContent>{equipmentStates.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
                               </Select>
                           <FormMessage /></FormItem>
                       )}/>
                    </div>
                </div>

                <div className="space-y-4 rounded-md border p-4">
                    <h3 className="text-sm font-medium">Ressources Humaines</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="staff_count" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Effectif total</FormLabel>
                                <FormControl><Input type="number" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}/>
                        <FormField control={form.control} name="sports_staff_count" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Personnel du secteur sport</FormLabel>
                                <FormControl><Input type="number" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}/>
                    </div>
                    <FormField control={form.control} name="hr_needs" render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                                <FormLabel>Besoin en RH</FormLabel>
                            </div>
                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        </FormItem>
                    )}/>
                </div>
                
                <div className="space-y-4 rounded-md border p-4">
                    <h3 className="text-sm font-medium">Besoins et Planification</h3>
                     <FormField control={form.control} name="rehabilitation_plan" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Prise en compte (prog. réhabilitation)</FormLabel>
                            <FormControl><Input placeholder="Année ou détails" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>
                    <div className="flex gap-4">
                        <FormField control={form.control} name="besoin_amenagement" render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm flex-1">
                                <div className="space-y-0.5"><FormLabel>Besoin d'aménagement</FormLabel></div>
                                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            </FormItem>
                        )}/>
                        <FormField control={form.control} name="besoin_equipements" render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm flex-1">
                                <div className="space-y-0.5"><FormLabel>Besoin d'équipements</FormLabel></div>
                                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            </FormItem>
                        )}/>
                    </div>
                </div>

                <div className="space-y-4 rounded-md border p-4 mt-4">
                  <h3 className="text-sm font-medium">Équipements Fournis</h3>
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex items-end gap-2">
                      <FormField control={form.control} name={`equipments.${index}.quantity`} render={({ field }) => (
                          <FormItem className="w-24"><FormLabel className="text-xs">Qté</FormLabel><FormControl><Input placeholder="ex: 5 ou X" {...field} /></FormControl><FormMessage /></FormItem>
                      )}/>
                      <FormField control={form.control} name={`equipments.${index}.name`} render={({ field }) => (
                          <FormItem className="flex-1"><FormLabel className="text-xs">Nom de l'équipement</FormLabel><FormControl><Input placeholder="ex: Ballons de basket" {...field} /></FormControl><FormMessage /></FormItem>
                      )}/>
                      <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => append({ name: '', quantity: '1' })}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Ajouter un équipement
                  </Button>
                </div>

                 <FormField control={form.control} name="sports" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sports*</FormLabel>
                      <FormDescription>Sélectionnez les sports disponibles dans cette installation.</FormDescription>
                      <FormControl>
                        <MultiSelect
                          options={sportOptions}
                          selected={field.value}
                          onChange={(value) => field.onChange(value)}
                          placeholder="Sélectionner des sports..."
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}/>

                 <FormField control={form.control} name="observations" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Observations / Mesures pour réouverture</FormLabel>
                        <FormControl><Textarea {...field}/></FormControl>
                        <FormMessage />
                    </FormItem>
                )}/>
                <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Description (simplifiée)</FormLabel>
                        <FormControl><Textarea placeholder="Décrivez l'installation, ses caractéristiques et ses règles." className="resize-none" {...field}/></FormControl>
                        <FormMessage />
                    </FormItem>
                )}/>
              </div>
            </ScrollArea>
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isSubmitting ? 'Envoi en cours...' : 'Soumettre la Demande'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
