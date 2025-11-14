'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import GeneralSettingsDialog from '@/components/dashboard/GeneralSettingsDialog';
import {unstable_setRequestLocale} from 'next-intl/server';

export default function AdminPage({ params: { locale } }: { params: { locale: string } }) {
  unstable_setRequestLocale(locale);
  const t = useTranslations('Dashboard.Admin');
  const [isGeneralSettingsOpen, setIsGeneralSettingsOpen] = useState(false);

  return (
    <>
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="space-y-1.5">
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5"/>
                  {t('siteSettings.title')}
                </CardTitle>
                 <CardDescription>{t('siteSettings.description')}</CardDescription>
              </div>
              <Button size="sm" onClick={() => setIsGeneralSettingsOpen(true)}>{t('manage')}</Button>
            </CardHeader>
          </Card>
        </div>
        
      </div>

      <GeneralSettingsDialog open={isGeneralSettingsOpen} onOpenChange={setIsGeneralSettingsOpen} />
    </>
  );
}
