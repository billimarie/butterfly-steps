
'use client';

import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import { User, Activity, Target, Footprints, ExternalLink, Mail, Edit3, Share2, Award as AwardIconLucide, Users as TeamIcon, LogOut, PlusCircle, CalendarDays, Layers, Replace, Palette, Gift, Swords } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ALL_BADGES, type BadgeData } from '@/lib/badges';
import type { BadgeId } from '@/lib/badges';
import { leaveTeam, getTodaysDateClientLocal, getChallengeDayNumberFromDateString, getChallengeDateStringByDayNumber, getUserDailySteps } from '@/lib/firebaseService';
import { useState, useEffect, useCallback } from 'react';
import StepSubmissionForm from '@/components/dashboard/StepSubmissionForm';
import { Separator } from '@/components/ui/separator';
import type { UserProfile, ChrysalisVariantData, DailyStep } from '@/types';
import { CHALLENGE_DURATION_DAYS, CHRYSALIS_AVATAR_IDENTIFIER } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import BadgeDetailModal from '@/components/profile/BadgeDetailModal';
import { getChrysalisVariantByDay, getChrysalisVariantById } from '@/lib/chrysalisVariants';
import CoinThemeActivationModal from '@/components/chrysalis/CoinThemeActivationModal'; 
import DailyStepChart from '@/components/profile/DailyStepChart';
import ChallengeDefinitionModal from '@/components/challenges/ChallengeDefinitionModal'; 
import { Shell as ShellIconLucide } from 'lucide-react';


interface ProfileDisplayProps {
  profileData: UserProfile;
  isOwnProfile: boolean;
}

