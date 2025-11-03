
'use client';

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, Timestamp } from 'firebase/firestore';
import type { Reservation, Facility } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';


export default function ReservationsPage() {
  const firestore = useFirestore();
  
  // This query will fetch all reservations for admin view
  const reservationsCollectionRef = useMemoFirebase(
    () => collection(firestore, 'reservations'),
    [firestore]
  );
  const facilitiesCollectionRef = useMemoFirebase(
    () => collection(firestore, 'facilities'),
    [firestore]
  );

  const { data: reservations, isLoading: reservationsLoading } = useCollection<Reservation>(reservationsCollectionRef);
  const { data: facilities, isLoading: facilitiesLoading } = useCollection<Facility>(facilitiesCollectionRef);

  const isLoading = reservationsLoading || facilitiesLoading;

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
              <TableHead>User Email</TableHead>
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
                const facility = facilities?.find(f => f.id === reservation.facilityId);
                return (
                    <TableRow key={reservation.id}>
                        <TableCell className="font-medium">{reservation.userEmail || 'Unknown User'}</TableCell>
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
