'use client';

import { useForm } from 'react-hook-form';
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
import { useAuth, useFirestore } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { Checkbox } from '../ui/checkbox';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { ScrollArea } from '../ui/scroll-area';
import { sports } from '@/lib/data';
import { getRegions, getCities } from '@/lib/maroc-api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const facilityRequestSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  address: z.string().min(5, 'Address is required.'),
  region: z.string().min(2, "Region is required."),
  city: z.string().min(2, "City is required."),
  rentalCost: z.coerce.number().min(0, 'Rental cost must be a positive number.'),
  depositCost: z.coerce.number().min(0, 'Deposit cost must be a positive number.'),
  sports: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "You have to select at least one sport.",
  }),
  equipments: z.string().optional(),
  type: z.enum(["indoor", "outdoor"]),
  accessible: z.boolean().default(false),
});

type FacilityRequestFormValues = z.infer<typeof facilityRequestSchema>;

interface AddFacilityRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddFacilityRequestDialog({ open, onOpenChange }: AddFacilityRequestDialogProps) {
  const { user } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const regions = getRegions();
  const [cities, setCities] = useState<string[]>([]);

  const form = useForm<FacilityRequestFormValues>({
    resolver: zodResolver(facilityRequestSchema),
    defaultValues: {
      name: '',
      description: '',
      address: '',
      region: '',
      city: '',
      rentalCost: 0,
      depositCost: 0,
      sports: [],
      equipments: '',
      type: 'outdoor',
      accessible: false,
    },
  });
  
  const selectedRegion = form.watch('region');

  useEffect(() => {
    if (selectedRegion) {
        setCities(getCities(selectedRegion));
        form.setValue('city', '');
    } else {
        setCities([]);
    }
  }, [selectedRegion, form]);

  const onSubmit = async (data: FacilityRequestFormValues) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in.' });
      return;
    }
    setIsSubmitting(true);
    try {
      const requestsCollectionRef = collection(firestore, 'facilityRequests');
      
      const equipmentsArray = data.equipments ? data.equipments.split(',').map(e => e.trim()).filter(e => e) : [];

      await addDoc(requestsCollectionRef, {
        ...data,
        equipments: equipmentsArray,
        userId: user.uid,
        userName: user.displayName || user.email,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast({
        title: 'Request Submitted',
        description: `Your request for ${data.name} has been successfully submitted for review.`,
      });
      form.reset();
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Proposer une Nouvelle Installation</DialogTitle>
          <DialogDescription>
            Remplissez les détails ci-dessous. Votre proposition sera examinée par un administrateur.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <ScrollArea className="h-[60vh] p-4">
              <div className="grid grid-cols-2 gap-4">
                  <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Nom de l'installation</FormLabel>
                      <FormControl>
                          <Input placeholder="e.g., City Stadium" {...field} />
                      </FormControl>
                      <FormMessage />
                      </FormItem>
                  )}
                  />
                  <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Adresse</FormLabel>
                      <FormControl>
                          <Input placeholder="e.g., 123 Main St" {...field} />
                      </FormControl>
                      <FormMessage />
                      </FormItem>
                  )}
                  />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="region"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Région</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Choisir une région" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {regions.map((region) => (
                            <SelectItem key={region.name} value={region.name}>{region.name}</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Ville</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={!selectedRegion}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Choisir une ville" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {cities.map((city) => (
                                <SelectItem key={city} value={city}>{city}</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <FormField
                  control={form.control}
                  name="rentalCost"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Coût de location (MAD/hr)</FormLabel>
                      <FormControl>
                          <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                      </FormItem>
                  )}
                  />
                  <FormField
                  control={form.control}
                  name="depositCost"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Coût de la caution (MAD)</FormLabel>
                      <FormControl>
                          <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                      </FormItem>
                  )}
                  />
              </div>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Décrivez l'installation, ses caractéristiques et ses règles."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="equipments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Équipements</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Saisissez une liste d'équipements séparés par des virgules (ex: Ballons, Cônes, Chasubles)"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                     <FormDescription>
                        Fournissez une liste des équipements disponibles, séparés par des virgules.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sports"
                render={() => (
                  <FormItem>
                    <div className="mb-2">
                      <FormLabel>Sports</FormLabel>
                      <FormDescription>Sélectionnez les sports disponibles dans cette installation.</FormDescription>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                    {sports.map((sport) => (
                      <FormField
                        key={sport}
                        control={form.control}
                        name="sports"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(sport)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...(field.value || []), sport])
                                      : field.onChange(field.value?.filter((value) => value !== sport))
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">{sport}</FormLabel>
                            </FormItem>
                        )}
                      />
                    ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-8 pt-4">
                  <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                          <FormItem className="space-y-3">
                              <FormLabel>Type</FormLabel>
                              <FormControl>
                                  <RadioGroup
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                  className="flex space-x-4"
                                  >
                                  <FormItem className="flex items-center space-x-2 space-y-0">
                                      <FormControl>
                                      <RadioGroupItem value="outdoor" />
                                      </FormControl>
                                      <FormLabel className="font-normal">Extérieur</FormLabel>
                                  </FormItem>
                                  <FormItem className="flex items-center space-x-2 space-y-0">
                                      <FormControl>
                                      <RadioGroupItem value="indoor" />
                                      </FormControl>
                                      <FormLabel className="font-normal">Intérieur</FormLabel>
                                  </FormItem>
                                  </RadioGroup>
                              </FormControl>
                              <FormMessage />
                          </FormItem>
                      )}
                  />
                  <FormField
                      control={form.control}
                      name="accessible"
                      render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 rounded-md border p-3">
                              <FormControl>
                                  <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                  <FormLabel>Accès PMR</FormLabel>
                                  <FormDescription>Cette installation est-elle accessible aux personnes à mobilité réduite?</FormDescription>
                              </div>
                          </FormItem>
                      )}
                  />
              </div>
            </ScrollArea>
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Envoi en cours...' : 'Soumettre la Demande'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
