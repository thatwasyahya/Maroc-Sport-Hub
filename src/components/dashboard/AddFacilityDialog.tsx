'use client';

import { useForm, useFieldArray } from 'react-hook-form';
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
import type { Facility, EstablishmentState, BuildingState, EquipmentState } from '@/lib/types';
import { Checkbox } from '../ui/checkbox';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { ScrollArea } from '../ui/scroll-area';
import { sports } from '@/lib/data';
import { getRegions, getCities } from '@/lib/maroc-api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { PlusCircle, Trash2, Search, CalendarIcon } from 'lucide-react';
import { MultiSelect } from '@/components/ui/multi-select';
import { geocodeAddress } from '@/services/nominatim';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar } from '../ui/calendar';

const facilitySchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  description: z.string().optional(),
  address: z.string().min(1, 'Address is required.'),
  region: z.string().min(1, "Region is required."),
  province: z.string().optional(),
  commune: z.string().optional(),
  city: z.string().min(1, "City is required."),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
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

type FacilityFormValues = z.infer<typeof facilitySchema>;

interface AddFacilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddFacilityDialog({ open, onOpenChange }: AddFacilityDialogProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingStatus, setGeocodingStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  const regions = getRegions();
  const [cities, setCities] = useState<string[]>([]);
  
  const sportOptions = sports.map(sport => ({ value: sport, label: sport }));

  const form = useForm<FacilityFormValues>({
    resolver: zodResolver(facilitySchema),
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
        form.setValue("lat", location.lat);
        form.setValue("lng", location.lng);
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

  const onSubmit = async (data: FacilityFormValues) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in.' });
      return;
    }
     if (!data.lat || !data.lng) {
      toast({ variant: 'destructive', title: 'Coordonnées manquantes', description: "Veuillez utiliser le bouton 'Trouver sur la carte' pour obtenir les coordonnées avant de soumettre." });
      return;
    }
    setIsSubmitting(true);
    try {
      const facilitiesCollectionRef = collection(firestore, 'facilities');
      
      const location = {
        lat: data.lat,
        lng: data.lng,
      };

      const { lat, lng, ...restOfData } = data;
      
      const newFacilityData: Partial<Facility> = {
        ...restOfData,
        adminId: user.uid,
        location,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      await addDoc(facilitiesCollectionRef, newFacilityData);

      toast({
        title: 'Facility Added',
        description: `${data.name} has been successfully created.`,
      });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding facility:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred while adding the facility.',
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
          <DialogTitle>Add New Facility</DialogTitle>
          <DialogDescription>
            Fill in the details below to add a new sports facility.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <ScrollArea className="h-[70vh] p-4">
              <div className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Facility Name*</FormLabel>
                            <FormControl><Input placeholder="e.g., City Stadium" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="category" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Category</FormLabel>
                            <FormControl><Input placeholder="e.g., Stade, Salle couverte" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField control={form.control} name="region" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Region*</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select a region" /></SelectTrigger></FormControl>
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
                            <FormLabel>City*</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} disabled={!selectedRegion}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select a city" /></SelectTrigger></FormControl>
                                <SelectContent>{cities.map((city) => (<SelectItem key={city} value={city}>{city}</SelectItem>))}</SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}/>
                </div>
                
                 <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Address*</FormLabel>
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
                        <FormControl><Textarea placeholder="Describe the facility, its features, and rules." className="resize-none" {...field}/></FormControl>
                        <FormMessage />
                    </FormItem>
                )}/>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField control={form.control} name="ownership" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Ownership</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>
                    <FormField control={form.control} name="managing_entity" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Managing Entity</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>
                    <FormField control={form.control} name="last_renovation_date" render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Last Renovation Date</FormLabel>
                             <Popover>
                                <PopoverTrigger asChild>
                                <FormControl>
                                    <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
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
                            <FormLabel>Surface Area (m²)</FormLabel>
                            <FormControl><Input type="number" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>
                     <FormField control={form.control} name="capacity" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Capacity</FormLabel>
                            <FormControl><Input type="number" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>
                     <FormField control={form.control} name="staff_count" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Staff Count</FormLabel>
                            <FormControl><Input type="number" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>
                </div>
                
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField control={form.control} name="establishment_state" render={({ field }) => (
                        <FormItem><FormLabel>Establishment State</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger></FormControl>
                                <SelectContent>{establishmentStates.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                            </Select>
                        <FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="building_state" render={({ field }) => (
                        <FormItem><FormLabel>Building State</FormLabel>
                             <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger></FormControl>
                                <SelectContent>{buildingStates.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                            </Select>
                        <FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="equipment_state" render={({ field }) => (
                        <FormItem><FormLabel>Equipment State</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger></FormControl>
                                <SelectContent>{equipmentStates.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                            </Select>
                        <FormMessage /></FormItem>
                    )}/>
                </div>

                <div className="space-y-4 rounded-md border p-4 mt-4">
                  <h3 className="text-sm font-medium">Equipments</h3>
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex items-end gap-2">
                      <FormField control={form.control} name={`equipments.${index}.quantity`} render={({ field }) => (
                          <FormItem className="w-24"><FormLabel className="text-xs">Quantity</FormLabel><FormControl><Input placeholder="e.g., 5 or X" {...field} /></FormControl><FormMessage /></FormItem>
                      )}/>
                      <FormField control={form.control} name={`equipments.${index}.name`} render={({ field }) => (
                          <FormItem className="flex-1"><FormLabel className="text-xs">Equipment Name</FormLabel><FormControl><Input placeholder="e.g., Basketballs" {...field} /></FormControl><FormMessage /></FormItem>
                      )}/>
                      <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => append({ name: '', quantity: '1' })}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Equipment
                  </Button>
                </div>

                 <FormField control={form.control} name="sports" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sports*</FormLabel>
                       <FormDescription>Select the sports available at this facility.</FormDescription>
                      <FormControl>
                        <MultiSelect
                          options={sportOptions}
                          selected={field.value}
                          onChange={(value) => {field.onChange(value)}}
                          placeholder="Select sports..."
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
                                        <FormLabel className="font-normal">Outdoor</FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                        <FormControl><RadioGroupItem value="indoor" /></FormControl>
                                        <FormLabel className="font-normal">Indoor</FormLabel>
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
                                <FormLabel>PMR Accessible</FormLabel>
                                <FormDescription>Is this facility accessible for people with reduced mobility?</FormDescription>
                            </div>
                        </FormItem>
                    )}/>
                </div>
                 <FormField control={form.control} name="observations" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Observations</FormLabel>
                        <FormControl><Textarea placeholder="Any other observations..." className="resize-none" {...field}/></FormControl>
                        <FormMessage />
                    </FormItem>
                )}/>
              </div>
            </ScrollArea>
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Adding...' : 'Add Facility'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
