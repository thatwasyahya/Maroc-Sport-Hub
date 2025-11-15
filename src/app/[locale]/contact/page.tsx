import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getDoc, doc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase/config-server';
import type { Settings } from '@/lib/types';
import ContactPageClient from '@/components/contact-page-client';

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

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Contact');
  const settings = await getSettings();

  const translations = {
    heroAlt: t('heroAlt'),
    title: t('title'),
    description: t('description'),
    form: {
      title: t('form.title'),
      description: t('form.description'),
      nameLabel: t('form.nameLabel'),
      namePlaceholder: t('form.namePlaceholder'),
      emailLabel: t('form.emailLabel'),
      emailPlaceholder: t('form.emailPlaceholder'),
      messageLabel: t('form.messageLabel'),
      messagePlaceholder: t('form.messagePlaceholder'),
      submitButton: t('form.submitButton'),
      submittingButton: t('form.submittingButton'),
      successTitle: t('form.successTitle'),
      successDescription: t('form.successDescription'),
    },
    info: {
      title: t('info.title'),
      addressTitle: t('info.addressTitle'),
      emailTitle: t('info.emailTitle'),
      phoneTitle: t('info.phoneTitle'),
    },
  };

  return <ContactPageClient settings={settings} translations={translations} />;
}
