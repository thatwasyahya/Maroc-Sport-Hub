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
import { Textarea } from '@/components/ui/textarea';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import type { Settings } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';

const settingsSchema = z.object({
  appName: z.string().min(3, 'Le nom de l\'application doit comporter au moins 3 caractères.'),
  footerDescription: z.string().min(10, 'La description doit comporter au moins 10 caractères.'),
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

  const settingsDocRef = useMemoFirebase(() => (
    firestore ? doc(firestore, 'settings', 'global') : null
  ), [firestore]);

  const { data: settings, isLoading } = useDoc<Settings>(settingsDocRef);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      appName: '',
      footerDescription: '',
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        appName: settings.appName || '',
        footerDescription: settings.footerDescription || '',
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Paramètres Généraux</DialogTitle>
          <DialogDescription>
            Modifier les informations principales de votre site.
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="appName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom de l'application</FormLabel>
                  <FormControl>
                    <Input placeholder="Maroc Sport Hub" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="footerDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description du pied de page</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="La description qui apparaît dans le footer de votre site."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
