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
import { useFirestore } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import type { User } from '@/lib/types';
import { useTranslations } from 'next-intl';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';

const profileSchema = z.object({
  name: z.string().min(2, 'Le nom est requis.'),
  avatarUrl: z.string().url("L'URL de l'avatar doit être une URL valide.").optional().or(z.literal('')),
  phoneNumber: z.string().optional(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
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

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      avatarUrl: '',
      phoneNumber: '',
      gender: undefined,
    },
  });

  useEffect(() => {
    if (user && open) {
      form.reset({
        name: user.name,
        avatarUrl: user.avatarUrl || '',
        phoneNumber: user.phoneNumber || '',
        gender: user.gender,
      });
    }
  }, [user, open, form]);

  const onSubmit = async (data: ProfileFormValues) => {
    setIsSubmitting(true);
    try {
      const userRef = doc(firestore, 'users', user.id);
      
      const [firstName, ...lastName] = data.name.split(' ');

      await updateDoc(userRef, {
        name: data.name,
        firstName: firstName || '',
        lastName: lastName.join(' ') || '',
        avatarUrl: data.avatarUrl,
        phoneNumber: data.phoneNumber,
        gender: data.gender,
        updatedAt: serverTimestamp(),
      });

      toast({
        title: t('successTitle'),
        description: t('successDescription'),
      });
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        variant: 'destructive',
        title: t('errorTitle'),
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
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
              name="avatarUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('avatarUrlLabel')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('avatarUrlPlaceholder')} {...field} />
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
                    <Input placeholder="0612345678" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                          <SelectItem value="Other">{t('genders.Other')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <DialogFooter className='pt-4'>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>{t('cancel')}</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t('saving') : t('save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
