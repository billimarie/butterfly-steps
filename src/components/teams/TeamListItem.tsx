
'use client';

import type { Team } from '@/types';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Footprints, ArrowRight, UserCircle, PlusCircle } from 'lucide-react'; 

interface TeamListItemProps {
  team: Team;
  currentTeamId?: string | null;
  creatorDisplayName?: string | null;
  onJoinTeam: (teamId: string) => Promise<void>;
  isJoining: boolean;
  isUserLoggedIn: boolean;
}

export default function TeamListItem({ 
  team, 
  currentTeamId, 
  creatorDisplayName, 
  onJoinTeam,
  isJoining,
  isUserLoggedIn
}: TeamListItemProps) {
  const isCurrentUserMember = team.id === currentTeamId;
  const canUserJoinThisTeam = isUserLoggedIn && !currentTeamId && !isCurrentUserMember;

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col">
      <CardHeader>
        <CardTitle className="font-headline text-xl flex items-center">
          <Users className="mr-2 h-5 w-5 text-primary" />
          {team.name}
        </CardTitle>
        <CardDescription className="flex items-center text-xs">
          <UserCircle className="mr-1 h-3 w-3 text-muted-foreground" />
          Led by: {creatorDisplayName || `User ID ${team.creatorUid.substring(0,6)}...`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-1">
        <div className="flex items-center text-sm text-muted-foreground">
          <Users className="mr-2 h-4 w-4" />
          <span>{team.memberUids.length} Member{team.memberUids.length === 1 ? '' : 's'}</span>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <Footprints className="mr-2 h-4 w-4" />
          <span>Total: {team.totalSteps.toLocaleString()} steps</span>
        </div>
      </CardContent>
      <CardFooter className="border-t pt-4 flex flex-col gap-2">
        <Button asChild size="sm" className="w-full">
          <Link href={`/teams/${team.id}`}>
            View Team <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        {canUserJoinThisTeam && (
          <Button 
            size="sm" 
            variant="outline" 
            className="w-full"
            onClick={() => onJoinTeam(team.id)}
            disabled={isJoining}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            {isJoining ? 'Joining...' : 'Join Team'}
          </Button>
        )}
        {isCurrentUserMember && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full self-center mt-1">Your Team</span>
        )}
      </CardFooter>
    </Card>
  );
}
