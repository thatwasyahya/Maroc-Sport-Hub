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
import { doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import type { UserRole } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { getRegions } from '@/lib/maroc-api';
import { MultiSelect } from '@/components/ui/multi-select';
import { sports } from '@/lib/data';


export default function SignupPage() {
  const { toast } = useToast();
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female'>();
  const [birthDate, setBirthDate] = useState<Date>();
  const [jobTitle, setJobTitle] = useState('');
  const [city, setCity] = useState('');
  const [favoriteSports, setFavoriteSports] = useState<string[]>([]);
  const [isSigningUp, setIsSigningUp] = useState(false);
  
  const regions = getRegions();
  const sportOptions = sports.map(s => ({label: s, value: s}));


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
      const [firstName, ...lastName] = fullName.split(' ');
      const newUser = {
        id: user.uid,
        email: user.email,
        name: fullName,
        firstName: firstName || '',
        lastName: lastName.join(' ') || '',
        phoneNumber,
        gender,
        birthDate,
        jobTitle,
        city,
        favoriteSports,
        role: role,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      batch.set(userDocRef, newUser);

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
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Sign Up</CardTitle>
          <CardDescription>
            Enter your information to create an account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="grid gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="full-name">Full Name</Label>
                  <Input id="full-name" placeholder="John Doe" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
            </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="phone-number">Phone Number</Label>
                  <Input id="phone-number" placeholder="0612345678" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select onValueChange={(value: 'Male' | 'Female') => setGender(value)} value={gender}>
                      <SelectTrigger id="gender">
                          <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                  </Select>
                </div>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="birthdate">Birth Date</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                                "w-full justify-start text-left font-normal",
                                !birthDate && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {birthDate ? format(birthDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={birthDate}
                            onSelect={setBirthDate}
                            initialFocus
                            captionLayout="dropdown-buttons"
                            fromYear={1950}
                            toYear={new Date().getFullYear() - 10}
                        />
                    </PopoverContent>
                </Popover>
            </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="job-title">Function/Profession</Label>
                    <Input id="job-title" placeholder="e.g., Student, Coach" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="city">City of Residence</Label>
                    <Input id="city" placeholder="e.g., Casablanca" value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
            </div>
             <div className="grid gap-2">
                 <Label htmlFor="favorite-sports">Favorite Sports</Label>
                 <MultiSelect
                    options={sportOptions}
                    selected={favoriteSports}
                    onChange={setFavoriteSports}
                    placeholder="Select your favorite sports..."
                    className="w-full"
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
