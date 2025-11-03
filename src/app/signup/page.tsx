"use client";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useFirestore } from '@/firebase';
import { doc, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import type { UserRole } from '@/lib/types';

export default function SignupPage() {
  const { toast } = useToast();
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !firestore || isSigningUp) return;

    setIsSigningUp(true);

    try {
      // 1. Create the user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Determine the user's role
      let role: UserRole = 'user';
      if (email === 'super@admin.com') {
        role = 'super_admin';
      } else if (email === 'admin@admin.com') {
        role = 'admin';
      }
      
      // 3. Use a batch write to create user profile and role document atomically
      const batch = writeBatch(firestore);

      // - Create the user document in the `users` collection
      const userDocRef = doc(firestore, 'users', user.uid);
      const newUser = {
        id: user.uid,
        email: user.email,
        firstName: fullName.split(' ')[0] || '',
        lastName: fullName.split(' ').slice(1).join(' ') || '',
        role: role,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      batch.set(userDocRef, newUser);

      // - Create the role document in the corresponding `roles_*` collection
      if (role === 'super_admin') {
        const superAdminRoleDoc = doc(firestore, 'roles_super_admin', user.uid);
        batch.set(superAdminRoleDoc, { createdAt: serverTimestamp() });
      } else if (role === 'admin') {
        const adminRoleDoc = doc(firestore, 'roles_admin', user.uid);
        batch.set(adminRoleDoc, { createdAt: serverTimestamp() });
      }

      // 4. Commit the batch. This is an atomic operation.
      // We explicitly await this to ensure all data is written before proceeding.
      await batch.commit();

      // 5. Show success and redirect
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
      setIsSigningUp(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Sign Up</CardTitle>
          <CardDescription>
            Enter your information to create an account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="full-name">Full Name</Label>
              <Input id="full-name" placeholder="John Doe" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={isSigningUp}>
              {isSigningUp ? 'Creating Account...' : 'Create an account'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link href="/login" className="underline">
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
