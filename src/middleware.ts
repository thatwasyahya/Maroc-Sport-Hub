import createMiddleware from 'next-intl/middleware';
 
export default createMiddleware({
  // A list of all locales that are supported
  locales: ['en', 'fr', 'ar'],
 
  // Used when no locale matches
  defaultLocale: 'fr'
});
 
export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(ar|en|fr)/:path*']
};