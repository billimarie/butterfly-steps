
'use client';

import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import { User, Activity, Target, Footprints, ExternalLink, Mail, Edit3, Share2, Award as AwardIconLucide, Users as TeamIcon, LogOut, PlusCircle, CalendarDays, EggIcon, ShellIcon, SparklesIcon, Layers, Replace } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ALL_BADGES, type BadgeData } from '@/lib/badges';
import type { BadgeId } from '@/lib/badges';
import { leaveTeam } from '@/lib/firebaseService';
import { useState, useEffect, useCallback } from 'react';
import StepSubmissionForm from '@/components/dashboard/StepSubmissionForm';
import { Separator } from '@/components/ui/separator';
import type { UserProfile } from '@/types';
import { CHALLENGE_DURATION_DAYS } from '@/types'; 
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import BadgeDetailModal from '@/components/profile/BadgeDetailModal';

const WormIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M10 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
    <path d="M14 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
    <path d="M6 15a4 4 0 0 0 0-6" />
    <path d="M18 15a4 4 0 0 1 0-6" />
    <path d="M4 17a1 1 0 0 0 2 0" />
    <path d="M20 17a1 1 0 0 1-2 0" />
    <path d="M6 19v-4" />
    <path d="M18 19v-4" />
    <path d="M10 17a1 1 0 0 0 0-2" />
    <path d="M14 17a1 1 0 0 0 0-2" />
  </svg>
);

interface StreakAchievement {
  id: string;
  name: string;
  requiredStreak: number;
  icon: React.ElementType;
  description: string;
}

const STREAK_ACHIEVEMENTS: StreakAchievement[] = [
  { id: 'egg', name: 'Persistent Egg', requiredStreak: 30, icon: EggIcon, description: 'Logged in for 30 consecutive days! Hatching potential!' },
  { id: 'caterpillar', name: 'Curious Caterpillar', requiredStreak: 60, icon: WormIcon, description: '60 day streak! Munching through the days!' },
  { id: 'chrysalis', name: 'Committed Chrysalis', requiredStreak: 90, icon: ShellIcon, description: '90 days of consistency! Transformation is near.' },
  { id: 'butterfly', name: 'Monarch Dedication', requiredStreak: 133, icon: SparklesIcon, description: 'Logged in every day of the challenge until Halloween! True Monarch Spirit!' },
];

interface ProfileDisplayProps {
  profileData: UserProfile;
  isOwnProfile: boolean;
}

