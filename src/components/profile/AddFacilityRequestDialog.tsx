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
import { useUser, useFirestore } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { Checkbox } from '../ui/checkbox';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { ScrollArea } from '../ui/scroll-area';
import { sports } from '@/lib/data';
import { getRegions, getCities } from '@/lib/maroc-api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { PlusCircle, Trash2, Search, Loader2, CalendarIcon } from 'lucide-react';
import { MultiSelect } from '@/components/ui/multi-select';
import type { FacilityRequest, EstablishmentState, BuildingState, EquipmentState } from '@/lib/types';
import { geocodeAddress } from '@/services/nominatim';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar } from '../ui/calendar';

const facilityRequestSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  description: z.string().optional(),
  address: z.string().min(1, 'Address is required.'),
  region: z.string().min(1, "Region is required."),
  province: z.string().optional(),
  commune: z.string().optional(),
  city: z.string().min(1, "City is required."),
  sports: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "You have to select at least one sport.",
  }),
  equipments: z.array(z.object({
    name: z.string().min(1, 'Equipment name cannot be empty.'),
    quantity: z.string().min(1, 'Quantity is required.'),
  })).optional(),
  type: z.enum(["indoor", "outdoor"]),
  accessible: z.boolean().default(false),
  
  // New fields
  reference_region: z.string().optional(),
  milieu: z.enum(['Urbain', 'Rural']).optional(),
  category: z.string().optional(),
  ownership: z.string().optional(),
  managing_entity: z.string().optional(),
  last_renovation_date: z.date().optional(),
  surface_area: z.coerce.number().optional(),
  capacity: z.coerce.number().optional(),
  staff_count: z.coerce.number().optional(),
  establishment_state: z.enum(['Opérationnel', 'En arrêt', 'Prêt', 'En cours de transformation', 'En cours de construction', 'Non défini']).optional(),
  developed_space: z.string().optional(),
  building_state: z.enum(['Bon', 'Moyen', 'Mauvais', 'Médiocre', 'Non défini']).optional(),
  equipment_state: z.enum(['Non équipé', 'Bon', 'Moyen', 'Mauvais', 'Médiocre', 'Non défini']).optional(),
  sports_staff_count: z.coerce.number().optional(),
  hr_needs: z.string().optional(),
  rehabilitation_plan: z.string().optional(),
  development_basin: z.string().optional(),
  equipment_basin: z.string().optional(),
  beneficiaries: z.string().optional(),
  observations: z.string().optional(),
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
  const [cities, setCities] = useState<string[]>([]);

  const sportOptions = sports.map(sport => ({ value: sport, label: sport }));

  const form = useForm<FacilityRequestFormValues>({
    resolver: zodResolver(facilityRequestSchema),
    defaultValues: {
      name: '',
      description: '',
      address: '',
      region: '',
      city: '',
      sports: [],
      equipments: [],
      type: 'outdoor',
      accessible: false,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "equipments",
  });
  
  const selectedRegion = form.watch('region');

  useEffect(() => {
    if (selectedRegion) {
        setCities(getCities(selectedRegion));
        form.setValue('city', '');
    } else {
        setCities([]);
    }
    setGeocodingStatus('idle');
  }, [selectedRegion, form]);

  const addressWatched = form.watch('address');
  const cityWatched = form.watch('city');
  useEffect(() => {
    setGeocodingStatus('idle');
  }, [addressWatched, cityWatched]);

  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  const handleGeocode = async () => {
    const address = form.getValues("address");
    const city = form.getValues("city");
    const region = form.getValues("region");
    
    if (!address || !city || !region) {
      toast({
        variant: "destructive",
        title: "Adresse incomplète",
        description: "Veuillez remplir l'adresse, la ville et la région avant de continuer.",
      });
      return;
    }

    setIsGeocoding(true);
    setGeocodingStatus('idle');
    try {
      const fullAddress = `${address}, ${city}, ${region}, Morocco`;
      const location = await geocodeAddress(fullAddress);
      if (location) {
        setLat(location.lat);
        setLng(location.lng);
        setGeocodingStatus('success');
        toast({
          title: "Emplacement trouvé",
          description: `Les coordonnées ont été trouvées et seront sauvegardées.`,
        });
      } else {
        setGeocodingStatus('error');
        toast({
          variant: "destructive",
          title: "Emplacement introuvable",
          description: "Impossible de trouver les coordonnées. Veuillez vérifier l'adresse.",
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

  const onSubmit = async (data: FacilityRequestFormValues) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in.' });
      return;
    }
    if (lat === null || lng === null) {
      toast({ variant: 'destructive', title: 'Coordonnées manquantes', description: "Veuillez utiliser le bouton 'Trouver sur la carte' pour obtenir les coordonnées avant de soumettre." });
      return;
    }
    setIsSubmitting(true);
    try {
      const location = { lat, lng };

      const newRequestData: Omit<FacilityRequest, 'id'> = {
        ...data,
        userId: user.uid,
        userName: user.displayName || user.email || 'Anonymous',
        userEmail: user.email || '',
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        location,
      };

      const requestsCollectionRef = collection(firestore, 'facilityRequests');
      await addDoc(requestsCollectionRef, newRequestData);

      toast({
        title: 'Request Submitted',
        description: `Your request for ${data.name} has been successfully submitted for review.`,
      });
      form.reset();
      setLat(null);
      setLng(null);
      setGeocodingStatus('idle');
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding facility request:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred while submitting your request.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const establishmentStates: EstablishmentState[] = ['Opérationnel', 'En arrêt', 'Prêt', 'En cours de transformation', 'En cours de construction', 'Non défini'];
  const buildingStates: BuildingState[] = ['Bon', 'Moyen', 'Mauvais', 'Médiocre', 'Non défini'];
  const equipmentStates: EquipmentState[] = ['Non équipé', 'Bon', 'Moyen', 'Mauvais', 'Médiocre', 'Non défini'];


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nom de l'installation*</FormLabel>
                            <FormControl><Input placeholder="e.g., City Stadium" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="category" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Catégorie</FormLabel>
                            <FormControl><Input placeholder="e.g., Stade, Salle couverte" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField control={form.control} name="region" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Région*</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Choisir une région" /></SelectTrigger></FormControl>
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
                     <FormField control={form.control} name="city" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Ville*</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} disabled={!selectedRegion}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Choisir une ville" /></SelectTrigger></FormControl>
                                <SelectContent>{cities.map((city) => (<SelectItem key={city} value={city}>{city}</SelectItem>))}</SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}/>
                </div>
                
                 <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Adresse*</FormLabel>
                        <div className="flex gap-2 items-start">
                            <FormControl><Input placeholder="e.g., 123 Main St" {...field} /></FormControl>
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

                <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl><Textarea placeholder="Décrivez l'installation, ses caractéristiques et ses règles." className="resize-none" {...field}/></FormControl>
                        <FormMessage />
                    </FormItem>
                )}/>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField control={form.control} name="ownership" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Propriété</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>
                    <FormField control={form.control} name="managing_entity" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Entité Gestionnaire</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>
                    <FormField control={form.control} name="last_renovation_date" render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Date dernière rénovation</FormLabel>
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                     <FormField control={form.control} name="staff_count" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Effectif</FormLabel>
                            <FormControl><Input type="number" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>
                </div>
                
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField control={form.control} name="establishment_state" render={({ field }) => (
                        <FormItem><FormLabel>État de l'établissement</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Choisir un état" /></SelectTrigger></FormControl>
                                <SelectContent>{establishmentStates.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                            </Select>
                        <FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="building_state" render={({ field }) => (
                        <FormItem><FormLabel>État du bâtiment</FormLabel>
                             <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Choisir un état" /></SelectTrigger></FormControl>
                                <SelectContent>{buildingStates.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                            </Select>
                        <FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="equipment_state" render={({ field }) => (
                        <FormItem><FormLabel>État des équipements</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Choisir un état" /></SelectTrigger></FormControl>
                                <SelectContent>{equipmentStates.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                            </Select>
                        <FormMessage /></FormItem>
                    )}/>
                </div>

                <div className="space-y-4 rounded-md border p-4 mt-4">
                  <h3 className="text-sm font-medium">Équipements</h3>
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

                <div className="flex gap-8 pt-4">
                    <FormField control={form.control} name="type" render={({ field }) => (
                        <FormItem className="space-y-3">
                            <FormLabel>Type</FormLabel>
                            <FormControl>
                                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                        <FormControl><RadioGroupItem value="outdoor" /></FormControl>
                                        <FormLabel className="font-normal">Extérieur</FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                        <FormControl><RadioGroupItem value="indoor" /></FormControl>
                                        <FormLabel className="font-normal">Intérieur</FormLabel>
                                    </FormItem>
                                </RadioGroup>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>
                    <FormField control={form.control} name="accessible" render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 rounded-md border p-3">
                            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange}/></FormControl>
                            <div className="space-y-1 leading-none">
                                <FormLabel>Accès PMR</FormLabel>
                                <FormDescription>Cette installation est-elle accessible aux personnes à mobilité réduite?</FormDescription>
                            </div>
                        </FormItem>
                    )}/>
                </div>
                 <FormField control={form.control} name="observations" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Observations</FormLabel>
                        <FormControl><Textarea placeholder="Toute autre observation..." className="resize-none" {...field}/></FormControl>
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
