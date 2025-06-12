
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { getAllTeams, getTeamMembersProfiles, joinTeam } from '@/lib/firebaseService'; 
import type { Team, UserProfile } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Users, LogIn } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import TeamListItem from '@/components/teams/TeamListItem';
import JoinTeamForm from '@/components/teams/JoinTeamForm';

export default function TeamsPage() {
  const { user, userProfile, fetchUserProfile } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [creatorProfiles, setCreatorProfiles] = useState<Record<string, UserProfile | undefined>>({});
  const [loading, setLoading] = useState(true);
  const [showJoinForm, setShowJoinForm] = useState(false); 
  const [joiningTeamId, setJoiningTeamId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    async function loadTeamsAndCreators() {
      setLoading(true);
      try {
        const fetchedTeams = await getAllTeams();
        setTeams(fetchedTeams);

        if (fetchedTeams.length > 0) {
          const creatorUids = Array.from(new Set(fetchedTeams.map(team => team.creatorUid)));
          if (creatorUids.length > 0) {
            const profiles = await getTeamMembersProfiles(creatorUids);
            const profilesMap: Record<string, UserProfile | undefined> = {};
            profiles.forEach(profile => {
              profilesMap[profile.uid] = profile;
            });
            setCreatorProfiles(profilesMap);
          }
        }
      } catch (error) {
        console.error("Failed to fetch teams or creators:", error);
        toast({ title: 'Error', description: 'Could not load teams data.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    }
    if (user) { 
        loadTeamsAndCreators();
    } else {
        setLoading(false); 
    }
  }, [user, toast]);

  const handleJoinTeamFromList = async (teamId: string) => {
    if (!user || !userProfile || userProfile.teamId) {
      toast({ title: 'Cannot Join Team', description: userProfile?.teamId ? 'You are already on a team.' : 'Please log in to join a team.', variant: 'destructive' });
      return;
    }
    setActionLoading(true);
    setJoiningTeamId(teamId);
    try {
      const result = await joinTeam(user.uid, teamId, userProfile.currentSteps);
      if (result) {
        toast({ title: 'Joined Team!', description: `Successfully joined team "${result.teamName}".` });
        await fetchUserProfile(user.uid);
        // Refresh teams list to reflect new member counts/team sorting potentially
        const fetchedTeams = await getAllTeams();
        setTeams(fetchedTeams);
        router.push(`/teams/${result.teamId}`);
      } else {
        toast({ title: 'Failed to Join', description: 'Could not join the team. Please verify the Team ID.', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Join Failed', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setActionLoading(false);
      setJoiningTeamId(null);
    }
  };


  if (!user) {
     return (
        <div className="text-center py-10">
            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h1 className="text-2xl font-semibold mb-2">Access Teams</h1>
            <p className="text-muted-foreground mb-4">Please log in to view and manage teams.</p>
            <Button asChild>
                <Link href="/login"><LogIn className="mr-2 h-4 w-4"/>Login</Link>
            </Button>
        </div>
    );
  }


  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-3xl flex items-center">
            <Users className="mr-3 h-8 w-8 text-primary" /> Team Hub
          </CardTitle>
          <CardDescription>
            Join an existing team or create your own to track progress together!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!userProfile?.teamId ? (
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild className="flex-1">
                <Link href="/teams/create">
                  <PlusCircle className="mr-2 h-5 w-5" /> Create New Team
                </Link>
              </Button>
              
              {!showJoinForm ? (
                <Button onClick={() => setShowJoinForm(true)} className="flex-1">
                  <LogIn className="mr-2 h-4 w-4" /> Join via Team ID
                </Button>
              ) : (
                <div className="flex-1 p-4 border rounded-lg bg-card">
                  <h3 className="text-xl font-semibold mb-3">Enter Team ID to Join</h3>
                  <JoinTeamForm
                    onTeamJoined={async () => {
                        await fetchUserProfile(user.uid); 
                        const fetchedTeams = await getAllTeams(); // Refresh list
                        setTeams(fetchedTeams);
                        setShowJoinForm(false); 
                    }}
                  />
                  <Button variant="outline" onClick={() => setShowJoinForm(false)} className="mt-2 w-full">
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 border rounded-lg bg-accent/20 text-center">
              <p className="text-lg">
                You are currently part of team: <strong className="text-accent-foreground">{userProfile.teamName}</strong>
              </p>
              <Button asChild variant="outline" size="sm" className="mt-1">
                <Link href={`/teams/${userProfile.teamId}`}>View Your Team</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="text-2xl font-semibold mb-4 font-headline">All Teams</h2>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-lg" />)}
          </div>
        ) : teams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => {
              const creator = creatorProfiles[team.creatorUid];
              return (
                <TeamListItem 
                  key={team.id} 
                  team={team} 
                  currentTeamId={userProfile?.teamId} 
                  creatorDisplayName={user ? (creator?.displayName || `User ${team.creatorUid.substring(0,6)}...`) : 'N/A'}
                  onJoinTeam={handleJoinTeamFromList}
                  isJoining={joiningTeamId === team.id && actionLoading}
                  isUserLoggedIn={!!user}
                />
              );
            })}
          </div>
        ) : (
          <p className="text-muted-foreground">No teams found. Why not create the first one?</p>
        )}
      </div>
    </div>
  );
}
