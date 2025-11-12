import createMiddleware from 'next-intl/middleware';
 
export default createMiddleware({
  // A list of all locales that are supported
  locales: ['en', 'fr', 'ar'],
 
  // Used when no locale matches
  defaultLocale: 'fr'
});
 
export const config = {
  // Skip all paths that should not be internationalized. This includes the
  // folders containing files like robots.txt, sitemap.xml, etc.
  matcher: ['/((?!api|_next|.*\\..*).*)']
};