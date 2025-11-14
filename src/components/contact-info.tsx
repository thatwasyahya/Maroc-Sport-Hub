'use client';

import { useTranslations } from 'next-intl';
import { Mail, Phone, MapPin } from 'lucide-react';
import type { Settings } from '@/lib/types';

export default function ContactInfo({ settings }: { settings: Settings | null }) {
    const t = useTranslations('Contact');
    
    return (
        <div className="md:col-span-2 space-y-6">
            <h3 className="text-2xl font-semibold font-headline">{t('info.title')}</h3>
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
        </div>
    );
}
