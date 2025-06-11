
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getTeam, getTeamMembersProfiles, joinTeam, leaveTeam } from '@/lib/firebaseService';
import type { Team, UserProfile } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Footprints, User as UserIcon, Crown, ShieldCheck, LogIn, LogOut, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import TeamMemberListItem from '@/components/teams/TeamMemberListItem';
import TeamDetailsDisplay from '@/components/teams/TeamDetailsDisplay';


export default function TeamDetailsPage() {
  const params = useParams();
  const teamId = params.teamId as string;
  const { user, userProfile, fetchUserProfile } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    async function loadTeamData() {
      if (!teamId) return;
      setLoading(true);
      try {
        const fetchedTeam = await getTeam(teamId);
        setTeam(fetchedTeam);
        if (fetchedTeam && fetchedTeam.memberUids.length > 0) {
          const fetchedMembers = await getTeamMembersProfiles(fetchedTeam.memberUids);
          setMembers(fetchedMembers.sort((a,b) => b.currentSteps - a.currentSteps)); // Sort by steps desc
        } else {
          setMembers([]);
        }
      } catch (error) {
        console.error("Failed to load team data:", error);
        toast({ title: 'Error', description: 'Could not load team data.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    }
    loadTeamData();
  }, [teamId, toast]);

  const handleJoinTeam = async () => {
    if (!user || !userProfile || !team) return;
    setActionLoading(true);
    try {
      await joinTeam(user.uid, team.id, userProfile.currentSteps);
      toast({ title: 'Joined Team!', description: `You are now a member of ${team.name}.` });
      await fetchUserProfile(user.uid); // Refresh auth context
      // Re-fetch team data to update member list and total steps on this page
      const updatedTeam = await getTeam(team.id);
      setTeam(updatedTeam);
      if (updatedTeam) {
        const updatedMembers = await getTeamMembersProfiles(updatedTeam.memberUids);
        setMembers(updatedMembers.sort((a,b) => b.currentSteps - a.currentSteps));
      }

    } catch (error) {
      toast({ title: 'Error Joining Team', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveTeam = async () => {
    if (!user || !userProfile || !team || userProfile.teamId !== team.id) return;
    setActionLoading(true);
    try {
      await leaveTeam(user.uid, team.id, userProfile.currentSteps);
      toast({ title: 'Left Team', description: `You have left ${team.name}.` });
      await fetchUserProfile(user.uid); // Refresh auth context
       // Re-fetch team data to update member list and total steps on this page
      const updatedTeam = await getTeam(team.id);
      setTeam(updatedTeam);
       if (updatedTeam) {
        const updatedMembers = await getTeamMembersProfiles(updatedTeam.memberUids);
        setMembers(updatedMembers.sort((a,b) => b.currentSteps - a.currentSteps));
      }
    } catch (error) {
      toast({ title: 'Error Leaving Team', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-10 w-1/4" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="container mx-auto py-8 text-center">
        <Card>
            <CardHeader><CardTitle>Team Not Found</CardTitle></CardHeader>
            <CardContent>
                <p>The team you are looking for does not exist or could not be loaded.</p>
                <Button asChild className="mt-4"><Link href="/teams">Back to Teams Hub</Link></Button>
            </CardContent>
        </Card>
      </div>
    );
  }
  
  const isUserMember = userProfile?.teamId === team.id;
  const canJoin = user && userProfile && userProfile.teamId !== team.id; // User is logged in, profile exists, and not already on this team
  const isCreator = team.creatorUid === user?.uid;


  return (
    <TeamDetailsDisplay
        team={team}
        members={members}
        isUserMember={isUserMember}
        canJoin={canJoin}
        isCreator={isCreator}
        onJoinTeam={handleJoinTeam}
        onLeaveTeam={handleLeaveTeam}
        actionLoading={actionLoading}
        isUserLoggedIn={!!user}
    />
  );
}
