"use client";

import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import Header from "@/components/header";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { reservations as allReservations, facilities } from "@/lib/data";
import { format } from "date-fns";
import { doc } from "firebase/firestore";

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const userDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userDocRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login");
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || isProfileLoading || !user || !userProfile) {
    return null; // or a loading spinner
  }

  const userReservations = allReservations.filter(r => r.userId === user.uid);

  const getInitials = (name?: string) => {
    if (!name) return "";
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`;
    }
    return name.substring(0, 2);
  };
  
  const displayName = userProfile.firstName ? `${userProfile.firstName} ${userProfile.lastName}` : user.email;

  return (
    <div className="min-h-screen w-full flex flex-col">
      <Header />
      <main className="flex-1 bg-muted/20">
        <div className="container mx-auto py-8 px-4">
          <Card className="mb-8">
            <CardContent className="p-6 flex items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user.photoURL || undefined} alt={displayName || ""} />
                <AvatarFallback className="text-3xl">{getInitials(displayName)}</AvatarFallback>
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
                  {userReservations.length > 0 ? (
                    userReservations.map(reservation => {
                      const facility = facilities.find(f => f.id === reservation.facilityId);
                      return (
                        <TableRow key={reservation.id}>
                          <TableCell className="font-medium">{facility?.name || 'N/A'}</TableCell>
                          <TableCell>{format(new Date(reservation.date), "PPP")}</TableCell>                          <TableCell>{reservation.timeSlot}</TableCell>
                          <TableCell>
                            <Badge variant={reservation.status === 'confirmed' ? 'default' : 'destructive'} className="bg-primary/20 text-primary-foreground">
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
