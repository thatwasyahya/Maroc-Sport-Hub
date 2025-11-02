"use client";

import { useCollection, useFirestore, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { collection, doc } from "firebase/firestore";
import type { User, UserRole } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

export default function ManageUsersPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const usersCollectionRef = useMemoFirebase(
    () => collection(firestore, 'users'),
    [firestore]
  );
  const { data: users, isLoading } = useCollection<User>(usersCollectionRef);

  const getInitials = (firstName?: string, lastName?: string) => {
    if (firstName && lastName) {
        return `${firstName[0]}${lastName[0]}`;
    }
    if(firstName) {
        return firstName.substring(0, 2);
    }
    return '';
  };

  const getDisplayName = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email;
  }

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    const userDocRef = doc(firestore, 'users', userId);
    
    // Update the role in the user document
    setDocumentNonBlocking(userDocRef, { role: newRole }, { merge: true });

    // Manage role collections for admin/super_admin
    const adminRoleDoc = doc(firestore, 'roles_admin', userId);
    const superAdminRoleDoc = doc(firestore, 'roles_super_admin', userId);

    if (newRole === 'admin') {
        setDocumentNonBlocking(adminRoleDoc, { userId }, { merge: true });
        deleteDocumentNonBlocking(superAdminRoleDoc);
    } else if (newRole === 'super_admin') {
        setDocumentNonBlocking(superAdminRoleDoc, { userId }, { merge: true });
        deleteDocumentNonBlocking(adminRoleDoc);
    } else { // 'user' role
        deleteDocumentNonBlocking(adminRoleDoc);
        deleteDocumentNonBlocking(superAdminRoleDoc);
    }

    toast({
      title: "Role Updated",
      description: `The user's role has been changed to ${newRole.replace("_", " ")}.`,
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">User Management</CardTitle>
          <CardDescription>View users and manage their roles.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="w-[180px]">Change Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">Loading users...</TableCell>
                </TableRow>
              )}
              {!isLoading && users && users.map((user) => {
                const displayName = getDisplayName(user);
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user.avatarUrl} alt={displayName} />
                          <AvatarFallback>{getInitials(user.firstName, user.lastName)}</AvatarFallback>
                        </Avatar>
                        <div className="font-medium">{displayName}</div>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{user.role.replace("_", " ")}</Badge>
                    </TableCell>
                    <TableCell>
                      <Select defaultValue={user.role} onValueChange={(value: UserRole) => handleRoleChange(user.id, value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="super_admin">Super Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                );
              })}
               {!isLoading && (!users || users.length === 0) && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">No users found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
