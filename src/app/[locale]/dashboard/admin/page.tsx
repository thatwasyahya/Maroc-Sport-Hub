'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone, Facebook, Instagram, Twitter, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import type { Settings as SettingsType } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

const contactSettingsSchema = z.object({
  contactEmail: z.string().email("Format d'email invalide.").optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  facebookUrl: z.string().url("URL invalide").or(z.literal('')).optional(),
  instagramUrl: z.string().url("URL invalide").or(z.literal('')).optional(),
  twitterUrl: z.string().url("URL invalide").or(z.literal('')).optional(),
});

type ContactSettingsFormValues = z.infer<typeof contactSettingsSchema>;

export default function AdminPage() {
  const t = useTranslations('Dashboard.Admin');
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const settingsDocRef = useMemoFirebase(() => (
    firestore ? doc(firestore, 'settings', 'global') : null
  ), [firestore]);

  const { data: settings, isLoading } = useDoc<SettingsType>(settingsDocRef);

  const form = useForm<ContactSettingsFormValues>({
    resolver: zodResolver(contactSettingsSchema),
    defaultValues: {
      contactEmail: '',
      contactPhone: '',
      facebookUrl: '',
      instagramUrl: '',
      twitterUrl: '',
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        contactEmail: settings.contactEmail || '',
        contactPhone: settings.contactPhone || '',
        facebookUrl: settings.facebookUrl || '',
        instagramUrl: settings.instagramUrl || '',
        twitterUrl: settings.twitterUrl || '',
      });
    }
  }, [settings, form]);

  const onSubmit = async (data: ContactSettingsFormValues) => {
    if (!settingsDocRef) return;
    setIsSubmitting(true);
    try {
      await setDocumentNonBlocking(settingsDocRef, { 
        ...data, 
        updatedAt: serverTimestamp() 
      }, { merge: true });
      
      toast({
        title: 'Coordonnées mises à jour',
        description: 'Les informations de contact ont été enregistrées.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la mise à jour.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Mail className="h-8 w-8"/>
            Coordonnées et Réseaux Sociaux
          </h1>
          <p className="text-muted-foreground">
            Gérez les informations de contact affichées sur le site
          </p>
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/3" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Informations de Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email de contact</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="contact@example.com" {...field} />
                      </FormControl>
                      <FormDescription>
                        Email affiché sur la page de contact
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Téléphone de contact</FormLabel>
                      <FormControl>
                        <Input placeholder="+212 5 37 00 00 00" {...field} />
                      </FormControl>
                      <FormDescription>
                        Numéro de téléphone affiché sur la page de contact
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Social Media */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Facebook className="h-5 w-5" />
                  Réseaux Sociaux
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="facebookUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Facebook className="h-4 w-4" />
                        Facebook
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="https://facebook.com/..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="instagramUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Instagram className="h-4 w-4" />
                        Instagram
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="https://instagram.com/..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="twitterUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Twitter className="h-4 w-4" />
                        Twitter
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="https://twitter.com/..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end gap-2">
              <Button type="submit" disabled={isSubmitting} size="lg">
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}
