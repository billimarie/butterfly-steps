
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogOverlay, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ShellIcon as DefaultShellIcon, RefreshCw, Gift, CheckCircle, Footprints, Palette, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getDailyStepForDate, getTodaysDateClientLocal } from '@/lib/firebaseService';
import type { DailyStep } from '@/types';
import { CHRYSALIS_AVATAR_IDENTIFIER } from '@/types';
import { useRouter } from 'next/navigation';
import { getChrysalisVariantByDay, getChrysalisVariantById } from '@/lib/chrysalisVariants';


export default function ChrysalisInteractionModal() {
  const {
    user,
    userProfile,
    showStreakModal,
    setShowStreakModal,
    streakModalContext,
    setStreakModalContext,
    activateChrysalisAsAvatar, 
    collectDailyChrysalisCoin,
    setShowLogStepsModal,
    justCollectedCoin,        
    activateThemeFromCollectedCoin, 
    clearJustCollectedCoinDetails, 
  } = useAuth();

  const router = useRouter();
  const [isActivatingAvatar, setIsActivatingAvatar] = useState(false); 
  const [isCollectingCoin, setIsCollectingCoin] = useState(false);
  const [isActivatingTheme, setIsActivatingTheme] = useState(false); 
  const [stepsLoggedToday, setStepsLoggedToday] = useState<boolean | null>(null);
  const [coinAlreadyCollectedThisSession, setCoinAlreadyCollectedThisSession] = useState<boolean | null>(null);

  const currentDate = getTodaysDateClientLocal();

  useEffect(() => {
    if (!user || !userProfile || !showStreakModal) {
      setStepsLoggedToday(null);
      setCoinAlreadyCollectedThisSession(null);
      return;
    }

    if (justCollectedCoin) return;

    if (streakModalContext === 'login') {
      const alreadyCollectedInProfile = userProfile.chrysalisCoinDates?.includes(currentDate) || false;
      setCoinAlreadyCollectedThisSession(alreadyCollectedInProfile);

      if (!alreadyCollectedInProfile) {
        setStepsLoggedToday(null);
        getDailyStepForDate(user.uid, currentDate)
          .then((dailyStep: DailyStep | null) => {
            setStepsLoggedToday(!!dailyStep && dailyStep.steps > 0);
          })
          .catch(err => {
            console.error("Error fetching daily step log for modal:", err);
            setStepsLoggedToday(false);
          });
      } else {
        setStepsLoggedToday(true); 
      }
    } else {
      setStepsLoggedToday(null);
      setCoinAlreadyCollectedThisSession(null);
    }
  }, [user, userProfile, showStreakModal, currentDate, streakModalContext, justCollectedCoin]);


  if (!userProfile || !userProfile.profileComplete) {
    return null;
  }

  const handleDialogClose = (isOpen: boolean) => {
    if (isActivatingAvatar || isCollectingCoin || isActivatingTheme) return; 

    if (!isOpen) {
      if (justCollectedCoin) {
        clearJustCollectedCoinDetails(); 
      }
      setShowStreakModal(false);
      setStreakModalContext('login'); 
    } else {
      setShowStreakModal(true);
    }
  };

  const handleActivateDefaultChrysalis = async () => {
    setIsActivatingAvatar(true);
    await activateChrysalisAsAvatar(); 
    setIsActivatingAvatar(false);
  };

  const handleCollectCoinAttempt = async () => {
    setIsCollectingCoin(true);
    await collectDailyChrysalisCoin(); 
    setIsCollectingCoin(false);
  };

  const handleActivateCollectedCoinTheme = async () => {
    if (!justCollectedCoin) return;
    setIsActivatingTheme(true);
    await activateThemeFromCollectedCoin(justCollectedCoin);
    setIsActivatingTheme(false);
  };

  const handleLogStepsToUnlock = () => {
    setShowStreakModal(false);
    setShowLogStepsModal(true, 'chrysalis');
  };

  const isChrysalisAvatarCurrentlyActive = userProfile.photoURL === CHRYSALIS_AVATAR_IDENTIFIER;
  const isLoadingCoinStatus = streakModalContext === 'login' && !justCollectedCoin && (stepsLoggedToday === null || coinAlreadyCollectedThisSession === null);


  if (justCollectedCoin) {
    const CollectedCoinIcon = justCollectedCoin.icon || DefaultShellIcon;
    return (
       <Dialog open={showStreakModal} onOpenChange={handleDialogClose}>
        <DialogOverlay className="bg-black/60 backdrop-blur-sm" />
        <DialogContent className="sm:max-w-md p-0 overflow-hidden shadow-2xl rounded-lg">
          <DialogHeader className={cn(
            "p-6 pb-4 text-center items-center justify-center rounded-t-lg",
            "bg-gradient-to-br from-secondary/80 via-secondary/70 to-accent/60" 
          )}>
            <DialogTitle className="font-headline text-3xl text-secondary-foreground flex items-center justify-center">
              Coin Collected!
            </DialogTitle>
          </DialogHeader>
          <div className="pt-8 pb-8 px-6 space-y-4 text-center">
            <CollectedCoinIcon className={cn("!h-28 !w-28 mx-auto mb-5 text-primary animate-pulse")} data-ai-hint={justCollectedCoin.name.toLowerCase().includes("shell") ? "chrysalis shell" : "icon nature"}/>
            <p className="text-3xl font-bold text-primary">{justCollectedCoin.name}</p>
            <p className="text-muted-foreground text-md mt-2 max-w-sm mx-auto">
              {justCollectedCoin.description}
            </p>
          </div>
          <DialogFooter className="px-6 py-4 bg-muted/30 border-t rounded-b-lg flex flex-col sm:flex-row justify-center items-center gap-3">
            <Button onClick={handleActivateCollectedCoinTheme} className="w-full sm:w-auto" size="lg" disabled={isActivatingTheme}>
              {isActivatingTheme ? (
                <><RefreshCw className="mr-2 h-5 w-5 animate-spin" /> Activating...</>
              ) : (
                <><Palette className="mr-2 h-5 w-5" /> Activate Theme & Avatar</>
              )}
            </Button>
             <Button variant="outline" onClick={() => { clearJustCollectedCoinDetails(); setShowStreakModal(false); }} className="w-full sm:w-auto" size="lg" disabled={isActivatingTheme}>
                Not Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const renderActivateAvatarContent = () => {
    const isProfileAvatarView = streakModalContext === 'profile_avatar_select';
    let titleText = "Chrysalis Unlocked";
    let displayedVariantData = getChrysalisVariantByDay(1); 

    if (isProfileAvatarView) {
      titleText = "Your Chrysalis Avatar";
      if (userProfile?.activeChrysalisThemeId) {
        const activeVariant = getChrysalisVariantById(userProfile.activeChrysalisThemeId);
        if (activeVariant) {
          displayedVariantData = activeVariant;
        }
      }
    }

    const DisplayedIcon = displayedVariantData.icon || DefaultShellIcon;
    const defaultGoldenChrysalisId = getChrysalisVariantByDay(1).id;
    const isDefaultGoldenThemeActive = userProfile.activeChrysalisThemeId === defaultGoldenChrysalisId && userProfile.photoURL === CHRYSALIS_AVATAR_IDENTIFIER;

    return (
    <>
      <DialogHeader className={cn(
          "p-6 pb-4 text-center items-center justify-center rounded-t-lg",
          "bg-gradient-to-br from-primary/90 via-primary/80 to-accent/70"
      )}>
        <DialogTitle className="font-headline text-3xl text-primary-foreground flex items-center justify-center">
          {titleText}
        </DialogTitle>
      </DialogHeader>
      <div className="pt-8 pb-8 px-6 space-y-4 text-center">
          <DisplayedIcon className="!h-28 !w-28 text-primary mx-auto mb-5 animate-pulse" data-ai-hint={displayedVariantData.name.toLowerCase().includes("shell") ? "chrysalis shell gold" : "icon nature"} />
          <p className="text-4xl font-bold text-primary">
              {displayedVariantData.name.toUpperCase()}
          </p>
          <p className="text-muted-foreground text-md mt-2 max-w-xs mx-auto">
              {displayedVariantData.description}
          </p>
      </div>
      
      {isProfileAvatarView ? (
        <DialogFooter className="px-6 py-4 bg-muted/30 border-t rounded-b-lg flex justify-center items-center">
          {isDefaultGoldenThemeActive ? (
             <div className="flex items-center text-sm font-semibold text-primary">
                <Check className="mr-2 h-5 w-5" />
                Golden Chrysalis Theme is Active
            </div>
          ) : (
            <Button onClick={handleActivateDefaultChrysalis} className="w-full sm:w-auto" size="lg" disabled={isActivatingAvatar}>
              {isActivatingAvatar ? ( <><RefreshCw className="mr-2 h-5 w-5 animate-spin" /> Activating...</> ) : ( 'Activate Golden Chrysalis' )}
            </Button>
          )}
        </DialogFooter>
      ) : (
        (streakModalContext === 'login' && !isChrysalisAvatarCurrentlyActive) && (
          <DialogFooter className="px-6 py-4 bg-muted/30 border-t rounded-b-lg flex justify-center items-center">
            <Button onClick={handleActivateDefaultChrysalis} className="w-full sm:w-auto" size="lg" disabled={isActivatingAvatar}>
              {isActivatingAvatar ? ( <><RefreshCw className="mr-2 h-5 w-5 animate-spin" /> Activating...</> ) : ( 'Activate Chrysalis' )}
            </Button>
          </DialogFooter>
        )
      )}
      {streakModalContext === 'login' && isChrysalisAvatarCurrentlyActive && !isLoadingCoinStatus && !coinAlreadyCollectedThisSession && !justCollectedCoin && (
         <DialogFooter className="px-6 py-4 bg-muted/30 border-t rounded-b-lg flex justify-center items-center">
           <p className="text-sm text-muted-foreground">Golden Chrysalis avatar is active. Ready to collect today's coin?</p>
         </DialogFooter>
      )}
    </>
    );
  };

  const renderCollectCoinContent = () => {
    let statusText = "";
    let IconComponentForStatus = Gift;
    let iconColorForStatus = "text-primary";
    let finalButton: React.ReactNode;

    if (isLoadingCoinStatus) {
      statusText = "Checking your daily status...";
      IconComponentForStatus = RefreshCw;
      iconColorForStatus = "text-muted-foreground animate-spin";
      finalButton = (
        <Button className="w-full sm:w-auto" size="lg" disabled={true}>
          <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
          Checking Status...
        </Button>
      );
    } else if (coinAlreadyCollectedThisSession) {
      statusText = "You've already collected your Chrysalis Coin for today. Great job!";
      IconComponentForStatus = CheckCircle;
      iconColorForStatus = "text-green-500";
      finalButton = (
        <Button
            onClick={() => {
                if (user?.uid) {
                   const variantForToday = getChrysalisVariantByDay(getChallengeDayNumber(currentDate));
                   if (variantForToday) {
                     activateThemeFromCollectedCoin(variantForToday); 
                   } else {
                     setShowStreakModal(false); 
                   }
                } else {
                  setShowStreakModal(false);
                }
            }}
            className="w-full sm:w-auto"
            size="lg"
            disabled={isActivatingTheme}
        >
           {isActivatingTheme ? <><RefreshCw className="mr-2 h-5 w-5 animate-spin" /> Activating...</> : <><Palette className="mr-2 h-5 w-5" /> Activate Today's Theme</>}
        </Button>
      );
    } else if (!stepsLoggedToday) {
      statusText = "Log your steps for today to unlock your Chrysalis Coin!";
      IconComponentForStatus = Footprints;
      iconColorForStatus = "text-primary";
      finalButton = (
        <Button onClick={handleLogStepsToUnlock} className="w-full sm:w-auto" size="lg">
            <Footprints className="mr-2 h-5 w-5" />
            Log Steps to Unlock
        </Button>
      );
    } else { 
      statusText = "Well done on logging your steps! Collect your Chrysalis Coin.";
      IconComponentForStatus = Gift;
      iconColorForStatus = "text-primary animate-pulse";
      finalButton = (
        <Button
            onClick={handleCollectCoinAttempt}
            className="w-full sm:w-auto"
            size="lg"
            disabled={isCollectingCoin}
        >
            {isCollectingCoin ? (
                <>
                    <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                    Collecting...
                </>
            ) : (
                <>
                    <Gift className="mr-2 h-5 w-5" />
                    Collect Coin
                </>
            )}
        </Button>
      );
    }

    return (
      <>
        <DialogHeader className={cn(
            "p-6 pb-4 text-center items-center justify-center rounded-t-lg",
            "bg-gradient-to-br from-secondary/90 via-secondary/80 to-accent/70"
        )}>
          <DialogTitle className="font-headline text-3xl text-secondary-foreground flex items-center justify-center">
            Daily Chrysalis Coin
          </DialogTitle>
        </DialogHeader>
        <div className="pt-8 pb-8 px-6 space-y-4 text-center">
            <IconComponentForStatus className={cn("!h-24 !w-24 mx-auto mb-5", iconColorForStatus)} />
            <p className="text-muted-foreground text-md mt-2 max-w-xs mx-auto">
              {statusText}
            </p>
        </div>
        <DialogFooter className="px-6 py-4 bg-muted/30 border-t rounded-b-lg flex justify-center items-center">
          {finalButton}
        </DialogFooter>
      </>
    );
  };

  function getChallengeDayNumber(dateString: string): number {
    const [year, month, day] = dateString.split('-').map(Number);
    const currentDate = new Date(Date.UTC(year, month - 1, day));
    const challengeStartDate = new Date(Date.UTC(currentDate.getUTCFullYear(), 5, 21)); 
    if (currentDate < challengeStartDate) return 0;
    const diffTime = currentDate.getTime() - challengeStartDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const dayNumber = diffDays + 1;
    return Math.max(1, Math.min(dayNumber, 133)); 
  }


  return (
    <Dialog open={showStreakModal} onOpenChange={handleDialogClose}>
      <DialogOverlay className="bg-black/60 backdrop-blur-sm" />
      <DialogContent className="sm:max-w-md p-0 overflow-hidden shadow-2xl rounded-lg">
        {justCollectedCoin
            ? renderActivateAvatarContent() // This will actually render the "Collected Coin View"
            : streakModalContext === 'profile_avatar_select' || (streakModalContext === 'login' && !isChrysalisAvatarCurrentlyActive && !isLoadingCoinStatus)
                ? renderActivateAvatarContent()
                : renderCollectCoinContent()
        }
      </DialogContent>
    </Dialog>
  );
}
