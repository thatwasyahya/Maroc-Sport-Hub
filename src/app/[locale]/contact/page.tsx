import { unstable_setRequestLocale, getTranslations } from 'next-intl/server';
import { Mail, Phone, MapPin } from 'lucide-react';
import Image from 'next/image';
import Header from '@/components/header';
import ContactForm from '@/components/contact-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getDoc, doc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase/config-server'; // Using server-side init
import type { Settings } from '@/lib/types';
import ContactInfo from '@/components/contact-info';


async function getSettings() {
  try {
    const { firestore } = initializeFirebase();
    const settingsDocRef = doc(firestore, 'settings', 'global');
    const settingsSnap = await getDoc(settingsDocRef);
    if (settingsSnap.exists()) {
      return settingsSnap.data() as Settings;
    }
  } catch (error) {
    console.error("Failed to fetch settings:", error);
  }
  return null;
}


export default async function ContactPage({ params: { locale } }: { params: { locale: string } }) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations('Contact');
  const settings = await getSettings();

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
                    <ContactInfo settings={settings} />
                </div>
            </div>
        </div>
      </main>
    </div>
  );
}
