
'use client';

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Reservation, Facility, User } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';


export default function ReservationsPage() {
  const firestore = useFirestore();
  
  // This query will fetch all reservations for admin view
  const reservationsCollectionRef = useMemoFirebase(
    () => collection(firestore, 'reservations'),
    [firestore]
  );
  const usersCollectionRef = useMemoFirebase(
    () => collection(firestore, 'users'),
    [firestore]
  );
  const facilitiesCollectionRef = useMemoFirebase(
    () => collection(firestore, 'facilities'),
    [firestore]
  );

  const { data: reservations, isLoading: reservationsLoading } = useCollection<Reservation>(reservationsCollectionRef);
  const { data: users, isLoading: usersLoading } = useCollection<User>(usersCollectionRef);
  const { data: facilities, isLoading: facilitiesLoading } = useCollection<Facility>(facilitiesCollectionRef);

  const isLoading = reservationsLoading || usersLoading || facilitiesLoading;

  const formatDate = (dateValue: any) => {
    if (!dateValue) return "Invalid Date";
    try {
      const date = dateValue instanceof Timestamp ? dateValue.toDate() : new Date(dateValue);
      return format(date, "PPP p");
    } catch (error) {
      return "Invalid Date";
    }
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle>All Reservations</CardTitle>
        <CardDescription>View all user reservations across all facilities.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Facility</TableHead>
              <TableHead>Start Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Total Cost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Loading reservations...
                </TableCell>
              </TableRow>
            ) : reservations && reservations.length > 0 ? (
              reservations.map((reservation) => {
                const user = users?.find(u => u.id === reservation.userId);
                const facility = facilities?.find(f => f.id === reservation.facilityId);
                return (
                    <TableRow key={reservation.id}>
                        <TableCell className="font-medium">{user?.email || 'Unknown User'}</TableCell>
                        <TableCell>{facility?.name || 'Unknown Facility'}</TableCell>
                        <TableCell>{formatDate(reservation.startTime)}</TableCell>
                        <TableCell>
                            <Badge variant={reservation.status === 'confirmed' ? 'default' : 'secondary'}>
                                {reservation.status}
                            </Badge>
                        </TableCell>
                        <TableCell>{reservation.totalCost} MAD</TableCell>
                    </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No reservations found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
