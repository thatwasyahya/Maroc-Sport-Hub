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
    // Wait until all loading is done before making a decision.
    if (isLoading) {
      return;
    }

    // If loading is done and there's no user, redirect to login.
    if (!user) {
      router.push('/login');
      return;
    }

    // If loading is done and there is a user, but no profile or incorrect role.
    if (!userProfile || (userProfile.role !== 'admin' && userProfile.role !== 'super_admin')) {
      router.push('/');
      return;
    }

  }, [isLoading, user, userProfile, router]);


  // While loading, show the skeleton.
  if (isLoading) {
    return <>{loadingSkeleton}</>;
  }

  // If authorized, show the actual content.
  if (user && userProfile && (userProfile.role === 'admin' || userProfile.role === 'super_admin')) {
    return <>{children}</>;
  }

  // Fallback: If not loading but not authorized, show skeleton.
  // This state should be brief as the useEffect will trigger a redirect.
  return <>{loadingSkeleton}</>;
}
