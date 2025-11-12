import type { Metadata } from 'next';
import { Inter, Poppins } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-poppins',
});


export const metadata: Metadata = {
  title: 'Maroc Sport Hub',
  description: 'Map, organize, and book sports facilities in Morocco.',
};

export default async function RootLayout({
  children,
  params: { locale }
}: Readonly<{
  children: React.ReactNode;
  params: { locale: string };
}>) {

  let messages;
  try {
    messages = await getMessages({locale});
  } catch (error) {
    notFound();
  }

  return (
    <html lang={locale} className={`${inter.variable} ${poppins.variable} dark`} style={{ scrollBehavior: 'smooth' }}>
      <body className="font-body antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <FirebaseClientProvider>
            <FirebaseErrorListener />
            {children}
            <Toaster />
          </FirebaseClientProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
