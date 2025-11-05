'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useDoc, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import type { User } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

function UsersSkeleton() {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </CardContent>
      </Card>
    );
}

export default function UsersPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const userDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<User>(userDocRef);

  // This check is a secondary safeguard. The primary protection is in the dashboard layout.
  useEffect(() => {
    if (!isUserLoading && !isProfileLoading && userProfile && userProfile.role !== 'super_admin') {
      router.push('/dashboard');
    }
  }, [userProfile, isUserLoading, isProfileLoading, router]);

  const usersCollectionRef = useMemoFirebase(
    // Only fetch users if the current user is a super_admin
    () => (userProfile && userProfile.role === 'super_admin' ? collection(firestore, 'users') : null),
    [firestore, userProfile]
  );
  
  const { data: allUsers, isLoading: usersLoading } = useCollection<User>(usersCollectionRef);

  const isLoading = isUserLoading || isProfileLoading;
  
  if (isLoading || !userProfile) {
    return <UsersSkeleton />;
  }

  // Final check before rendering
  if (userProfile.role !== 'super_admin') {
      // While the useEffect will redirect, we can return null to avoid a flash of content
      return <UsersSkeleton />;
  }
  
  if (usersLoading) {
    return <UsersSkeleton />;
  }


  return (
     <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <CardDescription>View and manage all users in the system.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allUsers && allUsers.length > 0 ? (
              allUsers.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.firstName} {u.lastName}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Badge variant={u.role === 'super_admin' ? 'destructive' : u.role === 'admin' ? 'default' : 'secondary'}>
                      {u.role.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  No users found or you do not have permission to view them.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