export default function ProfileDisplay({ profileData, isOwnProfile }: ProfileDisplayProps) {
  const { user: authUser, fetchUserProfile: fetchAuthUserProfile, setShowChrysalisJourneyModal, setChrysalisJourneyModalContext, activateThemeFromCollectedCoin } = useAuth(); // Renamed
  const { toast } = useToast();
  const [leavingTeam, setLeavingTeam] = useState(false);

  const [isExistingBadgeModalOpen, setIsExistingBadgeModalOpen] = useState(false);
  const [selectedExistingBadge, setSelectedExistingBadge] = useState<BadgeData | null>(null);

  const [isCoinDetailModalOpen, setIsCoinDetailModalOpen] = useState(false);
  const [selectedCoinForModal, setSelectedCoinForModal] = useState<ChrysalisVariantData | null>(null);

  const [dailyStepsData, setDailyStepsData] = useState<DailyStep[]>([]);
  const [isLoadingChart, setIsLoadingChart] = useState(true);

  const [showChallengeModal, setShowChallengeModal] = useState(false); 


  const progressPercentage = profileData.stepGoal ? (profileData.currentSteps / profileData.stepGoal) * 100 : 0;
  const collectedCoinsCount = profileData.chrysalisCoinDates?.length || 0;

  useEffect(() => {
    const fetchChartData = async () => {
      if (isOwnProfile && profileData.uid) {
        setIsLoadingChart(true);
        try {
          const data = await getUserDailySteps(profileData.uid, 30);
          setDailyStepsData(data);
        } catch (error) {
          console.error("Failed to fetch daily steps data for chart:", error);
          setDailyStepsData([]);
        } finally {
          setIsLoadingChart(false);
        }
      } else {
        setDailyStepsData([]); 
        setIsLoadingChart(false);
      }
    };
    if (isOwnProfile) {
        fetchChartData();
    }
  }, [profileData.uid, isOwnProfile, profileData.currentSteps]);


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

  const handleExistingBadgeClick = (badge: BadgeData) => {
    setSelectedExistingBadge(badge);
    setIsExistingBadgeModalOpen(true);
  };

  const handleChrysalisAvatarClick = () => {
    if (isOwnProfile) {
      setChrysalisJourneyModalContext('profile_avatar_select'); // Renamed
      setShowChrysalisJourneyModal(true); // Renamed
    }
  };

  const handleCoinGalleryItemClick = (variant: ChrysalisVariantData, isMissedAndPastCoin: boolean) => {
    if (isMissedAndPastCoin && isOwnProfile) {
        return; 
    }
    if (isOwnProfile && !isMissedAndPastCoin) { 
        setSelectedCoinForModal(variant);
        setIsCoinDetailModalOpen(true);
    }
  };


  const earnedBadgeIds = profileData.badgesEarned || [];
  const earnedBadgesDetails: BadgeData[] = earnedBadgeIds
    .map(id => ALL_BADGES.find(b => b.id === id))
    .filter(badge => {
      if (!badge) return false;
      if (badge.type === 'streak') {
        return profileData.currentStreak >= badge.milestone;
      }
      return true; 
    }) as BadgeData[];


  const currentChallengeDay = getChallengeDayNumberFromDateString(getTodaysDateClientLocal());
  const challengeYear = new Date(profileData.lastLoginTimestamp ? profileData.lastLoginTimestamp.toDate() : Date.now()).getFullYear();

  const MainChrysalisAvatar = () => {
    if (profileData.photoURL !== CHRYSALIS_AVATAR_IDENTIFIER) return null;

    let variantToShow: ChrysalisVariantData | undefined;
    if (profileData.activeChrysalisThemeId) {
      variantToShow = getChrysalisVariantById(profileData.activeChrysalisThemeId);
    }
    if (!variantToShow) {
      variantToShow = getChrysalisVariantByDay(1); 
    }

    const IconComponent = variantToShow?.icon || ShellIconLucide;
    let iconColorStyle: React.CSSProperties = {};

    if (isOwnProfile) {
        iconColorStyle = { color: `hsl(var(--primary))` };
    } else if (variantToShow?.themePrimaryHSL) {
        iconColorStyle = { color: `hsl(${variantToShow.themePrimaryHSL})` };
    } else {
        iconColorStyle = { color: 'hsl(var(--muted-foreground))' };
    }


    const iconClassName = cn(
      "h-32 w-32 md:h-36 md:w-36",
      isOwnProfile ? "animate-chrysalis-glow" : "opacity-90"
    );

    const buttonAriaLabel = isOwnProfile
      ? "Change Chrysalis Avatar or Theme"
      : `${variantToShow?.name || 'Chrysalis'} Avatar`;

    return (
      <div className="flex justify-center mb-6">
        <button
          onClick={handleChrysalisAvatarClick}
          className={cn(
            "p-2 rounded-full focus:outline-none",
            isOwnProfile ? "cursor-pointer focus:ring-4 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-card" : "cursor-default"
          )}
          aria-label={buttonAriaLabel}
          disabled={!isOwnProfile}
        >
          <IconComponent className={iconClassName} style={iconColorStyle} data-ai-hint={variantToShow?.name.toLowerCase().includes("shell") ? "chrysalis shell" : "icon nature"}/>
        </button>
      </div>
    );
  };


  return (
    <>
      <Card className="w-full max-w-2xl mx-auto shadow-xl">
        <CardHeader className="text-center">
          <MainChrysalisAvatar />
          <div className="flex justify-between items-start text-left flex-col space-y-4 sm:flex-row sm:space-y-0">
            <div>
              <CardTitle className="font-headline text-3xl flex items-center">
                <User className="mr-3 h-8 w-8 text-primary" />
                {profileData.displayName || 'User Profile'}
              </CardTitle>
              {isOwnProfile && profileData.email && (
                <CardDescription className="flex items-center mt-3">
                    <Mail className="mr-2 h-4 w-4 text-muted-foreground" /> {profileData.email}
                </CardDescription>
              )}
              {profileData.teamId && profileData.teamName && (
                <CardDescription className="flex items-center mt-1">
                  <TeamIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                  On team: <Link href={`/teams/${profileData.teamId}`} className="font-semibold text-accent hover:underline ml-1">{profileData.teamName}</Link>
                </CardDescription>
              )}
              {(isOwnProfile || profileData.currentStreak > 0) && (
                <CardDescription className="flex items-center mt-1">
                  <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />
                  Streak: <span className="text-muted-foreground ml-1">{profileData.currentStreak} day{profileData.currentStreak === 1 ? '' : 's'}</span>
                </CardDescription>
              )}

            </div>
             <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                {!isOwnProfile && authUser && profileData.profileComplete && (
                <Button variant="default" size="sm" onClick={() => setShowChallengeModal(true)}>
                    <Swords className="mr-2 h-4 w-4" /> Challenge {profileData.displayName?.split(' ')[0] || 'User'}
                </Button>
                )}
                {isOwnProfile && (
                <Button variant="outline" size="sm" asChild>
                    <Link href={`/profile/${profileData.uid}?edit=true`}>
                    <Edit3 className="mr-2 h-4 w-4" /> Edit Profile
                    </Link>
                </Button>
                )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm space-y-3"> 
            <div className="flex flex-col space-y-1.5 p-6 pb-0">
              <div className="font-semibold tracking-tight font-headline text-xl flex items-center"><Footprints className="mr-2 h-5 w-5 text-primary"/>Your Steps</div>
              <div className="text-sm text-muted-foreground">How close you are to your goal.</div>
            </div>
            <div className="space-y-1.5 p-6 pt-4">
              <div className="flex flex-row justify-end">
                <div className="text-sm font-medium text-muted-foreground">
                  <span className="font-bold mr-1">{profileData.currentSteps.toLocaleString()} steps</span> out of {profileData.stepGoal && profileData.stepGoal > 0 && ( 
                    <span className="ml-1">{profileData.stepGoal.toLocaleString()} goal</span>
                  )}
                </div>              
              </div>

              {profileData.stepGoal && profileData.stepGoal > 0 && (
                <div className="mt-0"> 
                  <Progress value={progressPercentage} className="w-full h-3" />
                  <p className="text-sm text-muted-foreground text-left mt-1">
                    {Math.min(100, Math.round(progressPercentage))}%
                  </p>
                </div>
              )}
              {!profileData.stepGoal && !isOwnProfile && (
                <p className="text-sm text-muted-foreground">Step goal not set by user.</p>
               )}
               {!profileData.stepGoal && isOwnProfile && (
                  <p className="text-sm text-muted-foreground">Step goal not set. <Link href={`/profile/${profileData.uid}?edit=true`} className="underline">Set one now!</Link></p>
              )}
            </div>
          </div>

          <Separator className="my-6" />

          {isOwnProfile && (
            <DailyStepChart
              dailyStepsData={dailyStepsData}
              isLoading={isLoadingChart}
              userProfile={profileData}
              chartType="user"
            />
          )}

          {isOwnProfile && <Separator className="my-6" />}

          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center">
              <Layers className="mr-2 h-5 w-5 text-primary" /> Chrysalis Coins
            </h3>
            <p className="text-sm text-muted-foreground">
              Collected: <span className="font-bold text-accent">{collectedCoinsCount}</span> / {currentChallengeDay > 0 ? currentChallengeDay : CHALLENGE_DURATION_DAYS} days so far. {isOwnProfile ? "Click a collected coin to view details or activate its theme." : ""}
            </p>
            {currentChallengeDay > 0 ? (
              <div className="flex flex-wrap gap-x-3 gap-y-4 justify-center pt-2">
                {Array.from({ length: currentChallengeDay }, (_, i) => i + 1).map((dayNum) => {
                  const variant = getChrysalisVariantByDay(dayNum);
                  if (!variant) return null;

                  const challengeDateForDay = getChallengeDateStringByDayNumber(dayNum, challengeYear);
                  const isCollected = profileData.chrysalisCoinDates?.includes(challengeDateForDay) ?? false;
                  const CoinIcon = variant.icon || ShellIconLucide;
                  const isMissedAndPastCoin = !isCollected && variant.dayNumber < currentChallengeDay;
                  
                  const isClickableCoin = isOwnProfile && isCollected && !isMissedAndPastCoin;


                  return (
                    <button
                      key={variant.id}
                      onClick={() => isClickableCoin && handleCoinGalleryItemClick(variant, false)}
                      disabled={!isClickableCoin || isMissedAndPastCoin} // Ensure missed is unclickable
                      className={cn(
                        "p-3 rounded-lg flex flex-col items-center w-28 min-h-[8.5rem] text-center shadow-sm transition-all justify-between",
                        "border",
                        isCollected ? "bg-card border-primary/30" : "bg-muted/40 border-muted-foreground/20 opacity-60",
                        isClickableCoin ? "cursor-pointer hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary hover:opacity-100" : "cursor-default",
                        isMissedAndPastCoin && "opacity-40 !cursor-not-allowed"
                      )}
                      aria-label={isClickableCoin ? `View ${variant.name}` : (isCollected ? variant.name : `${variant.name} (Not collected)`)}
                    >
                      <CoinIcon className={cn(
                        "h-12 w-12 mb-1.5 flex-shrink-0",
                        isCollected ? "text-primary" : "text-muted-foreground"
                      )} data-ai-hint={variant.name.toLowerCase().includes("shell") ? "chrysalis shell" : "icon nature"} />
                      <div className="flex-grow flex flex-col justify-end w-full">
                        <span className={cn(
                          "text-xs font-medium block truncate w-full leading-tight",
                          isCollected ? "text-foreground" : "text-muted-foreground"
                        )}>
                          {variant.name}
                        </span>
                        {isMissedAndPastCoin && <span className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">(Missed)</span>}
                        {!isCollected && !isMissedAndPastCoin && variant.dayNumber <= currentChallengeDay && <span className="text-xs text-muted-foreground/80 mt-0.5">(Not Collected)</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
               <p className="text-muted-foreground text-center py-4">The challenge hasn't started yet. Coins will appear here once it begins!</p>
            )}
            {isOwnProfile && profileData.photoURL !== CHRYSALIS_AVATAR_IDENTIFIER && collectedCoinsCount > 0 && (
                 <Button variant="outline" size="sm" onClick={handleChrysalisAvatarClick} className="mt-3">
                    <Replace className="mr-2 h-4 w-4" /> Set Golden Chrysalis Avatar
                </Button>
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
                  
                  const isClickable = true; 

                  return (
                    <div
                      key={badge.id}
                      onClick={() => handleExistingBadgeClick(badge)}
                      className={cn(
                        commonBadgeClasses,
                        interactiveBadgeClasses
                      )}
                      role="button"
                      tabIndex={0}
                      aria-label={`View details for ${badge.name} badge`}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleExistingBadgeClick(badge); }}
                    >
                      <BadgeIconComponent className="h-10 w-10 text-primary mb-1" />
                      <span className="text-xs font-medium">{badge.name}</span>
                       {badge.type === 'streak' && (
                        <span className="text-xs text-muted-foreground/80 mt-0.5">({badge.milestone} day streak)</span>
                      )}
                       {badge.type === 'step' && badge.id !== 'first-step' && (
                        <span className="text-xs text-muted-foreground/80 mt-0.5">({badge.milestone.toLocaleString()} steps)</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-center">{isOwnProfile ? "Start logging steps" : "This user is ready"} to earn badges!</p>
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
              <p className="text-xs text-muted-foreground">Share this link with friends and family to show your progress!</p>
            </div>
          )}

        </CardContent>
      </Card>

      <BadgeDetailModal
          isOpen={isExistingBadgeModalOpen}
          onOpenChange={setIsExistingBadgeModalOpen}
          badge={selectedExistingBadge}
      />
      {isOwnProfile && (
        <CoinThemeActivationModal
          isOpen={isCoinDetailModalOpen}
          onOpenChange={setIsCoinDetailModalOpen}
          coinVariant={selectedCoinForModal}
        />
      )}
      {!isOwnProfile && profileData && (
        <ChallengeDefinitionModal
            isOpen={showChallengeModal}
            onOpenChange={setShowChallengeModal}
            opponentUid={profileData.uid}
            opponentDisplayName={profileData.displayName || 'User'}
        />
      )}
    </>
  );
}
