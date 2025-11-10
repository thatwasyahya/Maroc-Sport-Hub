'use client';

import { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, writeBatch, serverTimestamp, addDoc, deleteDoc } from 'firebase/firestore';
import type { Facility, FacilityRequest } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, MoreHorizontal, Loader2, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
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
} from "@/components/ui/alert-dialog"

export default function RequestsList() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [processingId, setProcessingId] = useState<string | null>(null);

    const requestsCollectionRef = useMemoFirebase(
        () => collection(firestore, 'facilityRequests'),
        [firestore]
    );
    const { data: requests, isLoading } = useCollection<FacilityRequest>(requestsCollectionRef);

    const handleApprove = async (request: FacilityRequest) => {
        if (!firestore) return;
        setProcessingId(request.id);

        try {
            const batch = writeBatch(firestore);

            // 1. Create new facility document
            const newFacilityRef = doc(collection(firestore, 'facilities'));
            const newFacilityData: Omit<Facility, 'id' | 'location' | 'photos'> & { adminId: string, createdAt: any, updatedAt: any } = {
                adminId: request.userId,
                name: request.name,
                description: request.description,
                address: request.address,
                region: request.region,
                city: request.city,
                sports: request.sports,
                type: request.type,
                accessible: request.accessible,
                equipmentIds: request.equipmentIds,
                rentalCost: request.rentalCost,
                depositCost: request.depositCost,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };
            batch.set(newFacilityRef, newFacilityData);

            // 2. Update the request status
            const requestRef = doc(firestore, 'facilityRequests', request.id);
            batch.update(requestRef, { status: 'approved', updatedAt: serverTimestamp() });
            
            await batch.commit();

            toast({
                title: 'Request Approved',
                description: `Facility "${request.name}" has been created.`,
            });
        } catch (error) {
            console.error("Error approving request: ", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not approve the request.',
            });
        } finally {
            setProcessingId(null);
        }
    };
    
    const handleReject = async (request: FacilityRequest) => {
        // For now, a simple rejection. A real app might have a dialog for the reason.
        if (!firestore) return;
        setProcessingId(request.id);
        const reason = prompt("Raison du rejet (optionnel):");

        try {
            const requestRef = doc(firestore, 'facilityRequests', request.id);
            const batch = writeBatch(firestore);
            batch.update(requestRef, { 
                status: 'rejected', 
                rejectionReason: reason || 'No reason provided',
                updatedAt: serverTimestamp() 
            });
            await batch.commit();
             toast({
                title: 'Request Rejected',
                description: `Request for "${request.name}" has been rejected.`,
            });
        } catch (error) {
            console.error("Error rejecting request: ", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not reject the request.',
            });
        } finally {
            setProcessingId(null);
        }
    };
    
    const handleDelete = async (requestId: string) => {
        if (!firestore) return;
        setProcessingId(requestId);
        try {
            await deleteDoc(doc(firestore, 'facilityRequests', requestId));
            toast({
                title: 'Request Deleted',
                description: 'The request has been permanently deleted.',
            });
        } catch (error) {
            console.error("Error deleting request: ", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not delete the request.',
            });
        } finally {
            setProcessingId(null);
        }
    };

    const getStatusBadgeVariant = (status: FacilityRequest['status']) => {
        switch (status) {
            case 'approved': return 'default';
            case 'pending': return 'secondary';
            case 'rejected': return 'destructive';
            default: return 'outline';
        }
    };

    const pendingRequests = requests?.filter(r => r.status === 'pending') || [];
    const processedRequests = requests?.filter(r => r.status !== 'pending') || [];

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Demandes en Attente</CardTitle>
                    <CardDescription>Passez en revue et approuvez les nouvelles propositions d'installations.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Installation</TableHead>
                                <TableHead>Utilisateur</TableHead>
                                <TableHead>Ville</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                                    </TableCell>
                                </TableRow>
                            ) : pendingRequests.length > 0 ? (
                                pendingRequests.map((request) => (
                                    <TableRow key={request.id}>
                                        <TableCell className="font-medium">{request.name}</TableCell>
                                        <TableCell>{request.userName}</TableCell>
                                        <TableCell>{request.city}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusBadgeVariant(request.status)}>{request.status}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {processingId === request.id ? (
                                                <Loader2 className="ml-auto h-5 w-5 animate-spin" />
                                            ) : (
                                                <div className="flex justify-end gap-2">
                                                    <Button size="sm" variant="outline" onClick={() => handleApprove(request)}>
                                                        <CheckCircle className="mr-2 h-4 w-4" /> Approuver
                                                    </Button>
                                                    <Button size="sm" variant="destructive" onClick={() => handleReject(request)}>
                                                        <XCircle className="mr-2 h-4 w-4" /> Rejeter
                                                    </Button>
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        Aucune demande en attente.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Demandes Traitées</CardTitle>
                    <CardDescription>Historique des demandes approuvées et rejetées.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Installation</TableHead>
                                <TableHead>Utilisateur</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                                    </TableCell>
                                </TableRow>
                            ) : processedRequests.length > 0 ? (
                                processedRequests.map((request) => (
                                    <TableRow key={request.id}>
                                        <TableCell className="font-medium">{request.name}</TableCell>
                                        <TableCell>{request.userName}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusBadgeVariant(request.status)}>{request.status}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {processingId === request.id ? (
                                                 <Loader2 className="ml-auto h-5 w-5 animate-spin" />
                                            ) : (
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="text-destructive">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This will permanently delete the request. This action cannot be undone.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDelete(request.id)}>
                                                                Delete
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        Aucune demande traitée.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
