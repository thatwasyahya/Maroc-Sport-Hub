import {getRequestConfig} from 'next-intl/server';
 
export default getRequestConfig(async ({locale}) => {
  // Validate that the incoming `locale` parameter is valid
  // and load the translation files dynamically.
  const messages = (await import(`./src/messages/${locale}.json`)).default;
 
  return {
    messages
  };
});