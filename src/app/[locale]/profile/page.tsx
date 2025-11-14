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
import { PlusCircle, Loader2, Edit } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import AddFacilityRequestDialog from '@/components/profile/AddFacilityRequestDialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';

function ProfilePageSkeleton() {
    return (
        <div className="min-h-screen w-full flex flex-col bg-muted/40">
            <Header />
            <main className="flex-1">
                <div className="container mx-auto py-12 px-4">
                    <div className="grid gap-8 md:grid-cols-12">
                        <div className="md:col-span-4 lg:col-span-3">
                            <Card className="text-center">
                                <CardContent className="pt-6">
                                    <Skeleton className="h-28 w-28 rounded-full mb-4 mx-auto" />
                                    <Skeleton className="h-7 w-4/5 mb-2 mx-auto" />
                                    <Skeleton className="h-5 w-full mb-4 mx-auto" />
                                    <Skeleton className="h-6 w-24 rounded-full mx-auto" />
                                </CardContent>
                            </Card>
                        </div>
                        <div className="md:col-span-8 lg:col-span-9">
                             <Card>
                                <CardHeader>
                                    <Skeleton className="h-7 w-1/2" />
                                    <Skeleton className="h-4 w-3/4" />
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <Skeleton className="h-12 w-full" />
                                        <Skeleton className="h-12 w-full" />
                                        <Skeleton className="h-12 w-full" />
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

    const userDocRef = useMemoFirebase(
        () => (user ? doc(firestore, 'users', user.uid) : null),
        [firestore, user]
    );
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<User>(userDocRef);

    const requestsCollectionRef = useMemoFirebase(
        () => (user ? query(collection(firestore, 'facilityRequests'), where('userId', '==', user.uid)) : null),
        [firestore, user]
    );

    const { data: requests, isLoading: areRequestsLoading } = useCollection<FacilityRequest>(requestsCollectionRef);

    if (isUserLoading || isProfileLoading) {
        return <ProfilePageSkeleton />;
    }

    if (!user || !userProfile) {
        return (
            <div className="flex h-screen items-center justify-center">
                <p>Vous devez être connecté pour voir cette page.</p>
            </div>
        );
    }
    
    const getInitials = (name?: string) => {
        if (!name) return '';
        const names = name.split(' ');
        if (names.length > 1 && names[1]) {
          return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
        }
        return name ? name.substring(0, 2).toUpperCase() : "";
    };
    
    const getStatusBadgeVariant = (status: FacilityRequest['status']) => {
        switch (status) {
            case 'approved': return 'default';
            case 'pending': return 'secondary';
            case 'rejected': return 'destructive';
            default: return 'outline';
        }
    };
    
    const roleVariantMap: {[key: string]: "default" | "secondary" | "destructive" | "outline"} = {
        super_admin: 'destructive',
        admin: 'default',
        user: 'secondary'
    }

    return (
        <>
            <div className="min-h-screen w-full flex flex-col bg-muted/40">
                <Header />
                <main className="flex-1">
                    <div className="container mx-auto py-6 sm:py-12 px-4">
                        <div className="grid gap-8 md:grid-cols-12">
                            <div className="md:col-span-4 lg:col-span-3">
                                <Card className="text-center sticky top-24">
                                    <CardContent className="pt-8">
                                        <div className="relative w-28 h-28 mx-auto mb-4">
                                            <Avatar className="h-full w-full border-4 border-background">
                                                <AvatarImage src={userProfile.avatarUrl} alt={userProfile.name} />
                                                <AvatarFallback className="text-3xl">{getInitials(userProfile.name)}</AvatarFallback>
                                            </Avatar>
                                            <Button size="icon" className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full border-2 border-background">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <h2 className="text-2xl font-bold font-headline">{userProfile.name}</h2>
                                        <p className="text-muted-foreground mb-4 break-all">{userProfile.email}</p>
                                        <Badge variant={roleVariantMap[userProfile.role] || 'outline'} className="capitalize">{userProfile.role.replace('_', ' ')}</Badge>
                                    </CardContent>
                                </Card>
                            </div>
                            <div className="md:col-span-8 lg:col-span-9">
                                <Card>
                                    <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                        <div>
                                            <CardTitle className="font-headline text-2xl">Mes Demandes d'Ajout</CardTitle>
                                            <CardDescription>Suivez l'état de vos propositions d'installations.</CardDescription>
                                        </div>
                                        <Button onClick={() => setIsAddRequestOpen(true)} className="shrink-0 w-full md:w-auto">
                                            <PlusCircle className="mr-2 h-4 w-4" />
                                            Nouvelle Demande
                                        </Button>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="overflow-x-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Nom de l'installation</TableHead>
                                                        <TableHead className="hidden sm:table-cell">Date</TableHead>
                                                        <TableHead>Statut</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {areRequestsLoading ? (
                                                        <TableRow>
                                                            <TableCell colSpan={3} className="h-36 text-center">
                                                                <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : requests && requests.length > 0 ? (
                                                        requests.map((request) => (
                                                            <TableRow key={request.id} className="hover:bg-muted/50">
                                                                <TableCell className="font-medium">{request.name}</TableCell>
                                                                <TableCell className="hidden sm:table-cell">
                                                                    {request.createdAt?.seconds 
                                                                        ? format(new Date(request.createdAt.seconds * 1000), 'dd/MM/yyyy')
                                                                        : '...'}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Badge variant={getStatusBadgeVariant(request.status)} className="capitalize">{request.status}</Badge>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))
                                                    ) : (
                                                        <TableRow>
                                                            <TableCell colSpan={3} className="h-36 text-center text-muted-foreground">
                                                                Vous n'avez soumis aucune demande.
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>
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
