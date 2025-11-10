'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { updateUserAvatar } from '@/firebase/non-blocking-updates';
import { avatars } from '@/lib/avatars';
import { cn } from '@/lib/utils';
import { CheckCircle } from 'lucide-react';

interface AvatarSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AvatarSelectionDialog({ open, onOpenChange }: AvatarSelectionDialogProps) {
  const { user } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSaveAvatar = async () => {
    if (!user || !selectedAvatar) return;

    setIsSubmitting(true);
    try {
      const userDocRef = doc(firestore, 'users', user.uid);
      await updateUserAvatar(userDocRef, selectedAvatar);
      
      toast({
        title: 'Avatar Updated',
        description: 'Your new profile picture has been saved.',
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating avatar:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not update your avatar.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Choose Your Avatar</DialogTitle>
          <DialogDescription>Select a new profile picture from the options below.</DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-96 w-full p-4 border rounded-md">
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-4">
            {avatars.map((avatarUrl) => (
              <button
                key={avatarUrl}
                className="relative aspect-square rounded-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                onClick={() => setSelectedAvatar(avatarUrl)}
              >
                <Image src={avatarUrl} alt="Avatar" fill className="object-cover" />
                {selectedAvatar === avatarUrl && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSaveAvatar} disabled={!selectedAvatar || isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Avatar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}