'use client';

import { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, writeBatch, serverTimestamp, deleteDoc, query, where } from 'firebase/firestore';
import type { Facility, FacilityRequest } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, Trash2, Eye } from 'lucide-react';
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
} from "@/components/ui/alert-dialog";
import RequestDetailsDialog from './RequestDetailsDialog';
import { errorEmitter, FirestorePermissionError } from '@/firebase';

export default function RequestsList() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [selectedRequest, setSelectedRequest] = useState<FacilityRequest | null>(null);

    const pendingRequestsQuery = useMemoFirebase(
        () => query(collection(firestore, 'facilityRequests'), where('status', '==', 'pending')),
        [firestore]
    );
    const processedRequestsQuery = useMemoFirebase(
        () => query(collection(firestore, 'facilityRequests'), where('status', 'in', ['approved', 'rejected'])),
        [firestore]
    );

    const { data: pendingRequests, isLoading: pendingLoading } = useCollection<FacilityRequest>(pendingRequestsQuery);
    const { data: processedRequests, isLoading: processedLoading } = useCollection<FacilityRequest>(processedRequestsQuery);

    const isLoading = pendingLoading || processedLoading;

    const handleApprove = async (request: FacilityRequest) => {
        if (!firestore) return;
        setProcessingId(request.id);

        const batch = writeBatch(firestore);
        const newFacilityRef = doc(collection(firestore, 'facilities'));
        
        // Remove user-specific and request-specific fields before creating the facility
        const { id, userId, userName, userEmail, status, rejectionReason, ...facilityData } = request;

        const newFacilityData: Partial<Facility> = {
            ...facilityData,
            adminId: request.userId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };
        batch.set(newFacilityRef, newFacilityData);

        const requestRef = doc(firestore, 'facilityRequests', request.id);
        batch.update(requestRef, { status: 'approved', updatedAt: serverTimestamp() });
        
        batch.commit()
            .then(() => {
                toast({
                    title: 'Request Approved',
                    description: `Facility "${request.name}" has been created.`,
                });
            })
            .catch(error => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: requestRef.path,
                    operation: 'update',
                    requestResourceData: { status: 'approved' },
                }));
                 errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: newFacilityRef.path,
                    operation: 'create',
                    requestResourceData: newFacilityData,
                }));
            })
            .finally(() => {
                setProcessingId(null);
            });
    };
    
    const handleReject = async (request: FacilityRequest) => {
        if (!firestore) return;
        setProcessingId(request.id);
        const reason = prompt("Raison du rejet (optionnel):");

        const requestRef = doc(firestore, 'facilityRequests', request.id);
        const updateData = { 
            status: 'rejected', 
            rejectionReason: reason || 'No reason provided',
            updatedAt: serverTimestamp() 
        };
        const batch = writeBatch(firestore);
        batch.update(requestRef, updateData);
        
        batch.commit()
            .then(() => {
                toast({
                    title: 'Request Rejected',
                    description: `Request for "${request.name}" has been rejected.`,
                });
            })
            .catch(error => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: requestRef.path,
                    operation: 'update',
                    requestResourceData: updateData,
                }));
            })
            .finally(() => {
                setProcessingId(null);
            });
    };
    
    const handleDelete = async (requestId: string) => {
        if (!firestore) return;
        setProcessingId(requestId);
        
        const docRef = doc(firestore, 'facilityRequests', requestId);

        deleteDoc(docRef)
            .then(async () => {
                toast({
                    title: 'Request Deleted',
                    description: 'The request has been permanently deleted from database.',
                });
            })
            .catch(error => {
                 errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: docRef.path,
                    operation: 'delete',
                }));
            })
            .finally(() => {
                setProcessingId(null);
            });
    };

    const getStatusBadgeVariant = (status: FacilityRequest['status']) => {
        switch (status) {
            case 'approved': return 'default';
            case 'pending': return 'secondary';
            case 'rejected': return 'destructive';
            default: return 'outline';
        }
    };

    return (
        <>
            <div className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Demandes en Attente</CardTitle>
                        <CardDescription>Passez en revue et approuvez les nouvelles propositions d'installations.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Installation</TableHead>
                                        <TableHead className="hidden md:table-cell">Utilisateur</TableHead>
                                        <TableHead className="hidden lg:table-cell">Ville</TableHead>
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
                                    ) : pendingRequests && pendingRequests.length > 0 ? (
                                        pendingRequests.map((request) => (
                                            <TableRow key={request.id}>
                                                <TableCell className="font-medium">{request.name}</TableCell>
                                                <TableCell className="hidden md:table-cell">{request.userName}</TableCell>
                                                <TableCell className="hidden lg:table-cell">{request.city}</TableCell>
                                                <TableCell className="text-right">
                                                    {processingId === request.id ? (
                                                        <Loader2 className="ml-auto h-5 w-5 animate-spin" />
                                                    ) : (
                                                        <div className="flex justify-end items-center gap-1">
                                                            <Button size="icon" variant="ghost" onClick={() => setSelectedRequest(request)}>
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                            <Button size="icon" variant="outline" className="text-green-600 border-green-600 hover:bg-green-100 hover:text-green-700" onClick={() => handleApprove(request)}>
                                                                <CheckCircle className="h-4 w-4" />
                                                            </Button>
                                                            <Button size="icon" variant="destructive" onClick={() => handleReject(request)}>
                                                                <XCircle className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center">
                                                Aucune demande en attente.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Demandes Traitées</CardTitle>
                        <CardDescription>Historique des demandes approuvées et rejetées.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Installation</TableHead>
                                        <TableHead className="hidden md:table-cell">Utilisateur</TableHead>
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
                                    ) : processedRequests && processedRequests.length > 0 ? (
                                        processedRequests.map((request) => (
                                            <TableRow key={request.id}>
                                                <TableCell className="font-medium">{request.name}</TableCell>
                                                <TableCell className="hidden md:table-cell">{request.userName}</TableCell>
                                                <TableCell>
                                                    <Badge variant={getStatusBadgeVariant(request.status)}>{request.status}</Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {processingId === request.id ? (
                                                        <Loader2 className="ml-auto h-5 w-5 animate-spin" />
                                                    ) : (
                                                        <div className='flex items-center justify-end gap-1'>
                                                            <Button size="icon" variant="ghost" onClick={() => setSelectedRequest(request)}>
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
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
                                                        </div>
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
                        </div>
                    </CardContent>
                </Card>
            </div>
            {selectedRequest && (
                <RequestDetailsDialog 
                    request={selectedRequest} 
                    open={!!selectedRequest} 
                    onOpenChange={(open) => { if (!open) setSelectedRequest(null); }}
                />
            )}
        </>
    );
}
