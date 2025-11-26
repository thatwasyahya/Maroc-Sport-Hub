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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import type { User } from '@/lib/types';
import { useTranslations } from 'next-intl';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '../ui/calendar';
import { sports } from '@/lib/data';
import { MultiSelect } from '../ui/multi-select';

const profileSchema = z.object({
  name: z.string().min(2, 'Le nom est requis.'),
  phoneNumber: z.string().optional(),
  gender: z.enum(['Male', 'Female']).optional(),
  birthDate: z.date().optional(),
  jobTitle: z.string().optional(),
  city: z.string().optional(),
  favoriteSports: z.array(z.string()).optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
}

export default function EditProfileDialog({ open, onOpenChange, user }: EditProfileDialogProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const t = useTranslations('Profile.editDialog');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const sportOptions = sports.map(s => ({label: s, value: s}));

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      phoneNumber: '',
      gender: undefined,
      birthDate: undefined,
      jobTitle: '',
      city: '',
      favoriteSports: [],
    },
  });

  useEffect(() => {
    if (user && open) {
        const birthDate = user.birthDate ? (user.birthDate.seconds ? new Date(user.birthDate.seconds * 1000) : new Date(user.birthDate)) : undefined;
        form.reset({
            name: user.name || '',
            phoneNumber: user.phoneNumber || '',
            gender: user.gender as 'Male' | 'Female' | undefined,
            birthDate: birthDate,
            jobTitle: user.jobTitle || '',
            city: user.city || '',
            favoriteSports: user.favoriteSports || [],
        });
    }
  }, [user, open, form]);

  const onSubmit = (data: ProfileFormValues) => {
    setIsSubmitting(true);
    const userRef = doc(firestore, 'users', user.id);
    
    const [firstName, ...lastName] = data.name.split(' ');

    const updateData: Partial<User> = {
      name: data.name,
      firstName: firstName || '',
      lastName: lastName.join(' ') || '',
      phoneNumber: data.phoneNumber,
      gender: data.gender || null,
      birthDate: data.birthDate || null,
      jobTitle: data.jobTitle,
      city: data.city,
      favoriteSports: data.favoriteSports,
      updatedAt: serverTimestamp(),
    };
    
    updateDocumentNonBlocking(userRef, updateData);

    toast({
      title: t('successTitle'),
      description: t('successDescription'),
    });
    onOpenChange(false);
    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-lg max-h-[90vh] overflow-hidden p-0">
        <div className="flex flex-col h-full max-h-[85vh]">
          <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
            <DialogTitle>{t('title')}</DialogTitle>
            <DialogDescription>{t('description')}</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
              <div className="overflow-y-auto flex-1 px-6">
                <div className="space-y-4 pb-4">
            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>{t('nameLabel')}</FormLabel>
                    <FormControl>
                        <Input {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>{t('phoneLabel')}</FormLabel>
                    <FormControl>
                        <Input placeholder="0612345678" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
             <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('genderLabel')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder={t('genderPlaceholder')} />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="Male">{t('genders.Male')}</SelectItem>
                            <SelectItem value="Female">{t('genders.Female')}</SelectItem>
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="birthDate"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>{t('birthDateLabel')}</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full pl-3 text-left font-normal",
                                                !field.value && "text-muted-foreground"
                                            )}
                                        >
                                            {field.value ? (
                                                format(field.value, "PPP")
                                            ) : (
                                                <span>{t('birthDatePlaceholder')}</span>
                                            )}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        disabled={(date) =>
                                            date > new Date() || date < new Date("1900-01-01")
                                        }
                                        initialFocus
                                        captionLayout="dropdown-buttons"
                                        fromYear={1950}
                                        toYear={new Date().getFullYear() - 10}
                                    />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                    )}
                />
             </div>
             <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="jobTitle"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>{t('jobTitleLabel')}</FormLabel>
                        <FormControl>
                            <Input placeholder={t('jobTitlePlaceholder')} {...field} value={field.value || ''} />
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
                        <FormLabel>{t('cityLabel')}</FormLabel>
                        <FormControl>
                            <Input placeholder={t('cityPlaceholder')} {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            <FormField
                control={form.control}
                name="favoriteSports"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>{t('favoriteSportsLabel')}</FormLabel>
                    <FormControl>
                       <MultiSelect
                            options={sportOptions}
                            selected={field.value || []}
                            onChange={field.onChange}
                            placeholder={t('favoriteSportsPlaceholder')}
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
                </div>
              </div>
              <DialogFooter className='px-6 py-4 border-t flex-shrink-0'>
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>{t('cancel')}</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? t('saving') : t('save')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
