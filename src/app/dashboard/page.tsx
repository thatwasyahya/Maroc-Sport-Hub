'use client';

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Facility } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building } from 'lucide-react';

export default function DashboardPage() {
  const firestore = useFirestore();

  const facilitiesCollectionRef = useMemoFirebase(
    () => collection(firestore, 'facilities'),
    [firestore]
  );
  const { data: facilities, isLoading: facilitiesLoading } = useCollection<Facility>(facilitiesCollectionRef);

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-bold">Welcome to your Dashboard</h1>
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
            Use the navigation on the left to manage facilities, and if you are a Super Admin, manage users.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
