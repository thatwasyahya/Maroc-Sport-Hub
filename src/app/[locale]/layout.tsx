import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { notFound } from 'next/navigation';
import { FirebaseClientProvider } from '@/firebase';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  let messages;
  try {
    messages = await getMessages({locale});
  } catch (error) {
    notFound();
  }
 
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <FirebaseClientProvider>
        <FirebaseErrorListener />
        {children}
        <Toaster />
      </FirebaseClientProvider>
    </NextIntlClientProvider>
  );
}