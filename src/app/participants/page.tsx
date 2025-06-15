
'use client';

import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import ParticipantsList from '@/components/participants/ParticipantsList';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

export default function ParticipantsPage() {
  useAuthRedirect({ requireAuth: true, requireProfileComplete: true });

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-3xl md:text-4xl flex items-center">
            <Users className="mr-3 h-8 w-8 text-primary" />
            Challenge Participants
          </CardTitle>
          <CardDescription>
            See who's stepping up for the Monarchs! Filter and sort to see how everyone is doing.
          </CardDescription>
        </CardHeader>
      </Card>
      <ParticipantsList />
    </div>
  );
}
