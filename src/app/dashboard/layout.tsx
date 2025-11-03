'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Activity, Building, Users, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { User } from '@/lib/types';
import { useEffect, useMemo, useState } from 'react';

function DashboardLayoutSkeleton() {
  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      <aside className="hidden w-64 flex-col border-r bg-card sm:flex">
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <Activity className="h-6 w-6 text-primary" />
            <span>Admin Panel</span>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <div className="h-8 w-full animate-pulse rounded-md bg-muted"></div>
          <div className="h-8 w-full animate-pulse rounded-md bg-muted"></div>
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card px-6">
          <div className="h-6 w-32 animate-pulse rounded-md bg-muted"></div>
          <div className="h-6 w-24 animate-pulse rounded-md bg-muted"></div>
        </header>
        <main className="flex-1 p-6">
          <div className="h-full w-full animate-pulse rounded-lg bg-muted"></div>
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);

  const userDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<User>(userDocRef);

  useEffect(() => {
    const isLoading = isUserLoading || isProfileLoading;
    if (isLoading) {
      return; // Wait until everything is loaded
    }

    if (!user) {
      router.push('/login');
      return;
    }

    if (!userProfile || (userProfile.role !== 'admin' && userProfile.role !== 'super_admin')) {
      router.push('/');
      return;
    }

    // If all checks pass, authorize the user
    setIsAuthorized(true);

  }, [user, userProfile, isUserLoading, isProfileLoading, router]);

  const navLinks = useMemo(() => {
    const links = [
      { href: '/dashboard', label: 'Overview', icon: Activity },
      { href: '/dashboard/facilities', label: 'Facilities', icon: Building },
    ];
    if (userProfile?.role === 'super_admin') {
      links.push({ href: '/dashboard/users', label: 'User Management', icon: Users });
    }
    return links;
  }, [userProfile?.role]);

  if (!isAuthorized) {
    return <DashboardLayoutSkeleton />;
  }

  return (
      <div className="flex min-h-screen w-full bg-muted/40">
        <aside className="hidden w-64 flex-col border-r bg-card sm:flex">
          <div className="flex h-16 items-center border-b px-6">
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
              <Activity className="h-6 w-6 text-primary" />
              <span>Admin Panel</span>
            </Link>
          </div>
          <nav className="flex-1 p-4">
            <ul className="space-y-1">
              {navLinks.map(({ href, label, icon: Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                      pathname === href && 'bg-muted text-primary'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card px-6">
              <div className="font-semibold text-lg">Dashboard</div>
              <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                  <Home className="h-4 w-4" />
                  Back to Site
              </Link>
          </header>
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
  );
}
