'use client';

import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Facility } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslations } from 'next-intl';

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
  const { user } = useUser();
  const firestore = useFirestore();
  const t = useTranslations('Dashboard.Overview');

  const facilitiesCollectionRef = useMemoFirebase(
    () => collection(firestore, 'facilities'),
    [firestore]
  );
  const { data: facilities, isLoading: facilitiesLoading } = useCollection<Facility>(facilitiesCollectionRef);
  
  if (!user) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-bold">{t('welcome', { name: user.displayName || user.email })}</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalFacilities')}</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {facilitiesLoading ? '...' : facilities?.length ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('totalFacilitiesDescription')}
            </p>
          </CardContent>
        </Card>
      </div>
       <Card>
        <CardHeader>
          <CardTitle>{t('overviewTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {t('overviewDescription')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
