
"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useUser, useAuth, useDoc, useMemoFirebase, useFirestore } from "@/firebase";
import { doc } from 'firebase/firestore';
import { Activity, LayoutDashboard, LogOut, User as UserIcon, LogIn, UserPlus, Moon, Sun, Languages } from "lucide-react";
import { useRouter, usePathname } from '@/i18n/routing';
import { signOut } from "firebase/auth";
import type { User, Settings } from "@/lib/types";
import { getLocalized } from '@/lib/utils';
import { Skeleton } from "./ui/skeleton";
import { InterceptedLink } from "./intercepted-link";
import { useTheme } from "next-themes";
import { useLocale } from "next-intl";

export default function Header() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale();

  const { setTheme } = useTheme();

  const userDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<User>(userDocRef);
  
  const settingsDocRef = useMemoFirebase(() => (
    firestore ? doc(firestore, 'settings', 'global') : null
  ), [firestore]);
  const { data: settings, isLoading: isSettingsLoading } = useDoc<Settings>(settingsDocRef);


  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push("/");
  };
  
  const handleLocaleChange = (newLocale: string) => {
    // Get the current pathname without the locale prefix
    const currentPath = pathname || '/';
    // Use next-intl's router to navigate with the new locale
    router.push(currentPath, { locale: newLocale });
  };


  const getInitials = (name?: string) => {
    if (!name) return "";
    const names = name.split(' ');
    if (names.length > 1 && names[1]) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name ? name.substring(0, 2).toUpperCase() : "";
  };
  
  const displayName = userProfile?.name || user?.email;
  const appName = getLocalized(settings?.appName as any, currentLocale, "Maroc Sport Hub");
  const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'super_admin';
  
  const locales = [
    { code: 'fr', name: 'Français' },
    { code: 'en', name: 'English' },
    { code: 'ar', name: 'العربية' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-sm">
      <div className="container flex h-16 max-w-screen-2xl items-center">
        <div className="mr-4 flex">
          <InterceptedLink href="/" className="mr-6 flex items-center space-x-2">
            <Activity className="h-6 w-6 text-primary" />
            <span className="hidden font-bold sm:inline-block font-headline text-lg">
              {isSettingsLoading ? <Skeleton className="h-6 w-36" /> : appName}
            </span>
          </InterceptedLink>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Languages className="h-[1.2rem] w-[1.2rem]" />
                <span className="sr-only">Changer de langue</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {locales.map(locale => (
                 <DropdownMenuItem key={locale.code} onClick={() => handleLocaleChange(locale.code)} disabled={currentLocale === locale.code}>
                   {locale.name}
                 </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Changer de thème</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                Clair
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                Sombre
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                Système
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {(isUserLoading || isProfileLoading) ? (
            <Skeleton className="h-10 w-10 rounded-full" />
          ) : user && userProfile ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{displayName}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <InterceptedLink href="/profile">
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Mon Profil</span>
                  </InterceptedLink>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <InterceptedLink href="/dashboard">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </InterceptedLink>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Se déconnecter</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <nav className="flex items-center gap-2">
              <Button asChild variant="ghost" size="icon" className="sm:w-auto sm:px-4">
                <InterceptedLink href="/login">
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline sm:ml-2">Se connecter</span>
                </InterceptedLink>
              </Button>
              <Button asChild size="icon" className="sm:w-auto sm:px-4">
                <InterceptedLink href="/signup">
                  <UserPlus className="h-4 w-4"/>
                  <span className="hidden sm:inline sm:ml-2">S'inscrire</span>
                </InterceptedLink>
              </Button>
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}
