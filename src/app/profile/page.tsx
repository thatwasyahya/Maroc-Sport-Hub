"use client";

import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import Header from "@/components/header";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { doc } from "firebase/firestore";
import type { User } from "@/lib/types";

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const userDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<User>(userDocRef);

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
        </div>
      </main>
    </div>
  );
}
