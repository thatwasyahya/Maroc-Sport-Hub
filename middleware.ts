import createMiddleware from 'next-intl/middleware';
 
export default createMiddleware({
  // A list of all locales that are supported
  locales: ['en', 'fr', 'ar'],
 
  // Used when no locale matches
  defaultLocale: 'fr'
});
 
export const config = {
  // Match all paths except for static files and API routes.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
};