export default function ProfileDisplay({ profileData, isOwnProfile }: ProfileDisplayProps) {
  const { user: authUser, fetchUserProfile: fetchAuthUserProfile, setShowStreakModal, setStreakModalContext } = useAuth();
  const { toast } = useToast();
  const [leavingTeam, setLeavingTeam] = useState(false);

  const [isExistingBadgeModalOpen, setIsExistingBadgeModalOpen] = useState(false);
  const [selectedExistingBadge, setSelectedExistingBadge] = useState<BadgeData | null>(null);

  const progressPercentage = profileData.stepGoal ? (profileData.currentSteps / profileData.stepGoal) * 100 : 0;
  const collectedCoinsCount = profileData.chrysalisCoinDates?.length || 0;

  const handleShare = () => {
    if (profileData.inviteLink) {
      navigator.clipboard.writeText(profileData.inviteLink)
        .then(() => {
          toast({ title: "Link Copied!", description: "This user's profile link is copied to clipboard." });
        })
        .catch(err => {
          toast({ title: "Copy Failed", description: "Could not copy link. Please try manually.", variant: "destructive" });
        });
    }
  };

  const handleLeaveTeam = async () => {
    if (!authUser || !profileData.teamId || !isOwnProfile) return;
    setLeavingTeam(true);
    try {
      await leaveTeam(authUser.uid, profileData.teamId, profileData.currentSteps);
      toast({ title: 'Left Team', description: `You have left ${profileData.teamName}.` });
      await fetchAuthUserProfile(authUser.uid);
    } catch (error) {
      toast({ title: 'Error Leaving Team', description: (error as Error).message, variant: "destructive" });
    } finally {
      setLeavingTeam(false);
    }
  };

  const handleExistingBadgeClick = (badge: BadgeData) => {
    if (isOwnProfile) { 
        setSelectedExistingBadge(badge);
        setIsExistingBadgeModalOpen(true);
    }
  };

  const handleChrysalisAvatarClick = () => {
    if (isOwnProfile) {
      setStreakModalContext('profile_avatar_select');
      setShowStreakModal(true);
    }
  };


  const earnedBadgeIds = profileData.badgesEarned || [];
  const earnedBadgesDetails: BadgeData[] = earnedBadgeIds
    .map(id => ALL_BADGES.find(b => b.id === id))
    .filter(b => b !== undefined) as BadgeData[];

  const hasAnyStreakAchievement = STREAK_ACHIEVEMENTS.some(ach => profileData.currentStreak >= ach.requiredStreak);
  const showStreakMilestonesSection = isOwnProfile || (!isOwnProfile && hasAnyStreakAchievement);

  return (
    <>
      <Card className="w-full max-w-2xl mx-auto shadow-xl">
        <CardHeader className="mb-6">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="font-headline text-3xl flex items-center">
                <User className="mr-3 h-8 w-8 text-primary" />
                {profileData.displayName || 'User Profile'}
              </CardTitle>
              {isOwnProfile && profileData.email && (
                <CardDescription className="flex items-center mt-1">
                    <Mail className="mr-2 h-4 w-4 text-muted-foreground" /> {profileData.email}
                </CardDescription>
              )}
            </div>
            {isOwnProfile && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/profile/${profileData.uid}?edit=true`}>
                  <Edit3 className="mr-2 h-4 w-4" /> Edit Profile
                </Link>
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">

          <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/3 space-y-2">
                <h3 className="text-lg font-semibold flex items-center"><Target className="mr-2 h-5 w-5 text-primary" />Step Goal</h3>
                <p className="text-2xl font-bold text-primary">{profileData.stepGoal?.toLocaleString() || 'Not set'} steps</p>
              </div>

              <div className="md:w-2/3 flex-grow space-y-2">
                <h3 className="text-lg font-semibold flex items-center"><Footprints className="mr-2 h-5 w-5 text-primary" />Current Steps</h3>
                <p className="text-2xl font-bold text-accent">{profileData.currentSteps.toLocaleString()} steps</p>
                {profileData.stepGoal && profileData.stepGoal > 0 && (
                  <>
                    <Progress value={progressPercentage} className="w-full h-3 mt-2" />
                    <p className="text-sm text-muted-foreground text-right">{Math.min(100, Math.round(progressPercentage))}% of goal</p>
                  </>
                )}
              </div>
          </div>
          
          <Separator className="my-6" />

          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center"><Layers className="mr-2 h-5 w-5 text-primary" /> Chrysalis Coins</h3>
            <p className="text-sm text-muted-foreground">Log your steps once a day, and collect them all</p>
            <div className="flex items-center space-x-2">
              <ShellIcon className="h-8 w-8 text-primary" data-ai-hint="chrysalis shell gold"/>
              <p className="text-xl">
                Collected: <span className="font-bold text-accent">{collectedCoinsCount}</span> / {CHALLENGE_DURATION_DAYS}
              </p>
            </div>
            {collectedCoinsCount === 0 && isOwnProfile && (
                <p className="text-sm text-muted-foreground">Log in and log your steps daily to collect coins!</p>
            )}
            {collectedCoinsCount > 0 && (
              <div className="flex flex-wrap gap-1 mt-2 items-center">
                {Array.from({ length: Math.min(collectedCoinsCount, 5) }).map((_, i) => (
                  <ShellIcon key={`coin-display-${i}`} className="h-5 w-5 text-yellow-500" data-ai-hint="chrysalis shell gold"/>
                ))}
                {collectedCoinsCount > 5 && <span className="text-sm text-muted-foreground self-end">...and more!</span>}
              </div>
            )}
            {isOwnProfile && (
                 <Button variant="outline" size="sm" onClick={handleChrysalisAvatarClick} className="mt-2">
                    <Replace className="mr-2 h-4 w-4" /> Change Chrysalis Avatar
                </Button>
            )}
          </div>

          <Separator className="my-6" />
          
          {showStreakMilestonesSection && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center"><CalendarDays className="mr-2 h-5 w-5 text-primary" /> Streak Milestones</h3>
              {profileData.currentStreak > 0 ? (
                <p className="text-sm text-muted-foreground">Current login streak: <strong className="text-accent">{profileData.currentStreak} day{profileData.currentStreak === 1 ? '' : 's'}</strong></p>
              ) : (
                isOwnProfile && <p className="text-sm text-muted-foreground">This user hasn't started a login streak yet.</p> 
              )}
              <div className="flex flex-wrap gap-3 justify-center">
                {STREAK_ACHIEVEMENTS.map((achievement) => {
                  const isUnlocked = profileData.currentStreak >= achievement.requiredStreak;
                  const AchievementIconComponent = achievement.icon;
                  return (
                    <TooltipProvider key={achievement.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className={cn(
                            "p-3 bg-muted/30 rounded-lg flex flex-col items-center w-32 text-center shadow-sm hover:shadow-md transition-shadow",
                            isUnlocked ? "opacity-100" : "opacity-50"
                          )}>
                            <AchievementIconComponent className={cn("h-10 w-10 mb-1", isUnlocked ? "text-primary" : "text-muted-foreground")} />
                            <span className={cn("text-xs font-medium", isUnlocked ? "text-foreground" : "text-muted-foreground")}>{achievement.name}</span>
                            {isUnlocked && <span className="text-xs text-green-500 mt-0.5">Unlocked!</span>}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-semibold">{achievement.name}</p>
                          <p className="text-sm text-muted-foreground">{achievement.description}</p>
                          <p className="text-xs text-muted-foreground">Requires: {achievement.requiredStreak} day streak</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </div>
            </div>
          )}

          <Separator className="my-6" />

          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center"><TeamIcon className="mr-2 h-5 w-5 text-primary" /> Team Information</h3>
            {profileData.teamId && profileData.teamName ? (
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="mb-1">{isOwnProfile ? "You are" : "This user is"} a member of: 
                  <Link href={`/teams/${profileData.teamId}`} className="font-semibold text-accent hover:underline ml-1">
                    {profileData.teamName}
                  </Link>
                </p>
                {isOwnProfile && (
                  <Button variant="outline" size="sm" onClick={handleLeaveTeam} disabled={leavingTeam}>
                    <LogOut className="mr-2 h-4 w-4" /> {leavingTeam ? 'Leaving...' : 'Leave Team'}
                  </Button>
                )}
              </div>
            ) : (
              <div className="p-4 bg-muted/50 rounded-lg">
                <p>{isOwnProfile ? "You are" : "This user is"} not currently on a team.</p>
                {isOwnProfile && (
                  <div className="mt-2 space-x-2">
                    <Button size="sm" asChild>
                      <Link href="/teams/create">Create a Team</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/teams">Join a Team</Link>
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          <Separator className="my-6" />
          
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center">
              <AwardIconLucide className="mr-2 h-5 w-5 text-primary" /> Badges Earned ({earnedBadgesDetails.length})
            </h3>
            {earnedBadgesDetails.length > 0 ? (
              <div className="flex flex-wrap gap-3 justify-center">
                {earnedBadgesDetails.map((badge) => {
                  const BadgeIconComponent = badge.icon;
                  const commonBadgeClasses = "p-3 bg-muted/30 rounded-lg flex flex-col items-center w-28 text-center shadow-sm transition-all";
                  const interactiveBadgeClasses = "hover:shadow-md hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer";
                  const nonInteractiveBadgeClasses = "cursor-default";

                  return (
                    <div 
                      key={badge.id}
                      onClick={isOwnProfile ? () => handleExistingBadgeClick(badge) : undefined}
                      className={cn(
                        commonBadgeClasses,
                        isOwnProfile ? interactiveBadgeClasses : nonInteractiveBadgeClasses
                      )}
                      role={isOwnProfile ? "button" : "img"} 
                      tabIndex={isOwnProfile ? 0 : -1}
                      aria-label={isOwnProfile ? `View details for ${badge.name} badge` : badge.name}
                      onKeyDown={isOwnProfile ? (e) => { if (e.key === 'Enter' || e.key === ' ') handleExistingBadgeClick(badge); } : undefined}
                    >
                      <BadgeIconComponent className="h-10 w-10 text-primary mb-1" />
                      <span className="text-xs font-medium">{badge.name}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-center">{isOwnProfile ? "Start logging steps" : "This user has not earned any badges"} to earn badges!</p>
            )}
          </div>
          
          {isOwnProfile && profileData.inviteLink && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold flex items-center"><Share2 className="mr-2 h-5 w-5 text-primary" />Share Profile</h3>
              <div className="flex items-center space-x-2">
                <Input type="text" readOnly value={profileData.inviteLink} className="flex-grow bg-muted/50" />
                <Button onClick={handleShare} variant="outline" size="icon" aria-label="Copy link">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Share this link with friends and family to show this user's progress!</p>
            </div>
          )}

        </CardContent>
      </Card>
      
      {isOwnProfile && (
        <BadgeDetailModal
            isOpen={isExistingBadgeModalOpen}
            onOpenChange={setIsExistingBadgeModalOpen}
            badge={selectedExistingBadge}
        />
      )}
    </>
  );
}

    
