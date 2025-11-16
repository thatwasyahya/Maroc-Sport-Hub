'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, MailOpen, Trash2, Eye } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  status: 'read' | 'unread';
  createdAt: { seconds: number };
}

export default function MessagesPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);

  const messagesQuery = useMemoFirebase(
    () => {
      if (!firestore) return null;
      try {
        return query(collection(firestore, 'contactMessages'), orderBy('createdAt', 'desc'));
      } catch (error) {
        console.error('Error creating messages query:', error);
        return null;
      }
    },
    [firestore]
  );

  const { data: messages, isLoading, error } = useCollection<ContactMessage>(messagesQuery);

  // Log any collection errors
  if (error) {
    console.error('Messages collection error:', error);
  }

  const handleMarkAsRead = async (messageId: string) => {
    if (!firestore) return;
    try {
      const messageRef = doc(firestore, 'contactMessages', messageId);
      await updateDoc(messageRef, { status: 'read' });
      toast({
        title: 'Message marqué comme lu',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de mettre à jour le message',
      });
    }
  };

  const handleDelete = async () => {
    if (!firestore || !messageToDelete) return;
    try {
      await deleteDoc(doc(firestore, 'contactMessages', messageToDelete));
      toast({
        title: 'Message supprimé',
      });
      setMessageToDelete(null);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de supprimer le message',
      });
    }
  };

  const handleViewMessage = (message: ContactMessage) => {
    setSelectedMessage(message);
    if (message.status === 'unread') {
      handleMarkAsRead(message.id);
    }
  };

  const unreadCount = messages?.filter(m => m.status === 'unread').length || 0;

  // Show error state if there's a Firestore error
  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Erreur</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">
              Impossible de charger les messages. Vérifiez vos permissions.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {error.message}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Mail className="h-8 w-8"/>
              Messages de contact
            </h1>
            <p className="text-muted-foreground">
              Gérez les messages reçus via le formulaire de contact
            </p>
          </div>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-lg px-4 py-2">
              {unreadCount} non lu{unreadCount > 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Liste des messages</CardTitle>
            <CardDescription>
              {messages?.length || 0} message{messages?.length !== 1 ? 's' : ''} au total
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Statut</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead className="hidden sm:table-cell">Email</TableHead>
                    <TableHead className="hidden md:table-cell">Message</TableHead>
                    <TableHead className="hidden lg:table-cell">Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        Chargement...
                      </TableCell>
                    </TableRow>
                  ) : messages && messages.length > 0 ? (
                    messages.map((message) => (
                      <TableRow key={message.id} className={message.status === 'unread' ? 'bg-muted/50' : ''}>
                        <TableCell>
                          {message.status === 'unread' ? (
                            <Mail className="h-4 w-4 text-primary" />
                          ) : (
                            <MailOpen className="h-4 w-4 text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{message.name}</TableCell>
                        <TableCell className="hidden sm:table-cell">{message.email}</TableCell>
                        <TableCell className="hidden md:table-cell max-w-xs truncate">
                          {message.message}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {message.createdAt?.seconds
                            ? format(new Date(message.createdAt.seconds * 1000), 'dd/MM/yyyy HH:mm')
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewMessage(message)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setMessageToDelete(message.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        Aucun message reçu
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Message Dialog */}
      <Dialog open={!!selectedMessage} onOpenChange={(open) => !open && setSelectedMessage(null)}>
        <DialogContent className="w-[95vw] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Message de {selectedMessage?.name}</DialogTitle>
            <DialogDescription>{selectedMessage?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Reçu le{' '}
                {selectedMessage?.createdAt?.seconds
                  ? format(new Date(selectedMessage.createdAt.seconds * 1000), 'dd/MM/yyyy à HH:mm')
                  : '-'}
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="whitespace-pre-wrap">{selectedMessage?.message}</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectedMessage(null)}>
                Fermer
              </Button>
              <Button
                variant="default"
                onClick={() => {
                  window.location.href = `mailto:${selectedMessage?.email}?subject=Re: Votre message`;
                }}
              >
                <Mail className="mr-2 h-4 w-4" />
                Répondre par email
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!messageToDelete} onOpenChange={(open) => !open && setMessageToDelete(null)}>
        <AlertDialogContent className="w-[95vw] sm:w-full max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le message ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le message sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
