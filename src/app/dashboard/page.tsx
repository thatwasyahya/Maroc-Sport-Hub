
"use client";

import { useUser, useDoc, useFirestore, useMemoFirebase, useCollection } from "@/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Warehouse, Users, CalendarCheck, BarChart2 } from "lucide-react";
import { useMemo } from "react";
import { format, subDays, startOfDay } from "date-fns";
import { collection, doc } from 'firebase/firestore';
import type { Facility, User as AppUser, Reservation } from "@/lib/types";

export default function DashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const userDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  const { data: userProfile } = useDoc(userDocRef);

  const facilitiesCollectionRef = useMemoFirebase(
    () => collection(firestore, 'facilities'),
    [firestore]
  );
  const { data: facilities } = useCollection<Facility>(facilitiesCollectionRef);

  // This was causing a permission error for non-super-admins.
  // We will temporarily disable this metric.
  const users: AppUser[] = []; 
  const reservations: Reservation[] = [];

  const weeklyReservationsData = useMemo(() => {
    const data: { name: string; reservations: number }[] = [];
    const today = startOfDay(new Date());

    for (let i = 6; i >= 0; i--) {
        const date = subDays(today, i);
        const dayName = format(date, "eee");
        
        // As we cannot fetch all reservations, this will be 0 for now.
        // This logic is kept for future implementation if needed.
        const dailyReservations = reservations.filter(r => {
            const reservationDate = new Date(r.date);
            return startOfDay(reservationDate).getTime() === date.getTime() && r.status === 'confirmed';
        }).length;

        data.push({ name: dayName, reservations: dailyReservations });
    }
    return data;
  }, [reservations]);
  
  const displayName = userProfile?.firstName ? `${userProfile.firstName} ${userProfile.lastName}` : user?.email;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold tracking-tight mb-6 font-headline">
        Welcome, {displayName}!
      </h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Facilities</CardTitle>
            <Warehouse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{facilities?.length || 0}</div>
            <p className="text-xs text-muted-foreground">across all regions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {/* This metric is temporarily disabled due to permission constraints. */}
            <div className="text-2xl font-bold">{users?.length || 0}</div>
            <p className="text-xs text-muted-foreground">including admins</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reservations</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {/* This metric is temporarily disabled due to permission constraints. */}
            <div className="text-2xl font-bold">{reservations?.length || 0}</div>
            <p className="text-xs text-muted-foreground">past and upcoming</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BarChart2 className="h-5 w-5" />
                    Weekly Reservation Rate
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={weeklyReservationsData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                        <Tooltip
                            contentStyle={{
                                background: "hsl(var(--background))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "var(--radius)",
                            }}
                        />
                        <Legend wrapperStyle={{fontSize: "14px"}}/>
                        <Bar dataKey="reservations" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
