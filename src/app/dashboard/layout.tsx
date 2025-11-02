"use client";

import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import Header from "@/components/header";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { LayoutDashboard, Upload, Users, Warehouse } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { doc } from 'firebase/firestore';
import { Skeleton } from "@/components/ui/skeleton";

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
  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userDocRef);

  useEffect(() => {
    // We wait until both the user and their profile are fully loaded.
    const isFinishedLoading = !isUserLoading && !isProfileLoading;
    
    if (isFinishedLoading) {
      // If there's no user logged in, redirect to the login page.
      if (!user) {
        router.push("/login");
        return;
      }
      
      // Check if the user has the required role from their profile.
      const hasPermission = userProfile && (userProfile.role === "admin" || userProfile.role === "super_admin");
      
      if (!hasPermission) {
        // If the user is logged in but doesn't have the right role,
        // redirect them to the home page as they cannot access the dashboard.
        router.push("/");
      } else {
        // If they have the correct role, authorize access to the dashboard.
        setIsAuthorized(true);
      }
    }
  }, [user, userProfile, isUserLoading, isProfileLoading, router]);

  const isActive = (path: string) => pathname === path;

  // Show a loading skeleton while we verify permissions.
  // This prevents the premature redirect and provides a better user experience.
  if (!isAuthorized) {
    return (
      <div className="min-h-screen w-full flex flex-col">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          <div className="w-64 hidden md:block border-r p-4 bg-muted/30">
             <Skeleton className="h-8 w-3/4 mb-6" />
             <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
             </div>
          </div>
          <div className="flex-1 p-8">
            <Skeleton className="h-12 w-1/2 mb-8" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Once authorized, render the dashboard.
  return (
    <div className="min-h-screen w-full flex flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <SidebarProvider>
          <Sidebar>
            <SidebarHeader>
              <h2 className="text-lg font-semibold font-headline">Dashboard</h2>
            </SidebarHeader>
            <SidebarContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/dashboard")}>
                    <Link href="/dashboard">
                      <LayoutDashboard />
                      <span>Overview</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/dashboard/facilities")}>
                    <Link href="/dashboard/facilities">
                      <Warehouse />
                      <span>Facilities</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/dashboard/import")}>
                    <Link href="/dashboard/import">
                      <Upload />
                      <span>Import Excel</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {userProfile?.role === 'super_admin' && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/dashboard/users")}>
                      <Link href="/dashboard/users">
                        <Users />
                        <span>User Management</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarContent>
          </Sidebar>
          <SidebarInset className="bg-muted/30">{children}</SidebarInset>
        </SidebarProvider>
      </div>
    </div>
  );
}