'use client';

import { useState, useEffect } from 'react';
import { useUser, useDoc, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import type { User, FacilityRequest } from '@/lib/types';
import Header from '@/components/header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import AddFacilityRequestDialog from '@/components/profile/AddFacilityRequestDialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';

function ProfilePageSkeleton() {
    return (
        <div className="min-h-screen w-full flex flex-col">
            <Header />
            <main className="flex-1 bg-muted/20">
                <div className="container mx-auto py-8 px-4">
                    <div className="grid gap-8 md:grid-cols-3">
                        <div className="md:col-span-1">
                            <Card>
                                <CardContent className="pt-6 flex flex-col items-center text-center">
                                    <Skeleton className="h-24 w-24 rounded-full mb-4" />
                                    <Skeleton className="h-6 w-40 mb-2" />
                                    <Skeleton className="h-4 w-48 mb-4" />
                                    <Skeleton className="h-6 w-20 rounded-full" />
                                </CardContent>
                            </Card>
                        </div>
                        <div className="md:col-span-2">
                             <Card>
                                <CardHeader>
                                    <Skeleton className="h-7 w-1/2" />
                                    <Skeleton className="h-4 w-3/4" />
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <Skeleton className="h-10 w-full" />
                                        <Skeleton className="h-10 w-full" />
                                        <Skeleton className="h-10 w-full" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function ProfilePage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const [isAddRequestOpen, setIsAddRequestOpen] = useState(false);

    // Memoize user document reference
    const userDocRef = useMemoFirebase(
        () => (user ? doc(firestore, 'users', user.uid) : null),
        [firestore, user]
    );
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<User>(userDocRef);

    // Memoize requests collection query
    const requestsCollectionRef = useMemoFirebase(
        () => (user ? query(collection(firestore, 'facilityRequests'), where('userId', '==', user.uid)) : null),
        [firestore, user]
    );

    const { data: requests, isLoading: areRequestsLoading } = useCollection<FacilityRequest>(requestsCollectionRef);

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // The overall loading state depends on both user and profile loading states
        if (!isUserLoading && !isProfileLoading) {
            setIsLoading(false);
        }
    }, [isUserLoading, isProfileLoading]);

    const getInitials = (name?: string) => {
        if (!name) return '';
        const names = name.split(' ');
        return names.length > 1 ? `${names[0][0]}${names[names.length - 1][0]}` : name.substring(0, 2);
    };
    
    if (isLoading) {
        return <ProfilePageSkeleton />;
    }

    if (!user || !userProfile) {
        return (
            <div className="flex h-screen items-center justify-center">
                <p>You must be logged in to view this page.</p>
            </div>
        );
    }
    
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
            <div className="min-h-screen w-full flex flex-col">
                <Header />
                <main className="flex-1 bg-muted/20">
                    <div className="container mx-auto py-8 px-4">
                        <div className="grid gap-8 md:grid-cols-3">
                            <div className="md:col-span-1">
                                <Card>
                                    <CardContent className="pt-6 flex flex-col items-center text-center">
                                        <Avatar className="h-24 w-24 mb-4">
                                            <AvatarImage src={undefined} alt={userProfile.name} />
                                            <AvatarFallback>{getInitials(userProfile.name)}</AvatarFallback>
                                        </Avatar>
                                        <h2 className="text-2xl font-bold">{userProfile.name}</h2>
                                        <p className="text-muted-foreground mb-4">{userProfile.email}</p>
                                        <Badge variant="outline">{userProfile.role}</Badge>
                                    </CardContent>
                                </Card>
                            </div>
                            <div className="md:col-span-2">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <div>
                                            <CardTitle>Mes Demandes d'Ajout</CardTitle>
                                            <CardDescription>Suivez l'état de vos propositions d'installations.</CardDescription>
                                        </div>
                                        <Button onClick={() => setIsAddRequestOpen(true)}>
                                            <PlusCircle className="mr-2 h-4 w-4" />
                                            Nouvelle Demande
                                        </Button>
                                    </CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Nom de l'installation</TableHead>
                                                    <TableHead>Date</TableHead>
                                                    <TableHead>Statut</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {areRequestsLoading ? (
                                                    <TableRow>
                                                        <TableCell colSpan={3} className="h-24 text-center">
                                                            <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                                                        </TableCell>
                                                    </TableRow>
                                                ) : requests && requests.length > 0 ? (
                                                    requests.map((request) => (
                                                        <TableRow key={request.id}>
                                                            <TableCell className="font-medium">{request.name}</TableCell>
                                                            <TableCell>
                                                                {request.createdAt?.seconds 
                                                                    ? format(new Date(request.createdAt.seconds * 1000), 'dd/MM/yyyy')
                                                                    : '...'}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge variant={getStatusBadgeVariant(request.status)}>{request.status}</Badge>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={3} className="h-24 text-center">
                                                            Vous n'avez soumis aucune demande.
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
            <AddFacilityRequestDialog open={isAddRequestOpen} onOpenChange={setIsAddRequestOpen} />
        </>
    );
}
