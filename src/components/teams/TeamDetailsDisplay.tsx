
'use client';

import type { Team, UserProfile } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Footprints, Crown as CreatorCrownIcon, LogIn, LogOut, PlusCircle, Share2 } from 'lucide-react'; // Renamed Crown to avoid conflict if needed
import TeamMemberListItem from '@/components/teams/TeamMemberListItem';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';


interface TeamDetailsDisplayProps {
    team: Team;
    members: UserProfile[]; // Assumed to be sorted by steps descending
    isUserMember: boolean;
    canJoin: boolean;
    isCreator: boolean; // Is the current logged-in user the creator of this team
    onJoinTeam: () => Promise<void>;
    onLeaveTeam: () => Promise<void>;
    actionLoading: boolean;
    isUserLoggedIn: boolean;
}

export default function TeamDetailsDisplay({
    team,
    members,
    isUserMember,
    canJoin,
    isCreator: isViewingUserCreator, // Renamed to avoid confusion with member.isCreator
    onJoinTeam,
    onLeaveTeam,
    actionLoading,
    isUserLoggedIn,
}: TeamDetailsDisplayProps) {
  const { toast } = useToast();
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);


  const handleInvite = () => {
    if (!origin) {
        toast({ title: 'Error', description: 'Could not determine app URL.', variant: 'destructive'});
        return;
    }
    const inviteUrl = `${origin}/signup?teamInvite=${team.id}`;
    navigator.clipboard.writeText(inviteUrl)
      .then(() => {
        toast({ title: "Invite Link Copied!", description: "Share this link with new members to join your team." });
      })
      .catch(err => {
        toast({ title: "Copy Failed", description: "Could not copy invite link.", variant: "destructive" });
      });
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-xl">
        <CardHeader className="border-b">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="font-headline text-3xl md:text-4xl flex items-center">
                <Users className="mr-3 h-8 w-8 text-primary" />
                {team.name}
              </CardTitle>
              <CardDescription className="mt-1">
                Total Steps: <strong className="text-accent">{team.totalSteps.toLocaleString()}</strong> | Members: {team.memberUids.length}
              </CardDescription>
            </div>
            {isUserLoggedIn ? (
                <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                    {isUserMember && (
                        <Button variant="outline" size="sm" onClick={handleInvite} className="w-full sm:w-auto">
                            <Share2 className="mr-2 h-4 w-4" /> Invite Teammate
                        </Button>
                    )}
                    {isUserMember ? (
                        <Button variant="outline" onClick={onLeaveTeam} disabled={actionLoading} className="w-full sm:w-auto">
                        <LogOut className="mr-2 h-4 w-4" /> {actionLoading ? 'Leaving...' : 'Leave Team'}
                        </Button>
                    ) : canJoin ? (
                        <Button onClick={onJoinTeam} disabled={actionLoading} className="w-full sm:w-auto">
                        <PlusCircle className="mr-2 h-4 w-4" /> {actionLoading ? 'Joining...' : 'Join Team'}
                        </Button>
                    ) : null}
                </div>
            ) : (
                <Button asChild><Link href="/login"><LogIn className="mr-2 h-4 w-4"/> Login to Join</Link></Button>
            )}
          </div>
           {isViewingUserCreator && ( // Use the renamed prop here
            <div className="mt-2 text-sm text-yellow-600 flex items-center">
              <CreatorCrownIcon className="mr-1 h-4 w-4" /> You are the creator of this team.
            </div>
          )}
        </CardHeader>
        <CardContent className="pt-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <Users className="mr-2 h-5 w-5 text-primary" /> Team Members ({members.length})
          </h3>
          {members.length > 0 ? (
            <ul className="space-y-3">
              {members.map((member, index) => (
                <TeamMemberListItem 
                  key={member.uid} 
                  member={member} 
                  isCreator={member.uid === team.creatorUid} 
                  isTopStepper={index === 0} // Top member in the sorted list
                />
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">This team has no members yet.</p>
          )}
        </CardContent>
      </Card>
      <div className="text-center mt-6">
        <Button variant="outline" asChild>
            <Link href="/teams">Back to Teams Hub</Link>
        </Button>
      </div>
    </div>
  );
}
