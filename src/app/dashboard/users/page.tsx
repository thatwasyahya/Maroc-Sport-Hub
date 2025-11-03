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

export default function UsersPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const userDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<User>(userDocRef);

  const usersCollectionRef = useMemoFirebase(
    () => (userProfile?.role === 'super_admin' ? collection(firestore, 'users') : null),
    [firestore, userProfile]
  );
  const { data: allUsers, isLoading: usersLoading } = useCollection<User>(usersCollectionRef);

  useEffect(() => {
    const isLoading = isUserLoading || isProfileLoading;
    if (isLoading) {
      return; // Still loading, do nothing.
    }
    if (!user) {
        router.push('/login'); // Should be handled by layout, but as a safeguard.
        return;
    }
    if (userProfile?.role !== 'super_admin') {
      router.push('/dashboard'); // Not a super_admin, redirect to dashboard home.
    }
  }, [userProfile, isProfileLoading, isUserLoading, router, user]);

  if (isUserLoading || isProfileLoading || userProfile?.role !== 'super_admin') {
    return (
      <div className="flex items-center justify-center h-full">
         <div className="w-full space-y-4">
            <Skeleton className="h-10 w-1/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
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
            {usersLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  Loading users...
                </TableCell>
              </TableRow>
            ) : allUsers && allUsers.length > 0 ? (
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
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
