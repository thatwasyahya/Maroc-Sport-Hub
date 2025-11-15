import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['en', 'fr', 'ar'],
  defaultLocale: 'fr'
});

// Create and export navigation APIs
export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);
