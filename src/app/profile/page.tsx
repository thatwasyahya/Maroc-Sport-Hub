"use client";

import { useUser, useDoc, useFirestore, useMemoFirebase, useCollection } from "@/firebase";
import Header from "@/components/header";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { collection, doc, Timestamp } from "firebase/firestore";
import type { Reservation, Facility, User } from "@/lib/types";

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const userDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<User>(userDocRef);

  const reservationsCollectionRef = useMemoFirebase(
    () => (user ? collection(firestore, 'users', user.uid, 'reservations') : null),
    [user, firestore]
  );
  const { data: userReservations } = useCollection<Reservation>(reservationsCollectionRef);
  
  const facilitiesCollectionRef = useMemoFirebase(
    () => collection(firestore, 'facilities'),
    [firestore]
  );
  const { data: facilities } = useCollection<Facility>(facilitiesCollectionRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login");
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || isProfileLoading || !user || !userProfile) {
    return null; // or a loading spinner
  }

  const getInitials = (firstName?: string, lastName?: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`;
    }
    if(firstName) {
      return firstName.substring(0, 2);
    }
    if(user?.email){
      return user.email.substring(0,2).toUpperCase();
    }
    return "";
  };
  
  const displayName = userProfile.firstName ? `${userProfile.firstName} ${userProfile.lastName}` : user.email;

  const formatDate = (dateValue: any) => {
    if (!dateValue) return "Date invalide";
    try {
      const date = dateValue instanceof Timestamp ? dateValue.toDate() : new Date(dateValue);
      return format(date, "PPP");
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Date invalide";
    }
  };

  const formatTime = (dateValue: any) => {
    if (!dateValue) return "";
    try {
      const date = dateValue instanceof Timestamp ? dateValue.toDate() : new Date(dateValue);
      return format(date, "p");
    } catch (error) {
      console.error("Error formatting time:", error);
      return "";
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
                <AvatarFallback className="text-3xl">{getInitials(userProfile.firstName, userProfile.lastName)}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold font-headline">{displayName}</h1>
                <p className="text-muted-foreground">{user.email}</p>
                <Badge className="mt-2 capitalize">{userProfile.role.replace("_", " ")}</Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">My Reservations</CardTitle>
              <CardDescription>Here is a list of your past and upcoming reservations.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Facility</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time Slot</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userReservations && facilities && userReservations.length > 0 ? (
                    userReservations.map(reservation => {
                      const facility = facilities.find(f => f.id === reservation.facilityId);
                      return (
                        <TableRow key={reservation.id}>
                          <TableCell className="font-medium">{facility?.name || 'N/A'}</TableCell>
                          <TableCell>{formatDate(reservation.startTime)}</TableCell>
                          <TableCell>{`${formatTime(reservation.startTime)} - ${formatTime(reservation.endTime)}`}</TableCell>
                          <TableCell>
                            <Badge 
                               variant={reservation.status === 'confirmed' ? 'default' : reservation.status === 'pending' ? 'secondary' : 'destructive'} 
                               className="capitalize"
                            >
                              {reservation.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">You have no reservations.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
