'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import type { User, FacilityRequest } from '@/lib/types';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import RequestsList from '@/components/dashboard/RequestsList';

function RequestsPageSkeleton() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Facility Requests</CardTitle>
                <CardDescription>Review and manage user-submitted facility requests.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            </CardContent>
        </Card>
    );
}

export default function RequestsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<User>(userDocRef);

  const isLoading = isUserLoading || isProfileLoading;
  const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'super_admin';

  if (isLoading) {
    return <RequestsPageSkeleton />;
  }

  if (!isAdmin) {
      return (
          <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Access Denied</AlertTitle>
              <AlertDescription>
                  You do not have the necessary permissions to view this page.
              </AlertDescription>
          </Alert>
      );
  }

  return <RequestsList />;
}
