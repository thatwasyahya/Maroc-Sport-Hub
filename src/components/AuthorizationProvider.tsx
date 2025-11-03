'use client';

import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import type { User } from '@/lib/types';
import { doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface AuthorizationProviderProps {
  children: React.ReactNode;
  loadingSkeleton: React.ReactNode;
}

export function AuthorizationProvider({ children, loadingSkeleton }: AuthorizationProviderProps) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const userDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<User>(userDocRef);
  
  const isLoading = isUserLoading || isProfileLoading;

  useEffect(() => {
    // Wait until loading is fully complete.
    if (isLoading) {
      return;
    }

    // If loading is done and there is still no authenticated user, redirect to login.
    if (!user) {
      router.push('/login');
    }
    
    // If a user is logged in, but their profile with roles doesn't exist or they don't have the right role,
    // redirect them to the home page.
    if (user && !userProfile) {
        // This can happen for a brief moment after signup before the user doc is created.
        // Or if the doc creation failed.
        // A redirect to home is safer than getting stuck or seeing errors.
        router.push('/');
        return;
    }

    if (userProfile && userProfile.role !== 'admin' && userProfile.role !== 'super_admin') {
        router.push('/');
        return;
    }

  }, [isLoading, user, userProfile, router]);


  // While loading, or if the user is not yet defined, show the skeleton.
  if (isLoading || !user) {
    return <>{loadingSkeleton}</>;
  }

  // If we have a user, but no profile yet, also show skeleton while useEffect handles potential redirect.
  if (!userProfile) {
    return <>{loadingSkeleton}</>;
  }
  
  // If the user has the correct role, show the content.
  if (userProfile.role === 'admin' || userProfile.role === 'super_admin') {
     return <>{children}</>;
  }

  // Fallback while redirecting.
  return <>{loadingSkeleton}</>;
}
