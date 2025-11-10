'use client';

import { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, writeBatch, serverTimestamp, deleteDoc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, deleteObject } from 'firebase/storage';
import type { Facility, FacilityRequest } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, Trash2, Eye, Paperclip } from 'lucide-react';
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
    const storage = getStorage();
    const { toast } = useToast();
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [selectedRequest, setSelectedRequest] = useState<FacilityRequest | null>(null);

    const requestsCollectionRef = useMemoFirebase(
        () => collection(firestore, 'facilityRequests'),
        [firestore]
    );
    const { data: requests, isLoading } = useCollection<FacilityRequest>(requestsCollectionRef);

    const handleApprove = async (request: FacilityRequest) => {
        if (!firestore) return;
        setProcessingId(request.id);

        const batch = writeBatch(firestore);
        const newFacilityRef = doc(collection(firestore, 'facilities'));
        
        const newFacilityData: Omit<Facility, 'id'> & { createdAt: any, updatedAt: any } = {
            adminId: request.userId,
            name: request.name,
            description: request.description,
            address: request.address,
            region: request.region,
            city: request.city,
            sports: request.sports,
            type: request.type,
            accessible: request.accessible,
            equipments: request.equipments || [],
            location: request.location,
            photoUrl: request.photoUrl,
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
        const requestDoc = requests?.find(r => r.id === requestId);
        
        const docRef = doc(firestore, 'facilityRequests', requestId);

        deleteDoc(docRef)
            .then(async () => {
                toast({
                    title: 'Request Deleted',
                    description: 'The request has been permanently deleted from database.',
                });
                 // Also delete attachment and photo from storage if they exist
                if (requestDoc?.attachmentUrl) {
                    const attachmentRef = ref(storage, requestDoc.attachmentUrl);
                    await deleteObject(attachmentRef);
                    toast({ title: 'Attachment Deleted', description: 'Attachment file removed from storage.'});
                }
                if (requestDoc?.photoUrl) {
                    const photoRef = ref(storage, requestDoc.photoUrl);
                    await deleteObject(photoRef);
                    toast({ title: 'Photo Deleted', description: 'Photo removed from storage.'});
                }
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

    const handleDeleteAttachment = async (request: FacilityRequest) => {
        if (!request.attachmentUrl || !firestore) return;
        setProcessingId(request.id);

        try {
            // Delete from storage
            const attachmentRef = ref(storage, request.attachmentUrl);
            await deleteObject(attachmentRef);

            // Update firestore document
            const requestDocRef = doc(firestore, 'facilityRequests', request.id);
            await updateDoc(requestDocRef, {
                attachmentUrl: null
            });
            
            toast({
                title: "Attachment Deleted",
                description: "The attachment has been removed successfully."
            });
            setSelectedRequest(prev => prev ? { ...prev, attachmentUrl: undefined } : null);

        } catch (error) {
             toast({
                variant: 'destructive',
                title: "Error Deleting Attachment",
                description: "Could not remove the attachment. Please check permissions."
            });
             console.error("Error deleting attachment: ", error);
        } finally {
            setProcessingId(null);
        }
    }


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
        <>
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
                                    <TableHead>Pièce jointe</TableHead>
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
                                                {request.attachmentUrl ? (
                                                    <Button variant="ghost" size="sm" asChild>
                                                        <a href={request.attachmentUrl} target="_blank" rel="noopener noreferrer">
                                                            <Paperclip className="h-4 w-4" />
                                                        </a>
                                                    </Button>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">Aucune</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {processingId === request.id ? (
                                                    <Loader2 className="ml-auto h-5 w-5 animate-spin" />
                                                ) : (
                                                    <div className="flex justify-end gap-2">
                                                        <Button size="sm" variant="ghost" onClick={() => setSelectedRequest(request)}>
                                                            <Eye className="mr-2 h-4 w-4" /> Détails
                                                        </Button>
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
                                                    <div className='flex items-center justify-end gap-2'>
                                                        <Button size="sm" variant="ghost" onClick={() => setSelectedRequest(request)}>
                                                            <Eye className="mr-2 h-4 w-4" /> Détails
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
                                                                        This will permanently delete the request and all its associated files. This action cannot be undone.
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
                    </CardContent>
                </Card>
            </div>
            {selectedRequest && (
                <RequestDetailsDialog 
                    request={selectedRequest} 
                    open={!!selectedRequest} 
                    onOpenChange={(open) => { if (!open) setSelectedRequest(null); }}
                    onDeleteAttachment={handleDeleteAttachment}
                />
            )}
        </>
    );
}
