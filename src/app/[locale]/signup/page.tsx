"use client";
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { useAuth, useFirestore } from '@/firebase';
import { doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import type { UserRole } from '@/lib/types';
import { InterceptedLink } from '@/components/intercepted-link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SignupPage() {
  const { toast } = useToast();
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !firestore || isLoading) return;

    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      let role: UserRole = 'user';
      if (email === 'super@admin.com') role = 'super_admin';
      else if (email === 'admin@admin.com') role = 'admin';
      
      const batch = writeBatch(firestore);
      const userDocRef = doc(firestore, 'users', user.uid);
      const [firstName, ...lastName] = fullName.split(' ');

      const newUser = {
        id: user.uid,
        email: user.email,
        name: fullName,
        firstName: firstName || '',
        lastName: lastName.join(' ') || '',
        role: role,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      batch.set(userDocRef, newUser);
      await batch.commit();

      toast({
        title: "Account Created",
        description: "You have been successfully signed up.",
      });
      router.push('/');

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sign Up Failed",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm mx-4">
        <CardHeader className="space-y-1 px-4 sm:px-6">
          <CardTitle className="text-2xl font-headline">Sign Up</CardTitle>
          <CardDescription>
            Create an account to get started.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <form onSubmit={handleSignup} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="full-name">Full Name</Label>
              <Input id="full-name" placeholder="John Doe" required value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={isLoading} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Creating Account...' : 'Create an account'}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm">
            Already have an account?{' '}
            <InterceptedLink href="/login" className="underline">
              Login
            </InterceptedLink>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
