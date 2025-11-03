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
import { useAuth, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import type { Equipment, Facility } from '@/lib/types';
import { Checkbox } from '../ui/checkbox';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { ScrollArea } from '../ui/scroll-area';
import { sports } from '@/lib/data';

const facilitySchema = z.object({
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
  equipmentIds: z.array(z.string()).default([]),
  type: z.enum(["indoor", "outdoor"]),
  accessible: z.boolean().default(false),
});

type FacilityFormValues = z.infer<typeof facilitySchema>;

interface AddFacilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddFacilityDialog({ open, onOpenChange }: AddFacilityDialogProps) {
  const { user } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const equipmentsCollectionRef = useMemoFirebase(
    () => collection(firestore, 'equipments'),
    [firestore]
  );
  const { data: allEquipments } = useCollection<Equipment>(equipmentsCollectionRef);

  const form = useForm<FacilityFormValues>({
    resolver: zodResolver(facilitySchema),
    defaultValues: {
      name: '',
      description: '',
      address: '',
      region: '',
      city: '',
      rentalCost: 0,
      depositCost: 0,
      sports: [],
      equipmentIds: [],
      type: 'outdoor',
      accessible: false,
    },
  });

  const onSubmit = async (data: FacilityFormValues) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in.' });
      return;
    }
    setIsSubmitting(true);
    try {
      const facilitiesCollectionRef = collection(firestore, 'facilities');
      
      const newFacilityData: Omit<Facility, 'id' | 'availability' | 'photos'> & { createdAt: any, updatedAt: any } = {
        ...data,
        adminId: user.uid,
        location: { lat: 33.5731, lng: -7.5898 }, // Default to Casablanca for now
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
              <div className="grid grid-cols-2 gap-4">
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
                  <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Address</FormLabel>
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
                      <FormLabel>Region</FormLabel>
                      <FormControl>
                          <Input placeholder="e.g., Casablanca-Settat" {...field} />
                      </FormControl>
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
                      <FormControl>
                          <Input placeholder="e.g., Casablanca" {...field} />
                      </FormControl>
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
                      <FormLabel>Rental Cost (MAD/hr)</FormLabel>
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
                      <FormLabel>Deposit Cost (MAD)</FormLabel>
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
                        placeholder="Describe the facility, its features, and rules."
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
                name="sports"
                render={() => (
                  <FormItem>
                    <div className="mb-2">
                      <FormLabel>Sports</FormLabel>
                      <FormDescription>Select the sports available at this facility.</FormDescription>
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
              {allEquipments && allEquipments.length > 0 && (
                <FormField
                  control={form.control}
                  name="equipmentIds"
                  render={() => (
                    <FormItem>
                       <div className="mb-2">
                        <FormLabel>Equipment</FormLabel>
                        <FormDescription>Select the equipment available at this facility.</FormDescription>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {allEquipments.map((equipment) => (
                          <FormField
                            key={equipment.id}
                            control={form.control}
                            name="equipmentIds"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(equipment.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...(field.value || []), equipment.id])
                                        : field.onChange(field.value?.filter((id) => id !== equipment.id));
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">{equipment.name}</FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
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
