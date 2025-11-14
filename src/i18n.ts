import {getRequestConfig} from 'next-intl/server';
 
export default getRequestConfig(async ({locale}) => {
  // Charge dynamiquement les messages pour la locale demandée.
  const messages = (await import(`./messages/${locale}.json`)).default;
 
  return {
    messages
  };
});
