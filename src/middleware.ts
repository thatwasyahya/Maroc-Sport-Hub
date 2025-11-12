import createMiddleware from 'next-intl/middleware';
 
export default createMiddleware({
  // A list of all locales that are supported
  locales: ['en', 'fr', 'ar'],
 
  // Used when no locale matches
  defaultLocale: 'fr'
});
 
export const config = {
  // Skip all paths that should not be internationalized. This includes public
  // files, as well as Next.js-specific assets, like solids.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
};
    