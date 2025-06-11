
'use client';

import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import CreateTeamForm from '@/components/teams/CreateTeamForm';
import { Users, LogIn } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';

export default function CreateTeamPage() {
  useAuthRedirect({ requireAuth: true });
  const { user, userProfile } = useAuth();

  if (!user) {
    return (
        <div className="text-center py-10">
            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h1 className="text-2xl font-semibold mb-2">Create a Team</h1>
            <p className="text-muted-foreground mb-4">Please log in to create a new team.</p>
            <Button asChild>
                <Link href="/login"><LogIn className="mr-2 h-4 w-4"/>Login</Link>
            </Button>
        </div>
    );
  }
  
  if (userProfile?.teamId) {
    return (
         <div className="text-center py-10 max-w-lg mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Already on a Team</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground mb-4">
                        You are already a member of team "{userProfile.teamName}". To create a new team, you must first leave your current team from your profile page.
                    </p>
                    <Button asChild variant="outline">
                        <Link href="/profile">Go to Profile</Link>
                    </Button>
                    <Button asChild className="ml-2">
                        <Link href={`/teams/${userProfile.teamId}`}>View Your Team</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
  }


  return (
    <div className="container mx-auto py-8">
      <Card className="w-full max-w-lg mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline text-3xl flex items-center">
            <Users className="mr-3 h-8 w-8 text-primary" />
            Create a New Team
          </CardTitle>
          <CardDescription>
            Give your team a name and start stepping together!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateTeamForm />
        </CardContent>
      </Card>
    </div>
  );
}
