'use client';

import { useState, useEffect } from 'react';
import { useFirestore, useUser, useDoc } from '@/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import type { User } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useTranslations } from 'next-intl';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, Loader2 } from 'lucide-react';
import UserEditDialog from '@/components/dashboard/UserEditDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { defaultData } from '@/lib/data';

export default function UsersPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const t = useTranslations('Dashboard.Users');
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  const userDocRef = doc(firestore, "users", user?.uid || 'placeholder');
  const { data: currentUserProfile } = useDoc<User>(userDocRef);
  
  // Use default data directly, ignoring Firestore for now.
  const [users, setUsers] = useState<User[]>(defaultData.users);
  const [usersLoading, setUsersLoading] = useState(false);

  const handleAddNew = () => {
    setSelectedUser(null);
    setIsEditDialogOpen(true);
  };
  
  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (userId: string) => {
    setProcessingId(userId);
    try {
       // This is a local delete for now as we are using default data.
      setUsers(prev => prev.filter(u => u.id !== userId));
      toast({
        title: t('deleteSuccessTitle'),
        description: t('deleteSuccessDescription'),
      });
       // In a real scenario with a connected DB, you would use:
      // if (!firestore) return;
      // await deleteDoc(doc(firestore, 'users', userId));
      // toast({
      //   title: t('deleteSuccessTitle'),
      //   description: t('deleteSuccessDescription'),
      // });
    } catch (error: any) {
      console.error("Error deleting user: ", error);
      toast({
        variant: "destructive",
        title: t('deleteErrorTitle'),
        description: error.message,
      });
    } finally {
      setProcessingId(null);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return '';
    const names = name.split(' ');
    if (names.length > 1 && names[1]) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name ? name.substring(0, 2).toUpperCase() : "";
  };

  const roleVariantMap: {[key: string]: "default" | "secondary" | "destructive" | "outline"} = {
      super_admin: 'destructive',
      admin: 'default',
      user: 'secondary'
  }
  
  // Find the current user from the default data for permission checks
  const isSuperAdmin = users.find(u => u.email === 'super@admin.com')?.role === 'super_admin';

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t('title')}</CardTitle>
            <CardDescription>{t('description')}</CardDescription>
          </div>
          {isSuperAdmin && (
            <Button onClick={handleAddNew}>
              <PlusCircle className="mr-2 h-4 w-4" />
              {t('addUser')}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('tableHeaderUser')}</TableHead>
                <TableHead>{t('tableHeaderRole')}</TableHead>
                <TableHead>{t('tableHeaderJoined')}</TableHead>
                {isSuperAdmin && <TableHead className="text-right">{t('tableHeaderActions')}</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersLoading ? (
                <TableRow>
                  <TableCell colSpan={isSuperAdmin ? 4 : 3} className="h-24 text-center">
                    {t('loading')}
                  </TableCell>
                </TableRow>
              ) : users && users.length > 0 ? (
                users.map((userItem) => (
                  <TableRow key={userItem.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={userItem.avatarUrl} alt={userItem.name} />
                          <AvatarFallback>{getInitials(userItem.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{userItem.name}</p>
                          <p className="text-sm text-muted-foreground">{userItem.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={roleVariantMap[userItem.role] || 'outline'}>
                        {t(`roles.${userItem.role}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                        {userItem.createdAt?.seconds 
                            ? format(new Date(userItem.createdAt.seconds * 1000), 'dd/MM/yyyy')
                            : userItem.createdAt instanceof Date ? format(userItem.createdAt, 'dd/MM/yyyy') : 'N/A'}
                    </TableCell>
                    {isSuperAdmin && (
                      <TableCell className="text-right">
                        {processingId === userItem.id ? (
                           <Loader2 className="ml-auto h-5 w-5 animate-spin" />
                        ) : (
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(userItem)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                      <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>{t('deleteConfirmTitle')}</AlertDialogTitle>
                                        <AlertDialogDescription>{t('deleteConfirmDescription')}</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(userItem.id)} className="bg-destructive hover:bg-destructive/90">
                                            {t('delete')}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={isSuperAdmin ? 4 : 3} className="h-24 text-center">
                    {t('noUsers')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {isEditDialogOpen && (
        <UserEditDialog 
            open={isEditDialogOpen} 
            onOpenChange={setIsEditDialogOpen} 
            user={selectedUser}
        />
      )}
    </>
  );
}
