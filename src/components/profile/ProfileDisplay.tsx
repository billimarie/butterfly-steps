
'use client';

import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import { User, Activity, Target, Footprints, ExternalLink, Mail, Edit3, Share2, Award as AwardIcon, Users as TeamIcon, LogOut, PlusCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ALL_BADGES, type BadgeData } from '@/lib/badges';
import type { BadgeId } from '@/lib/badges';
import { leaveTeam, getUserDailySteps } from '@/lib/firebaseService';
import { useState, useEffect, useCallback } from 'react';
import StepSubmissionForm from '@/components/dashboard/StepSubmissionForm';
import { Separator } from '@/components/ui/separator';
import DailyStepChart from '@/components/profile/DailyStepChart';
import type { DailyStep } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';


export default function ProfileDisplay() {
  const { user, userProfile, fetchUserProfile } = useAuth();
  const { toast } = useToast();
  const [leavingTeam, setLeavingTeam] = useState(false);
  const [dailyStepsData, setDailyStepsData] = useState<DailyStep[]>([]);
  const [isLoadingChart, setIsLoadingChart] = useState(true);

  if (!userProfile) {
    return (
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>Profile Not Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p>User profile could not be loaded. Please try again or contact support.</p>
        </CardContent>
      </Card>
    );
  }

  const progressPercentage = userProfile.stepGoal ? (userProfile.currentSteps / userProfile.stepGoal) * 100 : 0;

  const handleShare = () => {
    if (userProfile.inviteLink) {
      navigator.clipboard.writeText(userProfile.inviteLink)
        .then(() => {
          toast({ title: "Link Copied!", description: "Your profile link is copied to clipboard." });
        })
        .catch(err => {
          toast({ title: "Copy Failed", description: "Could not copy link. Please try manually.", variant: "destructive" });
        });
    }
  };

  const handleLeaveTeam = async () => {
    if (!user || !userProfile.teamId) return;
    setLeavingTeam(true);
    try {
      await leaveTeam(user.uid, userProfile.teamId, userProfile.currentSteps);
      toast({ title: 'Left Team', description: `You have left ${userProfile.teamName}.` });
      await fetchUserProfile(user.uid); 
    } catch (error) {
      toast({ title: 'Error Leaving Team', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setLeavingTeam(false);
    }
  };

  const fetchChartData = useCallback(async () => {
    if (user) {
      setIsLoadingChart(true);
      try {
        const data = await getUserDailySteps(user.uid, 30); // Fetch last 30 days
        setDailyStepsData(data);
      } catch (error) {
        console.error("Failed to fetch daily steps data:", error);
        toast({ title: 'Chart Error', description: 'Could not load daily step data.', variant: 'destructive' });
      } finally {
        setIsLoadingChart(false);
      }
    }
  }, [user, toast]);

  useEffect(() => {
    fetchChartData();
  }, [fetchChartData]);

  const handleStepSubmit = async () => {
    if (user) {
      await fetchUserProfile(user.uid); // Refresh profile to update total steps
      await fetchChartData(); // Refresh chart data to include new submission
    }
  };

  const earnedBadgeIds = userProfile.badgesEarned || [];
  const earnedBadgesDetails: BadgeData[] = earnedBadgeIds
    .map(id => ALL_BADGES.find(b => b.id === id))
    .filter(b => b !== undefined) as BadgeData[];

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="font-headline text-3xl flex items-center">
              <User className="mr-3 h-8 w-8 text-primary" />
              {userProfile.displayName || 'Your Profile'}
            </CardTitle>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/profile?edit=true">
              <Edit3 className="mr-2 h-4 w-4" /> Edit Profile
            </Link>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">

        {/* Step Goal and Current Steps side-by-side */}
        <div className="flex flex-col md:flex-row gap-6">
            {/* Step Goal Section */}
            <div className="md:w-1/3 space-y-2">
              <h3 className="text-lg font-semibold flex items-center"><Target className="mr-2 h-5 w-5 text-primary" />Step Goal</h3>
              <p className="text-2xl font-bold text-primary">{userProfile.stepGoal?.toLocaleString() || 'Not set'} steps</p>
            </div>

            {/* Current Steps Section */}
            <div className="md:w-2/3 flex-grow space-y-2">
              <h3 className="text-lg font-semibold flex items-center"><Footprints className="mr-2 h-5 w-5 text-primary" />Current Steps</h3>
              <p className="text-2xl font-bold text-accent">{userProfile.currentSteps.toLocaleString()} steps</p>
              {userProfile.stepGoal && userProfile.stepGoal > 0 && (
                <>
                  <Progress value={progressPercentage} className="w-full h-3 mt-2" />
                  <p className="text-sm text-muted-foreground text-right">{Math.min(100, Math.round(progressPercentage))}% of your goal</p>
                </>
              )}
            </div>
        </div>

        <div>
          <StepSubmissionForm onStepSubmit={handleStepSubmit} />
        </div>

        <Separator className="my-6" />

        <div>
          <DailyStepChart dailyStepsData={dailyStepsData} isLoading={isLoadingChart} />
        </div>

        <Separator className="my-6" />

        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center"><TeamIcon className="mr-2 h-5 w-5 text-primary" /> Team Information</h3>
          {userProfile.teamId && userProfile.teamName ? (
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="mb-1">You are a member of: 
                <Link href={`/teams/${userProfile.teamId}`} className="font-semibold text-accent hover:underline ml-1">
                  {userProfile.teamName}
                </Link>
              </p>
              <Button variant="outline" size="sm" onClick={handleLeaveTeam} disabled={leavingTeam}>
                <LogOut className="mr-2 h-4 w-4" /> {leavingTeam ? 'Leaving...' : 'Leave Team'}
              </Button>
            </div>
          ) : (
            <div className="p-4 bg-muted/50 rounded-lg">
              <p>You are not currently on a team.</p>
              <div className="mt-2 space-x-2">
                <Button size="sm" asChild>
                  <Link href="/teams/create">Create a Team</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/teams">Join a Team</Link>
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold flex items-center">
            <AwardIcon className="mr-2 h-5 w-5 text-primary" /> Badges Earned ({earnedBadgesDetails.length})
          </h3>
          {earnedBadgesDetails.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {earnedBadgesDetails.map((badge) => {
                const BadgeIconComponent = badge.icon;
                return (
                  <TooltipProvider key={badge.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="p-3 bg-muted/70 rounded-lg flex flex-col items-center w-28 text-center shadow-sm hover:shadow-md transition-shadow">
                          <BadgeIconComponent className="h-10 w-10 text-primary mb-1" />
                          <span className="text-xs font-medium">{badge.name}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-semibold">{badge.name}</p>
                        <p className="text-sm text-muted-foreground">{badge.description}</p>
                        <p className="text-xs text-muted-foreground">Milestone: {badge.milestone.toLocaleString()} steps</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground">Start logging steps to earn badges!</p>
          )}
        </div>
        
        {userProfile.inviteLink && (
          <div className="space-y-2">
            <h3 className="text-lg font-semibold flex items-center"><Share2 className="mr-2 h-5 w-5 text-primary" />Share Your Progress</h3>
            <div className="flex items-center space-x-2">
              <Input type="text" readOnly value={userProfile.inviteLink} className="flex-grow bg-muted/50" />
              <Button onClick={handleShare} variant="outline" size="icon" aria-label="Copy link">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Share this link with friends and family to show your progress!</p>
          </div>
        )}

      </CardContent>
      <CardFooter className="flex justify-end">
        <Button asChild>
          <Link href="/invite">
             Generate Sponsorship Invite
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
