'use client';

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Facility } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useState } from 'react';
import AddFacilityDialog from '@/components/dashboard/AddFacilityDialog';

export default function FacilitiesPage() {
  const firestore = useFirestore();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  const facilitiesCollectionRef = useMemoFirebase(
    () => collection(firestore, 'facilities'),
    [firestore]
  );
  const { data: facilities, isLoading: facilitiesLoading } = useCollection<Facility>(facilitiesCollectionRef);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Facilities</CardTitle>
            <CardDescription>Manage your sports facilities.</CardDescription>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Facility
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Rental Cost</TableHead>
                <TableHead>Equipments</TableHead>
                <TableHead>Sports</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {facilitiesLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : facilities && facilities.length > 0 ? (
                facilities.map((facility) => (
                  <TableRow key={facility.id}>
                    <TableCell className="font-medium">{facility.name}</TableCell>
                    <TableCell>{facility.region}</TableCell>
                    <TableCell>{facility.rentalCost} MAD/hr</TableCell>
                    <TableCell>{facility.equipmentIds?.length || 0}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {facility.sports.map((sport) => (
                          <Badge key={sport} variant="secondary">{sport}</Badge>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No facilities found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <AddFacilityDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
    </>
  );
}
