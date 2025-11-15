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
import { useFirestore, updateDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import type { User, UserRole } from '@/lib/types';
import { useTranslations } from 'next-intl';
import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '../ui/calendar';
import { MultiSelect } from '../ui/multi-select';
import { sports } from '@/lib/data';

const userSchema = z.object({
  name: z.string().min(2, 'Name is required.'),
  email: z.string().email('Invalid email address.'),
  password: z.string().optional(),
  role: z.enum(['user', 'admin', 'super_admin']),
  phoneNumber: z.string().optional(),
  gender: z.enum(['Male', 'Female']).optional(),
  birthDate: z.date().optional(),
  jobTitle: z.string().optional(),
  city: z.string().optional(),
  favoriteSports: z.array(z.string()).optional(),
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
  
  const sportOptions = sports.map(s => ({label: s, value: s}));

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'user',
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
        name: user.name,
        email: user.email,
        role: user.role,
        password: '',
        phoneNumber: user.phoneNumber || '',
        gender: user.gender as 'Male' | 'Female' | undefined,
        birthDate: birthDate,
        jobTitle: user.jobTitle || '',
        city: user.city || '',
        favoriteSports: user.favoriteSports || [],
      });
    } else if (!user && open) {
      form.reset({
        name: '',
        email: '',
        password: '',
        role: 'user',
        phoneNumber: '',
        gender: undefined,
        birthDate: undefined,
        jobTitle: '',
        city: '',
        favoriteSports: [],
      });
    }
  }, [user, open, form]);

  const onSubmit = (data: UserFormValues) => {
    setIsSubmitting(true);
    if (isEditing && user) {
      const userRef = doc(firestore, 'users', user.id);
      
      const updateData: Partial<User> = {
          name: data.name,
          role: data.role,
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
        title: t('updateSuccessTitle'),
        description: t('updateSuccessDescription'),
      });
    } else {
      if (!data.password) {
          form.setError("password", { message: "Password is required for new users."});
          setIsSubmitting(false);
          return;
      }
      const userDocRef = doc(firestore, 'users', data.email); // Using email as ID for simplicity
      const [firstName, ...lastName] = data.name.split(' ');

      setDocumentNonBlocking(userDocRef, {
          name: data.name,
          firstName: firstName || '',
          lastName: lastName.join(' ') || '',
          email: data.email,
          role: data.role,
          phoneNumber: data.phoneNumber,
          gender: data.gender || null,
          birthDate: data.birthDate || null,
          jobTitle: data.jobTitle,
          city: data.city,
          favoriteSports: data.favoriteSports,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
      }, { merge: false });
      toast({
        title: t('addSuccessTitle'),
        description: t('addSuccessDescription'),
      });
    }
    form.reset();
    onOpenChange(false);
    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? t('editUserTitle') : t('addUserTitle')}</DialogTitle>
          <DialogDescription>{isEditing ? t('editUserDescription') : t('addUserDescription')}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
             <div className="grid grid-cols-2 gap-4">
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
            </div>
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
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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
