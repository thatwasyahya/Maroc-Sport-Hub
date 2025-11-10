"use client";

import { useUser, useDoc, useFirestore, useMemoFirebase, useCollection } from "@/firebase";
import Header from "@/components/header";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { collection, doc, query, where } from "firebase/firestore";
import type { User, FacilityRequest } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import AddFacilityRequestDialog from "@/components/profile/AddFacilityRequestDialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

function ProfilePageSkeleton() {
    return (
        <div className="min-h-screen w-full flex flex-col">
            <Header />
            <main className="flex-1 bg-muted/20">
                <div className="container mx-auto py-8 px-4">
                    <Card className="mb-8">
                        <CardContent className="p-6 flex items-center gap-6">
                            <Skeleton className="h-24 w-24 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-8 w-48" />
                                <Skeleton className="h-5 w-64" />
                                <Skeleton className="h-6 w-20" />
                            </div>
                            <Skeleton className="h-10 w-48" />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>My Facility Requests</CardTitle>
                            <CardDescription>Track the status of your facility addition requests here.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}


export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [isAddRequestDialogOpen, setIsAddRequestDialogOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login");
    }
  }, [user, isUserLoading, router]);

  const userDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<User>(userDocRef);
  
  const userRequestsQuery = useMemoFirebase(
    () => (user ? query(collection(firestore, 'facilityRequests'), where('userId', '==', user.uid)) : null),
    [user, firestore]
  );
  const { data: facilityRequests, isLoading: isRequestsLoading } = useCollection<FacilityRequest>(userRequestsQuery);

  const isLoading = isUserLoading || isProfileLoading;

  if (!isClient || isLoading || !user || !userProfile) {
    return <ProfilePageSkeleton />;
  }

  const getInitials = (firstName?: string, lastName?: string, email?: string | null) => {
    if (firstName && lastName) return `${'\'\'\''}${firstName[0]}${'\'\'\''}${'\'\'\''}${lastName[0]}${'\'\'\''}`;
    if (firstName) return firstName.substring(0, 2);
    if (email) return email.substring(0, 2).toUpperCase();
    return "";
  };
  
  const displayName = userProfile.firstName ? `${'\'\'\''}${userProfile.firstName}${'\'\'\''} ${'\'\'\''}${userProfile.lastName}${'\'\'\''}` : user.email;

  const getStatusBadgeVariant = (status: FacilityRequest['status']) => {
    switch (status) {
        case 'pending': return 'secondary';
        case 'approved': return 'default';
        case 'rejected': return 'destructive';
        default: return 'outline';
    }
  };


  return (
    <div className="min-h-screen w-full flex flex-col">
      <Header />
      <main className="flex-1 bg-muted/20">
        <div className="container mx-auto py-8 px-4">
          <Card className="mb-8">
            <CardContent className="p-6 flex items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user.photoURL || undefined} alt={displayName || ""} />
                <AvatarFallback className="text-3xl">{getInitials(userProfile.firstName, userProfile.lastName, user.email)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-3xl font-bold font-headline">{displayName}</h1>
                <p className="text-muted-foreground">{user.email}</p>
                <Badge className="mt-2 capitalize">{userProfile.role.replace("_", " ")}</Badge>
              </div>
              <Button onClick={() => setIsAddRequestDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Submit a Facility Request
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>My Facility Requests</CardTitle>
              <CardDescription>Track the status of your facility addition requests here.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Facility Name</TableHead>
                    <TableHead>Date Submitted</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reason (if rejected)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isRequestsLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">Loading requests...</TableCell>
                    </TableRow>
                  ) : facilityRequests && facilityRequests.length > 0 ? (
                    facilityRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">{request.name}</TableCell>
                        <TableCell>{request.createdAt?.toDate ? format(request.createdAt.toDate(), 'PPP') : 'N/A'}</TableCell>
                        <TableCell><Badge variant={getStatusBadgeVariant(request.status)} className="capitalize">{request.status}</Badge></TableCell>
                        <TableCell>{request.rejectionReason || 'N/A'}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">You haven&apos;t submitted any requests yet.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
      <AddFacilityRequestDialog open={isAddRequestDialogOpen} onOpenChange={setIsAddRequestDialogOpen} />
    </div>
  );
}
