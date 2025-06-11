
'use client';

import SignupForm from '@/components/auth/SignupForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import Logo from '@/components/ui/Logo';
import { useSearchParams } from 'next/navigation';

export default function SignupPage() {
  useAuthRedirect({ redirectIfAuthenticated: '/' });
  const searchParams = useSearchParams();
  const invitedTeamId = searchParams.get('teamInvite');

  return (
    <div className="flex min-h-[calc(100vh-15rem)] items-center justify-center py-12">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
           <div className="mx-auto mb-4">
            <Logo />
          </div>
          <CardTitle className="font-headline text-3xl">Join the Migration!</CardTitle>
          <CardDescription>Create your Monarch Miles account to start tracking your steps.</CardDescription>
        </CardHeader>
        <CardContent>
          <SignupForm invitedTeamId={invitedTeamId} />
        </CardContent>
      </Card>
    </div>
  );
}
