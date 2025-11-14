
'use client';

import Image from 'next/image';
import Header from '@/components/header';
import ContactForm from '@/components/contact-form';
import ContactInfo from '@/components/contact-info';
import type { Settings } from '@/lib/types';

interface ContactPageClientProps {
  settings: Settings | null;
  translations: {
    heroAlt: string;
    title: string;
    description: string;
    form: any;
    info: any;
  };
}

export default function ContactPageClient({ settings, translations }: ContactPageClientProps) {
  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
      <Header />
      <main className="flex-1">
        <div className="relative py-24 sm:py-32 bg-background">
          <div className="absolute inset-0 z-0">
            <Image
              src="https://picsum.photos/seed/contactmap/1800/1000"
              alt={translations.heroAlt}
              fill
              className="object-cover opacity-5"
              priority
              data-ai-hint="abstract map"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background"></div>
          </div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <h1 className="text-4xl sm:text-5xl font-bold font-headline tracking-tighter">{translations.title}</h1>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">{translations.description}</p>
            </div>

            <div className="grid md:grid-cols-5 gap-12">
              <div className="md:col-span-3">
                <ContactForm translations={translations.form} />
              </div>
              <ContactInfo settings={settings} translations={translations.info} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
