"use client";

import { useAuth } from "@/hooks/use-auth";
import Header from "@/components/header";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { reservations as allReservations, facilities } from "@/lib/data";
import { format } from "date-fns";

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  if (!user) {
    return null; // or a loading spinner
  }

  const userReservations = allReservations.filter(r => r.userId === user.id);

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`;
    }
    return names[0].substring(0, 2);
  };

  return (
    <div className="min-h-screen w-full flex flex-col">
      <Header />
      <main className="flex-1 bg-muted/20">
        <div className="container mx-auto py-8 px-4">
          <Card className="mb-8">
            <CardContent className="p-6 flex items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user.avatarUrl} alt={user.name} />
                <AvatarFallback className="text-3xl">{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold font-headline">{user.name}</h1>
                <p className="text-muted-foreground">{user.email}</p>
                <Badge className="mt-2 capitalize">{user.role.replace("_", " ")}</Badge>
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
                          <TableCell>{format(new Date(reservation.date), "PPP")}</TableCell>
                          <TableCell>{reservation.timeSlot}</TableCell>
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
