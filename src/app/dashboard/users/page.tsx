import { users } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function ManageUsersPage() {
    const getInitials = (name: string) => {
        const names = name.split(' ');
        if (names.length > 1 && names[1]) {
          return `${names[0][0]}${names[names.length - 1][0]}`;
        }
        return names[0] ? names[0].substring(0, 2) : '';
    };

    const getDisplayName = (user: { firstName?: string; lastName?: string; email: string; name?: string }) => {
        if (user.firstName && user.lastName) {
            return `${user.firstName} ${user.lastName}`;
        }
        return user.name || user.email;
    }

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
              {users.map((user) => {
                const displayName = getDisplayName(user);
                return (
                    <TableRow key={user.id}>
                    <TableCell>
                        <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                                <AvatarImage src={user.avatarUrl} alt={displayName} />
                                <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                            </Avatar>
                            <div className="font-medium">{displayName}</div>
                        </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                        <Badge variant="outline" className="capitalize">{user.role.replace("_", " ")}</Badge>
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-2">
                        <Select defaultValue={user.role}>
                            <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="super_admin">Super Admin</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button size="sm">Save</Button>
                        </div>
                    </TableCell>
                    </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
