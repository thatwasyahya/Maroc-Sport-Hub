'use client';

import { usePathname } from 'next/navigation';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Activity, Building, Users, Home, Loader, ShieldAlert, FileText, Menu, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { User } from '@/lib/types';
import { useMemo, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslations } from 'next-intl';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { InterceptedLink } from '@/components/intercepted-link';


function DashboardLayoutSkeleton() {
  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      <aside className="hidden w-64 flex-col border-r bg-card sm:flex">
        <div className="flex h-16 items-center border-b px-6">
          <div className="flex items-center gap-2 font-semibold">
            <Activity className="h-6 w-6 text-primary" />
            <span>Admin Panel</span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <div className="h-8 w-full animate-pulse rounded-md bg-muted"></div>
          <div className="h-8 w-full animate-pulse rounded-md bg-muted"></div>
          <div className="h-8 w-full animate-pulse rounded-md bg-muted"></div>
          <div className="h-8 w-full animate-pulse rounded-md bg-muted"></div>
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card px-6">
          <div className="h-6 w-32 animate-pulse rounded-md bg-muted"></div>
          <div className="h-6 w-24 animate-pulse rounded-md bg-muted"></div>
        </header>
        <main className="flex-1 p-6 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Loader className="h-8 w-8 animate-spin" />
                <p>Verifying permissions...</p>
            </div>
        </main>
      </div>
    </div>
  );
}

function NoPermission() {
    const t = useTranslations('Dashboard.NoPermission');
    return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center bg-muted/40 p-4">
            <Card className="max-w-md text-center">
                <CardHeader>
                    <CardTitle className="flex items-center justify-center gap-2">
                        <ShieldAlert className="h-6 w-6 text-destructive" />
                        {t('title')}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">{t('description')}</p>
                    <Button asChild className="mt-4">
                        <InterceptedLink href="/">{t('homeButton')}</InterceptedLink>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

function NavLinks({ links, currentPathname, onLinkClick }: { links: any[], currentPathname: string, onLinkClick?: () => void }) {
  return (
    <nav className="flex-1 p-4">
      <ul className="space-y-1">
        {links.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <InterceptedLink
              href={href}
              onClick={onLinkClick}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                currentPathname.endsWith(href) && 'bg-muted text-primary'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </InterceptedLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const pathname = usePathname();
  const t = useTranslations('Dashboard.Navigation');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const userDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<User>(userDocRef);

  const navLinks = useMemo(() => {
    const links = [
      { href: '/dashboard', label: t('overview'), icon: Activity },
      { href: '/dashboard/requests', label: t('requests'), icon: FileText },
      { href: '/dashboard/facilities', label: t('facilities'), icon: Building },
      { href: '/dashboard/users', label: t('users'), icon: Users },
    ];
    if (userProfile?.role === 'super_admin') {
        links.push({ href: '/dashboard/admin', label: t('admin'), icon: Settings });
    }
    return links;
  }, [userProfile?.role, t]);

  const hasPermission = userProfile && (userProfile.role === 'admin' || userProfile.role === 'super_admin');
  const isLoading = isUserLoading || isProfileLoading;
  
  if (isLoading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!hasPermission) {
    return <NoPermission />;
  }
  
  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  }

  return (
      <div className="flex min-h-screen w-full bg-muted/40">
        {/* Desktop Sidebar */}
        <aside className="hidden w-64 flex-col border-r bg-card sm:flex">
          <div className="flex h-16 items-center border-b px-6">
            <InterceptedLink href="/dashboard" className="flex items-center gap-2 font-semibold">
              <Activity className="h-6 w-6 text-primary" />
              <span>{t('adminPanel')}</span>
            </InterceptedLink>
          </div>
          <NavLinks links={navLinks} currentPathname={pathname} />
        </aside>

        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card px-4 sm:px-6">
              {/* Mobile Menu Trigger */}
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                  <SheetTrigger asChild>
                      <Button variant="outline" size="icon" className="sm:hidden">
                          <Menu className="h-5 w-5" />
                          <span className="sr-only">Ouvrir le menu</span>
                      </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="sm:hidden p-0 w-64" >
                      <SheetHeader className="p-6 pb-2">
                        <SheetTitle>
                          <InterceptedLink href="/dashboard" onClick={handleLinkClick} className="flex items-center gap-2 font-semibold">
                              <Activity className="h-6 w-6 text-primary" />
                              <span>{t('adminPanel')}</span>
                          </InterceptedLink>
                        </SheetTitle>
                      </SheetHeader>
                      <NavLinks links={navLinks} currentPathname={pathname} onLinkClick={handleLinkClick} />
                  </SheetContent>
              </Sheet>

              <div className="font-semibold text-lg hidden sm:block">{t('dashboard')}</div>

              <InterceptedLink href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                  <Home className="h-4 w-4" />
                  <span className="hidden md:inline">{t('backToSite')}</span>
              </InterceptedLink>
          </header>
          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </div>
      </div>
  );
}
