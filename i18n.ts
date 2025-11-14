import { getRequestConfig, requestLocale } from 'next-intl/server';

export default getRequestConfig(async () => {
  // Récupère la locale automatiquement depuis le contexte
  const locale = await requestLocale();

  // Charge dynamiquement les messages
  const messages = (await import(`./src/messages/${locale}.json`)).default;

  return {
    messages,
    locale,
  };
});
