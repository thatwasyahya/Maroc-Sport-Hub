import {getRequestConfig} from 'next-intl/server';
 
export default getRequestConfig(async ({locale}) => {
  // This is a workaround for a bug in next-intl with the app router
  // see: https://github.com/amannn/next-intl/issues/165
  try {
    return {
      messages: (await import(`./messages/${locale}.json`)).default
    };
  } catch (error) {
    console.warn(`Could not load messages for locale ${locale}.`);
  }
});
