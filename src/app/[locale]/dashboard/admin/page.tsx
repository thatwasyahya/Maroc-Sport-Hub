'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link, Settings, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import GeneralSettingsDialog from '@/components/dashboard/GeneralSettingsDialog';

export default function AdminPage() {
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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Link className="h-5 w-5"/>
                {t('footerLinks.title')}
              </CardTitle>
              <Button size="sm" onClick={() => setIsGeneralSettingsOpen(true)}>{t('manage')}</Button>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{t('footerLinks.description')}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
               <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5"/>
                {t('generalSettings.title')}
              </CardTitle>
              <Button size="sm" onClick={() => setIsGeneralSettingsOpen(true)}>{t('manage')}</Button>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{t('generalSettings.description')}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
               <CardTitle className="flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5"/>
                {t('homepageSettings.title')}
              </CardTitle>
              <Button size="sm" onClick={() => setIsGeneralSettingsOpen(true)}>{t('manage')}</Button>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{t('homepageSettings.description')}</p>
            </CardContent>
          </Card>
        </div>
        
      </div>

      <GeneralSettingsDialog open={isGeneralSettingsOpen} onOpenChange={setIsGeneralSettingsOpen} />
    </>
  );
}
