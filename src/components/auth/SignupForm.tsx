
'use client';

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { createUserWithEmailAndPassword, type AuthError } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { createUserProfile } from '@/lib/firebaseService';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, UserPlus, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';


const signupSchema = z.object({
  displayName: z.string().min(2, { message: 'Display name must be at least 2 characters' }).max(50),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type SignupFormInputs = z.infer<typeof signupSchema>;

// invitedTeamId prop removed
export default function SignupForm() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { fetchUserProfile } = useAuth();

  const { register, handleSubmit, formState: { errors } } = useForm<SignupFormInputs>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit: SubmitHandler<SignupFormInputs> = async (data) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const firebaseUser = userCredential.user;
      
      await createUserProfile(firebaseUser, { displayName: data.displayName });
      
      toast({ title: 'Account Created!', description: "Welcome to Monarch Miles! Let's set up your profile." });
      
      // Redirect URL no longer appends invitedTeamId
      const profileRedirectUrl = '/profile';
      router.push(profileRedirectUrl);

    } catch (error) {
      const authError = error as AuthError;
      console.error('Signup error:', authError);
      toast({
        title: 'Signup Failed',
        description: authError.message || 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="displayName">Display Name</Label>
         <div className="relative">
          <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input id="displayName" type="text" placeholder="Your Name" {...register('displayName')} className="pl-10" />
        </div>
        {errors.displayName && <p className="text-sm text-destructive">{errors.displayName.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input id="email" type="email" placeholder="you@example.com" {...register('email')} className="pl-10" />
        </div>
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input id="password" type="password" placeholder="••••••••" {...register('password')} className="pl-10" />
        </div>
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Creating Account...' : (<><UserPlus className="mr-2 h-5 w-5" /> Sign Up</>)}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
