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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="h-8 w-8"/>
            {t('title')}
          </h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting}>
          <Save className="mr-2 h-4 w-4" />
          {isSubmitting ? tSettings('savingButton') : tSettings('saveButton')}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* General Settings */}
            <Card>
              <CardHeader>
                <CardTitle>{tSettings('general.title')}</CardTitle>
                <CardDescription>Configurez les informations générales de votre site</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField control={form.control} name="appName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tSettings('general.appNameLabel')}</FormLabel>
                    <FormControl><Input placeholder="Maroc Sport Hub" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>
                <FormField control={form.control} name="footerDescription" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tSettings('general.footerDescriptionLabel')}</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder={tSettings('general.footerDescriptionPlaceholder')} 
                        className="resize-none min-h-[100px]" 
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>
              </CardContent>
            </Card>

            {/* Contact Settings */}
            <Card>
              <CardHeader>
                <CardTitle>{tSettings('contact.title')}</CardTitle>
                <CardDescription>Coordonnées de contact affichées sur le site</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField control={form.control} name="contactEmail" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tSettings('contact.emailLabel')}</FormLabel>
                      <FormControl><Input type="email" placeholder="contact@example.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}/>
                  <FormField control={form.control} name="contactPhone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tSettings('contact.phoneLabel')}</FormLabel>
                      <FormControl><Input placeholder="+212 5 37 00 00 00" {...field}/></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}/>
                </div>
              </CardContent>
            </Card>

            {/* Social Settings */}
            <Card>
              <CardHeader>
                <CardTitle>{tSettings('social.title')}</CardTitle>
                <CardDescription>Liens vers vos réseaux sociaux</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField control={form.control} name="facebookUrl" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tSettings('social.facebookLabel')}</FormLabel>
                    <FormControl><Input placeholder="https://facebook.com/..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>
                <FormField control={form.control} name="instagramUrl" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tSettings('social.instagramLabel')}</FormLabel>
                    <FormControl><Input placeholder="https://instagram.com/..." {...field}/></FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>
                <FormField control={form.control} name="twitterUrl" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tSettings('social.twitterLabel')}</FormLabel>
                    <FormControl><Input placeholder="https://twitter.com/..." {...field}/></FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>
              </CardContent>
            </Card>

            {/* Homepage Settings */}
            <Card>
              <CardHeader>
                <CardTitle>{tSettings('homepage.title')}</CardTitle>
                <CardDescription>Contenu de la section hero de la page d'accueil</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField control={form.control} name="heroTitle" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tSettings('homepage.heroTitleLabel')}</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>
                <FormField control={form.control} name="heroSubtitle" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tSettings('homepage.heroSubtitleLabel')}</FormLabel>
                    <FormControl>
                      <Textarea className="resize-none min-h-[100px]" {...field}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>
              </CardContent>
            </Card>

            {/* Footer Links */}
            <Card>
              <CardHeader>
                <CardTitle>{tSettings('footer.title')}</CardTitle>
                <CardDescription>Liens affichés dans le pied de page</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-end gap-2 p-4 border rounded-lg bg-muted/30">
                    <FormField control={form.control} name={`footerLinks.${index}.label`} render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>{tSettings('footer.labelLabel')}</FormLabel>
                        <FormControl><Input placeholder="Accueil" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}/>
                    <FormField control={form.control} name={`footerLinks.${index}.url`} render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>{tSettings('footer.urlLabel')}</FormLabel>
                        <FormControl><Input placeholder="/contact" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}/>
                    <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => append({ label: '', url: '' })}
                  className="w-full"
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> {tSettings('footer.addLinkButton')}
                </Button>
              </CardContent>
            </Card>

            {/* Save Button at Bottom */}
            <div className="flex justify-end gap-2 sticky bottom-4 bg-background/80 backdrop-blur-sm p-4 rounded-lg border">
              <Button type="submit" disabled={isSubmitting} size="lg">
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting ? tSettings('savingButton') : tSettings('saveButton')}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}
