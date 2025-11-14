'use client';

import { Mail, Phone, MapPin } from 'lucide-react';
import type { Settings } from '@/lib/types';

interface ContactInfoProps {
  settings: Settings | null;
  translations: {
    title: string;
    addressTitle: string;
    emailTitle: string;
    phoneTitle: string;
  };
}

export default function ContactInfo({ settings, translations }: ContactInfoProps) {
  return (
    <div className="md:col-span-2 space-y-6">
      <h3 className="text-2xl font-semibold font-headline">{translations.title}</h3>
      <div className="space-y-4 text-muted-foreground">
        <div className="flex items-start gap-4">
          <MapPin className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-foreground">{translations.addressTitle}</h4>
            <p>123 Avenue Mohammed V, Rabat, Maroc</p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <Mail className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-foreground">{translations.emailTitle}</h4>
            <p>{settings?.contactEmail || 'contact@marocsporthub.ma'}</p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <Phone className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-foreground">{translations.phoneTitle}</h4>
            <p>{settings?.contactPhone || '+212 5 37 00 00 00'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
