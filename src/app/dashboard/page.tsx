'use client';

import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import type { Facility, User } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

function DashboardSkeleton() {
  return (
    <div className="grid gap-6">
      <Skeleton className="h-8 w-1/2" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Facilities</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-12" />
            <Skeleton className="h-4 w-48 mt-1" />
          </CardContent>
        </Card>
      </div>
       <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const userDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<User>(userDocRef);

  const facilitiesCollectionRef = useMemoFirebase(
    () => collection(firestore, 'facilities'),
    [firestore]
  );
  const { data: facilities, isLoading: facilitiesLoading } = useCollection<Facility>(facilitiesCollectionRef);
  
  const isLoading = isUserLoading || isProfileLoading;

  useEffect(() => {
    if (isLoading) return; // Wait for loading to finish

    if (!user) {
      router.push('/login');
      return;
    }
    
    if (!userProfile || (userProfile.role !== 'admin' && userProfile.role !== 'super_admin')) {
      router.push('/');
    }
  }, [isLoading, user, userProfile, router]);


  if (isLoading || !userProfile || (userProfile.role !== 'admin' && userProfile.role !== 'super_admin')) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-bold">Welcome, {userProfile.firstName || 'Admin'}!</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Facilities</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {facilitiesLoading ? '...' : facilities?.length ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Number of managed sports facilities.
            </p>
          </CardContent>
        </Card>
      </div>
       <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This is your main dashboard. From here, you can manage all aspects of the Maroc Sport Hub platform.
            Use the navigation on the left to manage facilities.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
