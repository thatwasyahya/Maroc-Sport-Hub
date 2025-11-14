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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFirestore } from '@/firebase';
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import type { User, UserRole } from '@/lib/types';
import { useTranslations } from 'next-intl';

const userSchema = z.object({
  name: z.string().min(2, 'Name is required.'),
  email: z.string().email('Invalid email address.'),
  password: z.string().optional(),
  role: z.enum(['user', 'admin', 'super_admin']),
  phoneNumber: z.string().optional(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
}).refine(data => !data.password || data.password.length >= 6, {
    message: "Password must be at least 6 characters long.",
    path: ["password"],
});

type UserFormValues = z.infer<typeof userSchema>;

interface UserEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
}

export default function UserEditDialog({ open, onOpenChange, user }: UserEditDialogProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const t = useTranslations('Dashboard.Users.form');
  const tUsers = useTranslations('Dashboard.Users');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!user;

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'user',
      phoneNumber: '',
      gender: undefined,
    },
  });

  useEffect(() => {
    if (user && open) {
      form.reset({
        name: user.name,
        email: user.email,
        role: user.role,
        password: '',
        phoneNumber: user.phoneNumber || '',
        gender: user.gender,
      });
    } else if (!user && open) {
      form.reset({
        name: '',
        email: '',
        password: '',
        role: 'user',
        phoneNumber: '',
        gender: undefined,
      });
    }
  }, [user, open, form]);

  const onSubmit = async (data: UserFormValues) => {
    setIsSubmitting(true);
    try {
      if (isEditing && user) {
        // Update existing user
        const userRef = doc(firestore, 'users', user.id);
        
        const updateData: Partial<User> = {
            name: data.name,
            role: data.role,
            phoneNumber: data.phoneNumber,
            gender: data.gender || null,
            updatedAt: serverTimestamp(),
        };

        await updateDoc(userRef, updateData);
        toast({
          title: t('updateSuccessTitle'),
          description: t('updateSuccessDescription'),
        });
      } else {
        // NOTE: This creates a user document in Firestore, but DOES NOT create an
        // authentication entry in Firebase Auth. This is a simplified approach.
        if (!data.password) {
            form.setError("password", { message: "Password is required for new users."});
            setIsSubmitting(false);
            return;
        }
        const userDocRef = doc(firestore, 'users', data.email); // Using email as ID for simplicity
        const [firstName, ...lastName] = data.name.split(' ');

        await setDoc(userDocRef, {
            name: data.name,
            firstName: firstName || '',
            lastName: lastName.join(' ') || '',
            email: data.email,
            role: data.role,
            phoneNumber: data.phoneNumber,
            gender: data.gender || null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        toast({
          title: t('addSuccessTitle'),
          description: t('addSuccessDescription'),
        });
      }
      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving user:', error);
      toast({
        variant: 'destructive',
        title: isEditing ? t('updateErrorTitle') : t('addErrorTitle'),
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? t('editUserTitle') : t('addUserTitle')}</DialogTitle>
          <DialogDescription>{isEditing ? t('editUserDescription') : t('addUserDescription')}</DialogDescription>
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
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('emailLabel')}</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="m@example.com" {...field} disabled={isEditing} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
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
                          <SelectItem value="Male">{tUsers('genders.Male')}</SelectItem>
                          <SelectItem value="Female">{tUsers('genders.Female')}</SelectItem>
                          <SelectItem value="Other">{tUsers('genders.Other')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {!isEditing && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('passwordLabel')}</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormDescription>{t('passwordHelp')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('roleLabel')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(['user', 'admin', 'super_admin'] as UserRole[]).map(role => (
                          <SelectItem key={role} value={role}>{tUsers(`roles.${role}`)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>{tUsers('cancel')}</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting 
                    ? (isEditing ? t('updatingButton') : t('addingButton'))
                    : (isEditing ? t('updateButton') : t('addButton'))}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
