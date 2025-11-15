'use client';

import { useState } from 'react';
import { useUser, useDoc, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { collection, doc, query, where } from 'firebase/firestore';
import type { User, FacilityRequest } from '@/lib/types';
import Header from '@/components/header';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2, Edit, Phone, VenetianMask, Mail, Cake, Briefcase, MapPin, Trophy } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import AddFacilityRequestDialog from '@/components/profile/AddFacilityRequestDialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { useTranslations } from 'next-intl';
import EditProfileDialog from '@/components/profile/EditProfileDialog';
import { setRequestLocale } from 'next-intl/server';

function ProfilePageSkeleton() {
    const t = useTranslations('Profile');
    return (
        <div className="min-h-screen w-full flex flex-col bg-muted/40">
            <Header />
            <main className="flex-1">
                <div className="container mx-auto py-12 px-4">
                    <div className="grid gap-8 md:grid-cols-12">
                        <div className="md:col-span-4 lg:col-span-3">
                            <Card>
                                <CardContent className="pt-6">
                                    <Skeleton className="h-28 w-28 rounded-full mb-4 mx-auto" />
                                    <Skeleton className="h-7 w-4/5 mb-2 mx-auto" />
                                    <Skeleton className="h-5 w-full mb-2 mx-auto" />
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

export default function ProfilePage({ params }: { params: { locale: string } }) {
    const locale = params.locale;
    setRequestLocale(locale);
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const [isAddRequestOpen, setIsAddRequestOpen] = useState(false);
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const t = useTranslations('Profile');

    const userDocRef = useMemoFirebase(
        () => (user ? doc(firestore, 'users', user.uid) : null),
        [firestore, user]
    );
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<User>(userDocRef);

    const requestsQuery = useMemoFirebase(
        () => (user ? query(collection(firestore, 'facilityRequests'), where('userId', '==', user.uid)) : null),
        [firestore, user]
    );
    const { data: requests, isLoading: areRequestsLoading } = useCollection<FacilityRequest>(requestsQuery);

    if (isUserLoading || isProfileLoading) {
        return <ProfilePageSkeleton />;
    }

    if (!user || !userProfile) {
        return (
            <div className="flex h-screen items-center justify-center">
                <p>{t('notConnected')}</p>
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

    const birthDate = userProfile.birthDate ? (userProfile.birthDate.seconds ? new Date(userProfile.birthDate.seconds * 1000) : userProfile.birthDate) : null;

    return (
        <>
            <div className="min-h-screen w-full flex flex-col bg-muted/40">
                <Header />
                <main className="flex-1">
                    <div className="container mx-auto py-6 sm:py-12 px-4">
                        <div className="grid gap-8 md:grid-cols-12">
                            <div className="md:col-span-4 lg:col-span-3">
                                <Card className="sticky top-24">
                                     <CardHeader className='items-center text-center'>
                                        <Avatar className="h-28 w-28 border-4 border-background">
                                            <AvatarFallback className="text-3xl">{getInitials(userProfile.name)}</AvatarFallback>
                                        </Avatar>
                                        <div className='pt-4 flex flex-col items-center gap-2'>
                                            <div className="flex items-center gap-2">
                                                <CardTitle className="font-headline text-2xl">{userProfile.name}</CardTitle>
                                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setIsEditProfileOpen(true)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <Badge variant={roleVariantMap[userProfile.role] || 'outline'} className="capitalize mt-1">{userProfile.role.replace('_', ' ')}</Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="text-sm text-muted-foreground space-y-3">
                                        <div className="flex items-center gap-3">
                                            <Mail className="w-4 h-4" />
                                            <span className="break-all">{userProfile.email}</span>
                                        </div>
                                         <div className="flex items-center gap-3">
                                            <Briefcase className="w-4 h-4" />
                                            <span>{userProfile.jobTitle || "Non spécifié"}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <MapPin className="w-4 h-4" />
                                            <span>{userProfile.city || "Non spécifié"}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Phone className="w-4 h-4" />
                                            <span>{userProfile.phoneNumber || "Non spécifié"}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <VenetianMask className="w-4 h-4" />
                                            <span>{userProfile.gender || "Non spécifié"}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Cake className="w-4 h-4" />
                                            <span>{birthDate ? format(birthDate, 'dd/MM/yyyy') : "Non spécifié"}</span>
                                        </div>
                                        {userProfile.favoriteSports && userProfile.favoriteSports.length > 0 && (
                                            <div className="flex flex-col gap-3 pt-2">
                                                <div className='flex items-center gap-3'>
                                                    <Trophy className="w-4 h-4" />
                                                    <span className='font-medium'>Sports Favoris</span>
                                                </div>
                                                <div className='flex flex-wrap gap-2 pl-7'>
                                                    {userProfile.favoriteSports.map(sport => <Badge key={sport} variant="secondary">{sport}</Badge>)}
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                            <div className="md:col-span-8 lg:col-span-9">
                                <Card>
                                    <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                        <div>
                                            <CardTitle className="font-headline text-2xl">{t('requestsTitle')}</CardTitle>
                                            <CardDescription>{t('requestsDescription')}</CardDescription>
                                        </div>
                                        <Button onClick={() => setIsAddRequestOpen(true)} className="shrink-0 w-full md:w-auto">
                                            <PlusCircle className="mr-2 h-4 w-4" />
                                            {t('newRequestButton')}
                                        </Button>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="overflow-x-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>{t('tableHeaderName')}</TableHead>
                                                        <TableHead className="hidden sm:table-cell">{t('tableHeaderDate')}</TableHead>
                                                        <TableHead>{t('tableHeaderStatus')}</TableHead>
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
                                                                    <Badge variant={getStatusBadgeVariant(request.status)} className="capitalize">{t(`status.${request.status}`)}</Badge>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))
                                                    ) : (
                                                        <TableRow>
                                                            <TableCell colSpan={3} className="h-36 text-center text-muted-foreground">
                                                                {t('noRequests')}
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
            {userProfile && (
              <EditProfileDialog 
                open={isEditProfileOpen} 
                onOpenChange={setIsEditProfileOpen} 
                user={userProfile} 
              />
            )}
        </>
    );
}
