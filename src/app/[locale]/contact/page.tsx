import { unstable_setRequestLocale } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import { Mail, Phone, MapPin } from 'lucide-react';
import Image from 'next/image';
import Header from '@/components/header';
import ContactForm from '@/components/contact-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { doc } from 'firebase/firestore';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import type { Settings } from '@/lib/types';


async function ContactInfo() {
    const t = useTranslations('Contact');
    const firestore = useFirestore();
    const settingsDocRef = useMemoFirebase(() => (
        firestore ? doc(firestore, 'settings', 'global') : null
    ), [firestore]);
    
    // In a Server Component, we can't use useDoc directly.
    // This is a placeholder for how you might fetch data on the server.
    // For a real implementation, you'd use a server-side fetch function.
    const settings: Settings | null = null; // Replace with actual data fetching if needed
    const isSettingsLoading = false; // Replace with actual loading state if needed


    return (
        <div className="md:col-span-2 space-y-6">
            <h3 className="text-2xl font-semibold font-headline">{t('info.title')}</h3>
            { isSettingsLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            ) : (
            <div className="space-y-4 text-muted-foreground">
                <div className="flex items-start gap-4">
                    <MapPin className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                        <h4 className="font-semibold text-foreground">{t('info.addressTitle')}</h4>
                        <p>123 Avenue Mohammed V, Rabat, Maroc</p>
                    </div>
                </div>
                 <div className="flex items-start gap-4">
                    <Mail className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                        <h4 className="font-semibold text-foreground">{t('info.emailTitle')}</h4>
                        <p>{settings?.contactEmail || 'contact@marocsporthub.ma'}</p>
                    </div>
                </div>
                 <div className="flex items-start gap-4">
                    <Phone className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                        <h4 className="font-semibold text-foreground">{t('info.phoneTitle')}</h4>
                        <p>{settings?.contactPhone || '+212 5 37 00 00 00'}</p>
                    </div>
                </div>
            </div>
            )}
        </div>
    );
}


export default function ContactPage({ params: { locale } }: { params: { locale: string } }) {
  unstable_setRequestLocale(locale);
  const t = useTranslations('Contact');

  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
      <Header />
      <main className="flex-1">
        <div className="relative py-24 sm:py-32 bg-background">
             <div className="absolute inset-0 z-0">
                <Image
                  src="https://picsum.photos/seed/contactmap/1800/1000"
                  alt={t('heroAlt')}
                  fill
                  className="object-cover opacity-5"
                  priority
                  data-ai-hint="abstract map"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background"></div>
            </div>
            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center mb-16">
                    <h1 className="text-4xl sm:text-5xl font-bold font-headline tracking-tighter">{t('title')}</h1>
                    <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">{t('description')}</p>
                </div>

                <div className="grid md:grid-cols-5 gap-12">
                    <div className="md:col-span-3">
                       <ContactForm />
                    </div>
                    {/* @ts-expect-error Server Component */}
                    <ContactInfo />
                </div>
            </div>
        </div>
      </main>
    </div>
  );
}
