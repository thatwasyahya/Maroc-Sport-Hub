import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ locale }) => {
  // Load messages dynamically
  const messages = (await import(`./src/messages/${locale}.json`)).default;

  return {
    messages,
    locale,
  };
});
