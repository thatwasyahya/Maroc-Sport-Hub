"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert } from "lucide-react";


export default function ManageUsersPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">User Management</CardTitle>
          <CardDescription>View users and manage their roles.</CardDescription>
        </CardHeader>
        <CardContent>
            <Alert variant="destructive">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Section en maintenance</AlertTitle>
                <AlertDescription>
                    Cette section est temporairement désactivée en raison d'un problème de configuration des permissions. Nous travaillons à sa résolution.
                </AlertDescription>
            </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
