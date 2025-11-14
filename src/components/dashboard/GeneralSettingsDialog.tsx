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
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import type { Settings } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { PlusCircle, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

const linkSchema = z.object({
  label: z.string().min(1, "Le libellé est requis."),
  url: z.string().min(1, "L'URL est requise."),
});

const settingsSchema = z.object({
  appName: z.string().min(3, 'Le nom de l\'application doit comporter au moins 3 caractères.'),
  footerDescription: z.string().min(10, 'La description doit comporter au moins 10 caractères.'),
  heroTitle: z.string().min(5, 'Le titre doit comporter au moins 5 caractères.'),
  heroSubtitle: z.string().min(10, 'Le sous-titre doit comporter au moins 10 caractères.'),
  footerLinks: z.array(linkSchema).optional(),
  contactEmail: z.string().email("Format d'email invalide.").optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  facebookUrl: z.string().url("URL invalide").or(z.literal('')).optional(),
  instagramUrl: z.string().url("URL invalide").or(z.literal('')).optional(),
  twitterUrl: z.string().url("URL invalide").or(z.literal('')).optional(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

interface GeneralSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function GeneralSettingsDialog({ open, onOpenChange }: GeneralSettingsDialogProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const t = useTranslations('Dashboard.Admin.siteSettings');

  const settingsDocRef = useMemoFirebase(() => (
    firestore ? doc(firestore, 'settings', 'global') : null
  ), [firestore]);

  const { data: settings, isLoading } = useDoc<Settings>(settingsDocRef);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      appName: '',
      footerDescription: '',
      heroTitle: '',
      heroSubtitle: '',
      footerLinks: [],
      contactEmail: '',
      contactPhone: '',
      facebookUrl: '',
      instagramUrl: '',
      twitterUrl: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "footerLinks"
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        appName: settings.appName || '',
        footerDescription: settings.footerDescription || '',
        heroTitle: settings.heroTitle || '',
        heroSubtitle: settings.heroSubtitle || '',
        footerLinks: settings.footerLinks || [],
        contactEmail: settings.contactEmail || '',
        contactPhone: settings.contactPhone || '',
        facebookUrl: settings.facebookUrl || '',
        instagramUrl: settings.instagramUrl || '',
        twitterUrl: settings.twitterUrl || '',
      });
    }
  }, [settings, form]);

  const onSubmit = async (data: SettingsFormValues) => {
    if (!settingsDocRef) return;
    setIsSubmitting(true);
    try {
      await setDoc(settingsDocRef, { ...data, updatedAt: serverTimestamp() }, { merge: true });
      toast({
        title: 'Paramètres mis à jour',
        description: 'Les paramètres généraux du site ont été enregistrés.',
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la mise à jour des paramètres.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>
            {t('dialogDescription')}
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
            <div className="space-y-4 py-4">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-20 w-full" />
            </div>
        ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <ScrollArea className="h-[60vh] p-1">
              <div className="space-y-8 p-4">
                {/* General Settings */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg">{t('general.title')}</h3>
                    <FormField control={form.control} name="appName" render={({ field }) => (
                        <FormItem><FormLabel>{t('general.appNameLabel')}</FormLabel><FormControl><Input placeholder="Maroc Sport Hub" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="footerDescription" render={({ field }) => (
                        <FormItem><FormLabel>{t('general.footerDescriptionLabel')}</FormLabel><FormControl><Textarea placeholder={t('general.footerDescriptionPlaceholder')} className="resize-none" {...field}/></FormControl><FormMessage /></FormItem>
                    )}/>
                </div>
                <Separator />

                 {/* Contact Settings */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg">{t('contact.title')}</h3>
                    <FormField control={form.control} name="contactEmail" render={({ field }) => (
                        <FormItem><FormLabel>{t('contact.emailLabel')}</FormLabel><FormControl><Input type="email" placeholder="contact@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="contactPhone" render={({ field }) => (
                        <FormItem><FormLabel>{t('contact.phoneLabel')}</FormLabel><FormControl><Input placeholder="+212 5 37 00 00 00" {...field}/></FormControl><FormMessage /></FormItem>
                    )}/>
                </div>
                <Separator />
                
                {/* Social Settings */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg">{t('social.title')}</h3>
                    <FormField control={form.control} name="facebookUrl" render={({ field }) => (
                        <FormItem><FormLabel>{t('social.facebookLabel')}</FormLabel><FormControl><Input placeholder="https://facebook.com/..." {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="instagramUrl" render={({ field }) => (
                        <FormItem><FormLabel>{t('social.instagramLabel')}</FormLabel><FormControl><Input placeholder="https://instagram.com/..." {...field}/></FormControl><FormMessage /></FormItem>
                    )}/>
                     <FormField control={form.control} name="twitterUrl" render={({ field }) => (
                        <FormItem><FormLabel>{t('social.twitterLabel')}</FormLabel><FormControl><Input placeholder="https://twitter.com/..." {...field}/></FormControl><FormMessage /></FormItem>
                    )}/>
                </div>
                <Separator />


                {/* Homepage Settings */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg">{t('homepage.title')}</h3>
                    <FormField control={form.control} name="heroTitle" render={({ field }) => (
                        <FormItem><FormLabel>{t('homepage.heroTitleLabel')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="heroSubtitle" render={({ field }) => (
                        <FormItem><FormLabel>{t('homepage.heroSubtitleLabel')}</FormLabel><FormControl><Textarea className="resize-none" {...field}/></FormControl><FormMessage /></FormItem>
                    )}/>
                </div>
                <Separator />

                {/* Footer Links */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg">{t('footer.title')}</h3>
                    <div className="space-y-4">
                      {fields.map((field, index) => (
                        <div key={field.id} className="flex items-end gap-2 p-3 border rounded-lg">
                          <FormField control={form.control} name={`footerLinks.${index}.label`} render={({ field }) => (
                              <FormItem className="flex-1"><FormLabel>{t('footer.labelLabel')}</FormLabel><FormControl><Input placeholder="Accueil" {...field} /></FormControl><FormMessage /></FormItem>
                          )}/>
                          <FormField control={form.control} name={`footerLinks.${index}.url`} render={({ field }) => (
                              <FormItem className="flex-1"><FormLabel>{t('footer.urlLabel')}</FormLabel><FormControl><Input placeholder="/contact" {...field} /></FormControl><FormMessage /></FormItem>
                          )}/>
                          <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      ))}
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => append({ label: '', url: '' })}>
                      <PlusCircle className="mr-2 h-4 w-4" /> {t('footer.addLinkButton')}
                    </Button>
                </div>
              </div>
            </ScrollArea>
            <DialogFooter className="pt-6 border-t">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>{t('cancelButton')}</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t('savingButton') : t('saveButton')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
