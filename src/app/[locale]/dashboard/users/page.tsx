'use client';

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { User } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useTranslations } from 'next-intl';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';

export default function UsersPage() {
  const firestore = useFirestore();
  const t = useTranslations('Dashboard.Users');
  
  const usersCollectionRef = useMemoFirebase(
    () => collection(firestore, 'users'),
    [firestore]
  );
  const { data: users, isLoading: usersLoading } = useCollection<User>(usersCollectionRef);

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

  return (
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('tableHeaderUser')}</TableHead>
                <TableHead>{t('tableHeaderRole')}</TableHead>
                <TableHead>{t('tableHeaderJoined')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
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
                        {user.role.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                        {user.createdAt?.seconds 
                            ? format(new Date(user.createdAt.seconds * 1000), 'dd/MM/yyyy')
                            : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    {t('noUsers')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
  );
}
