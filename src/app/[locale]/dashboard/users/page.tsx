'use client';

import { useState, useEffect } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, doc, deleteDoc } from 'firebase/firestore';
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
  
  const userDocRef = useMemoFirebase(() => user ? doc(firestore, "users", user.uid) : null, [firestore, user]);
  const { data: currentUserProfile } = useDoc<User>(userDocRef);
  
  const usersCollectionRef = useMemoFirebase(() => collection(firestore, 'users'), [firestore]);
  const { data: usersFromDB, isLoading: usersLoading } = useCollection<User>(usersCollectionRef);

  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    if (!usersLoading) {
        if (usersFromDB && usersFromDB.length > 0) {
            setUsers(usersFromDB);
        } else {
            setUsers(defaultData.users);
        }
    }
  }, [usersFromDB, usersLoading]);

  const handleAddNew = () => {
    setSelectedUser(null);
    setIsEditDialogOpen(true);
  };
  
  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (userId: string) => {
    if (!firestore) return;
    setProcessingId(userId);
    try {
      await deleteDoc(doc(firestore, 'users', userId));
      toast({
        title: t('deleteSuccessTitle'),
        description: t('deleteSuccessDescription'),
      });
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
  
  const isSuperAdmin = currentUserProfile?.role === 'super_admin';

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
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user.avatarUrl} alt={user.name} />
                          <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={roleVariantMap[user.role] || 'outline'}>
                        {t(`roles.${user.role}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                        {user.createdAt?.seconds 
                            ? format(new Date(user.createdAt.seconds * 1000), 'dd/MM/yyyy')
                            : user.createdAt instanceof Date ? format(user.createdAt, 'dd/MM/yyyy') : 'N/A'}
                    </TableCell>
                    {isSuperAdmin && (
                      <TableCell className="text-right">
                        {processingId === user.id ? (
                           <Loader2 className="ml-auto h-5 w-5 animate-spin" />
                        ) : (
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(user)}>
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
                                        <AlertDialogAction onClick={() => handleDelete(user.id)} className="bg-destructive hover:bg-destructive/90">
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
