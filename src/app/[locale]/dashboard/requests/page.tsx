'use client';

import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { User } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import RequestsList from '@/components/dashboard/RequestsList';

function RequestsPageSkeleton() {
    return (
        <div className="space-y-4">
            <Skeleton className="h-8 w-1/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="border rounded-lg p-2">
                <div className="h-12 bg-muted rounded-t-lg" />
                <div className="space-y-2 p-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </div>
        </div>
    );
}

export default function RequestsPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const userDocRef = useMemoFirebase(
        () => (user ? doc(firestore, 'users', user.uid) : null),
        [firestore, user]
    );

    const { data: userProfile, isLoading: isProfileLoading } = useDoc<User>(userDocRef);

    const isLoading = isUserLoading || isProfileLoading;
    const hasPermission = userProfile && (userProfile.role === 'admin' || userProfile.role === 'super_admin');

    if (isLoading) {
        return <RequestsPageSkeleton />;
    }

    if (!hasPermission) {
        // This should not be reached because of the layout check, but it's a good safeguard.
        return <p>You do not have permission to view this page.</p>;
    }

    return <RequestsList />;
}
