"use client";

import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import Header from "@/components/header";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
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
import { BarChart2, LayoutDashboard, Upload, Users, Warehouse } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { doc } from 'firebase/firestore';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const pathname = usePathname();

  const userDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userDocRef);

  useEffect(() => {
    if (!isUserLoading && !isProfileLoading) {
      if (!user || !userProfile || (userProfile.role !== "admin" && userProfile.role !== "super_admin")) {
        router.push("/login");
      }
    }
  }, [user, userProfile, isUserLoading, isProfileLoading, router]);

  if (isUserLoading || isProfileLoading || !userProfile) {
    return null; // Or a loading/unauthorized component
  }

  const isActive = (path: string) => pathname === path;

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
                {userProfile.role === 'super_admin' && (
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
