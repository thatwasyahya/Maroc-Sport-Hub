'use client';

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Equipment } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useState } from 'react';
import AddEquipmentDialog from '@/components/dashboard/AddEquipmentDialog';

export default function EquipmentsPage() {
  const firestore = useFirestore();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  const equipmentsCollectionRef = useMemoFirebase(
    () => collection(firestore, 'equipments'),
    [firestore]
  );
  const { data: equipments, isLoading: equipmentsLoading } = useCollection<Equipment>(equipmentsCollectionRef);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Equipments</CardTitle>
            <CardDescription>Manage your sports equipments.</CardDescription>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Equipment
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Rental Cost</TableHead>
                <TableHead>Deposit Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {equipmentsLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : equipments && equipments.length > 0 ? (
                equipments.map((equipment) => (
                  <TableRow key={equipment.id}>
                    <TableCell className="font-medium">{equipment.name}</TableCell>
                    <TableCell>{equipment.rentalCost} MAD/hr</TableCell>
                    <TableCell>{equipment.depositCost} MAD</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    No equipments found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <AddEquipmentDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
    </>
  );
}