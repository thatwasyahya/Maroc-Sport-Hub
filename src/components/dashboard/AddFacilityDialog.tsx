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
import type { Facility } from '@/lib/types';
import { Checkbox } from '../ui/checkbox';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { ScrollArea } from '../ui/scroll-area';
import { sports } from '@/lib/data';
import { getRegions, getCities } from '@/lib/maroc-api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { PlusCircle, Trash2, Search } from 'lucide-react';
import { MultiSelect } from '@/components/ui/multi-select';
import { geocodeAddress } from '@/services/nominatim';

const facilitySchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  address: z.string().min(5, 'Address is required.'),
  region: z.string().min(2, "Region is required."),
  city: z.string().min(2, "City is required."),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  sports: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "You have to select at least one sport.",
  }),
  equipments: z.array(z.object({
    name: z.string().min(1, 'Equipment name cannot be empty.'),
    quantity: z.string().min(1, 'Quantity is required.'),
  })).optional(),
  type: z.enum(["indoor", "outdoor"]),
  accessible: z.boolean().default(false),
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
      lat: 0,
      lng: 0,
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
  }, [selectedRegion, form]);

  const handleGeocode = async () => {
    const address = form.getValues("address");
    const city = form.getValues("city");
    const region = form.getValues("region");
    
    if (!address || !city || !region) {
      toast({
        variant: "destructive",
        title: "Address Incomplete",
        description: "Please fill in the address, city, and region fields before geocoding.",
      });
      return;
    }

    setIsGeocoding(true);
    try {
      const fullAddress = `${address}, ${city}, ${region}, Morocco`;
      const location = await geocodeAddress(fullAddress);
      if (location) {
        form.setValue("lat", location.lat, { shouldValidate: true });
        form.setValue("lng", location.lng, { shouldValidate: true });
        toast({
          title: "Location Found",
          description: `Coordinates set to: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Location Not Found",
          description: "Could not find coordinates for the entered address. Please check the address or enter coordinates manually.",
        });
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      toast({
        variant: "destructive",
        title: "Geocoding Error",
        description: "An error occurred while trying to find the address.",
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
     if (data.lat === 0 || data.lng === 0) {
      toast({ variant: 'destructive', title: 'Coordinates Missing', description: 'Please geocode the address to get coordinates before submitting.' });
      return;
    }
    setIsSubmitting(true);
    try {
      const facilitiesCollectionRef = collection(firestore, 'facilities');
      
      const { lat, lng, ...restOfData } = data;
      
      const newFacilityData: Omit<Facility, 'id' | 'photos' > & { createdAt: any, updatedAt: any } = {
        ...restOfData,
        adminId: user.uid,
        location: { lat, lng },
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Add New Facility</DialogTitle>
          <DialogDescription>
            Fill in the details below to add a new sports facility.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <ScrollArea className="h-[60vh] p-4">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Facility Name</FormLabel>
                      <FormControl>
                          <Input placeholder="e.g., City Stadium" {...field} />
                      </FormControl>
                      <FormMessage />
                      </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                      control={form.control}
                      name="region"
                      render={({ field }) => (
                      <FormItem>
                          <FormLabel>Region</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                              <SelectTrigger>
                              <SelectValue placeholder="Select a region" />
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
                          <FormLabel>City</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} disabled={!selectedRegion}>
                          <FormControl>
                              <SelectTrigger>
                              <SelectValue placeholder="Select a city" />
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
                 <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Address</FormLabel>
                        <div className="flex gap-2">
                            <FormControl>
                                <Input placeholder="e.g., 123 Main St" {...field} />
                            </FormControl>
                            <Button type="button" onClick={handleGeocode} disabled={isGeocoding}>
                                <Search className="mr-2 h-4 w-4" />
                                {isGeocoding ? 'Searching...' : 'Geocode'}
                            </Button>
                        </div>
                      <FormMessage />
                      </FormItem>
                  )}
                />
                 <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="lat"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Latitude</FormLabel>
                          <FormControl>
                            <Input type="number" step="any" placeholder="e.g., 33.5731" {...field} />
                          </FormControl>
                           <FormDescription>Click Geocode to fill automatically.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="lng"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Longitude</FormLabel>
                          <FormControl>
                            <Input type="number" step="any" placeholder="e.g., -7.5898" {...field} />
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
                          placeholder="Describe the facility, its features, and rules."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4 rounded-md border p-4 mt-4">
                  <div className="mb-4">
                    <FormLabel>Equipments</FormLabel>
                  </div>
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex items-end gap-2">
                      <FormField
                        control={form.control}
                        name={`equipments.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem className="w-24">
                            <FormLabel className="text-xs">Quantity</FormLabel>
                             <FormControl>
                                <Input placeholder="e.g., 5 or X" {...field} />
                              </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`equipments.${index}.name`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel className="text-xs">Equipment Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Basketballs" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => append({ name: '', quantity: '1' })}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Equipment
                  </Button>
                </div>

                 <FormField
                  control={form.control}
                  name="sports"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sports</FormLabel>
                       <FormDescription>Select the sports available at this facility.</FormDescription>
                      <FormControl>
                        <MultiSelect
                          options={sportOptions}
                          selected={field.value}
                          onChange={(value) => {
                            field.onChange(value);
                          }}
                          placeholder="Select sports..."
                          className="w-full"
                        />
                      </FormControl>
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
                                        <FormLabel className="font-normal">Outdoor</FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                        <FormControl>
                                        <RadioGroupItem value="indoor" />
                                        </FormControl>
                                        <FormLabel className="font-normal">Indoor</FormLabel>
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
                                    <FormLabel>PMR Accessible</FormLabel>
                                    <FormDescription>Is this facility accessible for people with reduced mobility?</FormDescription>
                                </div>
                            </FormItem>
                        )}
                    />
                </div>
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
