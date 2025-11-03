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
import { useState } from 'react';
import type { Facility } from '@/lib/types';
import { Checkbox } from '../ui/checkbox';

const sports = ["Football", "Basketball", "Tennis", "Handball", "Volleyball", "Natation", "Athlétisme", "Yoga", "Musculation", "CrossFit", "Padel"].sort();

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
      await addDoc(facilitiesCollectionRef, {
        ...data,
        adminId: user.uid,
        // Mock data for fields not in form
        location: { lat: 0, lng: 0 },
        photos: ['https://picsum.photos/seed/facility/800/600'],
        equipmentIds: [],
        availability: {}, // Default to empty availability
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      } as Omit<Facility, 'id'|'external_id'> & {createdAt: any, updatedAt: any});

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
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Add New Facility</DialogTitle>
          <DialogDescription>
            Fill in the details below to add a new sports facility.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
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
                  <div className="mb-4">
                    <FormLabel className="text-base">Sports</FormLabel>
                    <FormDescription>
                      Select the sports available at this facility.
                    </FormDescription>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                  {sports.map((sport) => (
                    <FormField
                      key={sport}
                      control={form.control}
                      name="sports"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={sport}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(sport)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...(field.value || []), sport])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== sport
                                        )
                                      )
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {sport}
                            </FormLabel>
                          </FormItem>
                        )
                      }}
                    />
                  ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
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
