'use client';

import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import type { FacilityRequest } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';

export default function RequestsPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<FacilityRequest | null>(null);

  // The query will only be created if the user is logged in.
  const requestsCollectionRef = useMemoFirebase(
    () => (user ? collection(firestore, 'facilityRequests') : null), 
    [user, firestore]
  );
  const { data: requests, isLoading: requestsLoading } = useCollection<FacilityRequest>(requestsCollectionRef);

  const pendingRequests = requests?.filter(r => r.status === 'pending') || [];
  
  // This loading state is more accurate. It waits for both user and data.
  const isLoading = requestsLoading || !user;

  const handleApprove = async (request: FacilityRequest) => {
    try {
      const batch = writeBatch(firestore);

      // 1. Create a new facility document from the request data
      const newFacilityRef = doc(collection(firestore, 'facilities'));
      const newFacilityData = {
        name: request.name,
        description: request.description,
        address: request.address,
        region: request.region,
        city: request.city,
        rentalCost: request.rentalCost,
        depositCost: request.depositCost,
        sports: request.sports,
        type: request.type,
        accessible: request.accessible,
        adminId: request.userId, // Assign the user who requested as admin
        equipmentIds: [], // Starts with no equipment
        photos: [], // Starts with no photos
        location: { lat: 33.5731, lng: -7.5898 }, // Default to Casablanca, to be replaced by a geocoding API
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      batch.set(newFacilityRef, newFacilityData);

      // 2. Update the request status to 'approved'
      const requestRef = doc(firestore, 'facilityRequests', request.id);
      batch.update(requestRef, { status: 'approved', updatedAt: serverTimestamp() });

      await batch.commit();

      toast({
        title: 'Request Approved',
        description: `Facility "${request.name}" has been created.`,
      });
    } catch (error) {
      console.error('Error approving request:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An error occurred while approving the request.',
      });
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please provide a reason for rejection.',
      });
      return;
    }

    try {
      const requestRef = doc(firestore, 'facilityRequests', selectedRequest.id);
      const batch = writeBatch(firestore);
      batch.update(requestRef, {
        status: 'rejected',
        rejectionReason: rejectionReason,
        updatedAt: serverTimestamp(),
      });
      await batch.commit();

      toast({
        title: 'Request Rejected',
        description: `The request for "${selectedRequest.name}" has been rejected.`,
      });
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An error occurred while rejecting the request.',
      });
    } finally {
        setSelectedRequest(null);
        setRejectionReason('');
    }
  };


  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Facility Requests</CardTitle>
          <CardDescription>Review and manage user-submitted facility requests.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Facility Name</TableHead>
                <TableHead>Submitted By</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">Loading requests...</TableCell>
                </TableRow>
              ) : pendingRequests.length > 0 ? (
                pendingRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.name}</TableCell>
                    <TableCell>{request.userName || request.userEmail}</TableCell>
                    <TableCell>{request.createdAt?.toDate ? format(request.createdAt.toDate(), 'PPP') : 'N/A'}</TableCell>
                    <TableCell><Badge variant="secondary" className="capitalize">{request.status}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleApprove(request)}>Approve</Button>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive" onClick={() => setSelectedRequest(request)}>Reject</Button>
                        </AlertDialogTrigger>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">No pending requests.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <AlertDialog>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Reject Facility Request</AlertDialogTitle>
            <AlertDialogDescription>
                Please provide a reason for rejecting this request. This will be visible to the user.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <Input
                placeholder="e.g., Incomplete information, facility already exists..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
            />
            <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setSelectedRequest(null); setRejectionReason(''); }}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReject}>Confirm Rejection</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
