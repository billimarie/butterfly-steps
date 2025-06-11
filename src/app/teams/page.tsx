
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { getAllTeams, getTeamMembersProfiles } from '@/lib/firebaseService'; // Updated import
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
  const [creatorProfiles, setCreatorProfiles] = useState<Record<string, UserProfile | undefined>>({});
  const [loading, setLoading] = useState(true);
  const [showJoinForm, setShowJoinForm] = useState(false); // State to toggle join form
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    async function loadTeamsAndCreators() {
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
        console.error("Failed to fetch teams or creators:", error);
        toast({ title: 'Error', description: 'Could not load teams data.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    }
    if (user) { 
        loadTeamsAndCreators();
    if (user) { 
        loadTeamsAndCreators();
    } else {
        setLoading(false); 
        setLoading(false); 
    }
  }, [user, toast]);

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
                  <LogIn className="mr-2 h-4 w-4" /> Join an Existing Team
                </Button>
              ) : (
                <div className="flex-1 p-4 border rounded-lg bg-card">
                  <h3 className="text-xl font-semibold mb-3">Enter Team ID to Join</h3>
                  <JoinTeamForm
                    onTeamJoined={async () => {
                        await fetchUserProfile(user.uid); 
                        router.refresh(); 
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
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 rounded-lg" />)}
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
                  creatorDisplayName={creator?.displayName || null}
                />
              );
            })}
            {teams.map((team) => {
              const creator = creatorProfiles[team.creatorUid];
              return (
                <TeamListItem 
                  key={team.id} 
                  team={team} 
                  currentTeamId={userProfile?.teamId} 
                  creatorDisplayName={creator?.displayName || null}
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
