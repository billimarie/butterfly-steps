
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogOverlay, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ShellIcon, RefreshCw, Gift, CheckCircle, XCircle, User as UserIcon, Footprints } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getDailyStepForDate, getTodaysDateClientLocal } from '@/lib/firebaseService';
import type { DailyStep } from '@/types';
import { useRouter } from 'next/navigation';

const CHRYSALIS_AVATAR_IDENTIFIER = 'lucide:shell';

export default function ChrysalisInteractionModal() {
  const {
    user,
    userProfile,
    showStreakModal,
    setShowStreakModal,
    streakModalContext,
    setStreakModalContext,
    activateChrysalisAsAvatar,
    collectDailyChrysalisCoin
  } = useAuth();

  const router = useRouter();
  const [isActivatingAvatar, setIsActivatingAvatar] = useState(false);
  const [isCollectingCoin, setIsCollectingCoin] = useState(false);
  const [stepsLoggedToday, setStepsLoggedToday] = useState<boolean | null>(null);
  const [coinAlreadyCollected, setCoinAlreadyCollected] = useState<boolean | null>(null);

  const currentDate = getTodaysDateClientLocal();

  useEffect(() => {
    if (!user || !userProfile || !showStreakModal || streakModalContext !== 'login') {
      setStepsLoggedToday(null);
      setCoinAlreadyCollected(null);
      return;
    }

    const alreadyCollected = userProfile.chrysalisCoinDates?.includes(currentDate) || false;
    setCoinAlreadyCollected(alreadyCollected);

    if (!alreadyCollected) {
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
      setStepsLoggedToday(true); // If already collected, assume steps were logged
    }
  }, [user, userProfile, showStreakModal, currentDate, streakModalContext]);


  if (!userProfile || !userProfile.profileComplete) {
    return null;
  }

  const handleDialogClose = (isOpen: boolean) => {
    if (!isActivatingAvatar && !isCollectingCoin) {
      setShowStreakModal(isOpen);
      if (!isOpen) {
        setStreakModalContext('login'); // Reset context when modal is closed by user
      }
    }
  };


  const handleActivateAvatar = async () => {
    setIsActivatingAvatar(true);
    await activateChrysalisAsAvatar();
    setIsActivatingAvatar(false);
  };

  const handleCollectCoin = async () => {
    setIsCollectingCoin(true);
    await collectDailyChrysalisCoin();
    setIsCollectingCoin(false);
  };

  const isChrysalisAvatarActive = userProfile.photoURL === CHRYSALIS_AVATAR_IDENTIFIER;
  const canAttemptCoinCollection = stepsLoggedToday === true && coinAlreadyCollected === false;
  const isLoadingCoinStatus = streakModalContext === 'login' && (stepsLoggedToday === null || coinAlreadyCollected === null);


  const renderActivateAvatarContent = () => (
    <>
      <DialogHeader className={cn(
          "p-6 pb-4 text-center items-center justify-center rounded-t-lg",
          "bg-gradient-to-br from-primary/90 via-primary/80 to-accent/70"
      )}>
        <DialogTitle className="font-headline text-3xl text-primary-foreground flex items-center justify-center">
          {streakModalContext === 'profile_avatar_select' ? 'Set Chrysalis Avatar' : 'Chrysalis Unlocked'}
        </DialogTitle>
      </DialogHeader>
      <div className="pt-8 pb-8 px-6 space-y-4 text-center">
          <ShellIcon className="!h-28 !w-28 text-primary mx-auto mb-5 animate-pulse" data-ai-hint="chrysalis shell gold" />
          <p className="text-4xl font-bold text-primary">
              GOLDEN CHRYSALIS
          </p>
          <p className="text-muted-foreground text-md mt-2 max-w-xs mx-auto">
              {streakModalContext === 'profile_avatar_select'
                ? 'Set the Golden Chrysalis as your profile picture.'
                : 'Reach this Chrysalis when you log in for the first time.'
              }
          </p>
      </div>
      <DialogFooter className="px-6 py-4 bg-muted/30 border-t rounded-b-lg flex justify-center items-center">
        <Button onClick={handleActivateAvatar} className="w-full sm:w-auto" size="lg" disabled={isActivatingAvatar}>
          {isActivatingAvatar ? (
            <>
              <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
              Activating...
            </>
          ) : (
            'Activate Chrysalis'
          )}
        </Button>
      </DialogFooter>
    </>
  );

  const renderCollectCoinContent = () => {
    let statusText = "";
    let IconComponentForStatus = Gift; // Large icon above the text
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
    } else if (coinAlreadyCollected) {
      statusText = "You've already collected your Chrysalis Coin for today. Great job!";
      IconComponentForStatus = CheckCircle;
      iconColorForStatus = "text-green-500";
      finalButton = (
        <Button
            onClick={() => {
                if (user?.uid) router.push(`/profile/${user.uid}`);
                setShowStreakModal(false);
            }}
            className="w-full sm:w-auto"
            size="lg"
        >
            <UserIcon className="mr-2 h-5 w-5" />
            View on Profile
        </Button>
      );
    } else if (!stepsLoggedToday) {
      statusText = "Log your steps for today to unlock your Chrysalis Coin!";
      IconComponentForStatus = Footprints; // Changed from XCircle to Footprints
      iconColorForStatus = "text-destructive";
      finalButton = (
        <Button className="w-full sm:w-auto" size="lg" disabled={true}>
            <XCircle className="mr-2 h-5 w-5" /> {/* Or Footprints for consistency */}
            Log Steps to Unlock
        </Button>
      );
    } else { // Can attempt coin collection (stepsLoggedToday === true && coinAlreadyCollected === false)
      statusText = "Well done on logging your steps! Collect your Chrysalis Coin.";
      IconComponentForStatus = Gift;
      iconColorForStatus = "text-primary animate-pulse";
      finalButton = (
        <Button
            onClick={handleCollectCoin}
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


  return (
    <Dialog open={showStreakModal} onOpenChange={handleDialogClose}>
      <DialogOverlay className="bg-black/60 backdrop-blur-sm" />
      <DialogContent className="sm:max-w-md p-0 overflow-hidden shadow-2xl rounded-lg">
        {streakModalContext === 'profile_avatar_select' || (streakModalContext === 'login' && !isChrysalisAvatarActive)
            ? renderActivateAvatarContent()
            : renderCollectCoinContent()
        }
      </DialogContent>
    </Dialog>
  );
}
