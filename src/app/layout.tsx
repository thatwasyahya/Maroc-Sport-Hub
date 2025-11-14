import type { Metadata } from 'next';
import { Inter, Poppins } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import {NextIntlClientProvider} from 'next-intl';
import {getMessages, unstable_setRequestLocale} from 'next-intl/server';
import { NavigationProvider } from '@/components/providers/navigation-provider';
import { NavigationLoader } from '@/components/navigation-loader';

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

// Even though this is the root layout, the middleware ensures that `locale` will always be present.
export default async function RootLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  // Enable static rendering
  unstable_setRequestLocale(locale);

  // Receive messages provided in `i18n.ts`
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${inter.variable} ${poppins.variable} dark`} style={{ scrollBehavior: 'smooth' }}>
      <body className="font-body antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <FirebaseClientProvider>
            <NavigationProvider>
              <NavigationLoader />
              {children}
              <Toaster />
            </NavigationProvider>
          </FirebaseClientProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
