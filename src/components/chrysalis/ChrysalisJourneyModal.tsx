
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogOverlay, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Shell as ShellIconLucide, RefreshCw, Palette, Check, Sparkle as SparkleIconLucide, MoveRight, X, Gift, Footprints, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTodaysDateClientLocal, getDailyStepForDate, getChallengeDayNumberFromDateString, CHALLENGE_DURATION_DAYS } from '@/lib/firebaseService';
import type { ChrysalisVariantData, UserProfile } from '@/types';
import { CHRYSALIS_AVATAR_IDENTIFIER } from '@/types';
import { getChrysalisVariantByDay, getChrysalisVariantById } from '@/lib/chrysalisVariants';
import { useRouter } from 'next/navigation';


const Cloud = ({ className }: { className?: string }) => (
  <div className={cn("absolute bg-white/80 rounded-full", className)}></div>
);

const Sparkle = ({ className, size = 'md' }: { className?: string, size?: 'sm' | 'md' | 'lg' }) => {
  const s = size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5';
  return <SparkleIconLucide className={cn("absolute text-yellow-300 opacity-90", s, className)} data-ai-hint="sparkle decoration"/>;
};


export default function ChrysalisJourneyModal() {
  const authContext = useAuth();
  const {
    userProfile,
    showChrysalisJourneyModal,
    setShowChrysalisJourneyModal,
    chrysalisJourneyModalContext,
    setChrysalisJourneyModalContext,
    activateChrysalisAsAvatar,
    activateThemeFromCollectedCoin,
    justCollectedCoin,
    clearJustCollectedCoinDetails,
    setShowLogStepsModal,
    showDailyGoalMetModal, 
  } = authContext;

  const router = useRouter();
  const [isActivatingAvatar, setIsActivatingAvatar] = useState(false);
  const [isActivatingTheme, setIsActivatingTheme] = useState(false);

  const [stepsLoggedToday, setStepsLoggedToday] = useState(false);
  const [coinAlreadyCollectedThisSessionOrInDB, setCoinAlreadyCollectedThisSessionOrInDB] = useState(false);
  const [isLoadingCoinStatus, setIsLoadingCoinStatus] = useState(true);

  const currentDate = getTodaysDateClientLocal();
  const currentDayNumberForCoin = getChallengeDayNumberFromDateString(currentDate);


  useEffect(() => {
    if (
        !showChrysalisJourneyModal ||
        !userProfile ||
        justCollectedCoin 
    ) {
        setIsLoadingCoinStatus(false);
        return;
    }

    if (chrysalisJourneyModalContext === 'login' && userProfile.photoURL === CHRYSALIS_AVATAR_IDENTIFIER) {
        setIsLoadingCoinStatus(true);
        const checkStatus = async () => {
        try {
            const dailyStepDoc = await getDailyStepForDate(userProfile.uid, currentDate);
            setStepsLoggedToday(!!dailyStepDoc && dailyStepDoc.steps > 0);

            const alreadyCollected = userProfile.chrysalisCoinDates?.includes(currentDate) ?? false;
            setCoinAlreadyCollectedThisSessionOrInDB(alreadyCollected);
        } catch (error) {
            console.error("Error checking coin status in ChrysalisJourneyModal:", error);
            setStepsLoggedToday(false);
            setCoinAlreadyCollectedThisSessionOrInDB(false);
        } finally {
            setIsLoadingCoinStatus(false);
        }
        };
        checkStatus();
    } else {
        setIsLoadingCoinStatus(false); 
    }
    
  }, [showChrysalisJourneyModal, userProfile, currentDate, chrysalisJourneyModalContext, justCollectedCoin]);


  const handleDialogClose = (isOpen: boolean) => {
    if (isActivatingAvatar || isActivatingTheme) return;

    if (!isOpen) {
        if (justCollectedCoin) {
            clearJustCollectedCoinDetails();
        }
        setShowChrysalisJourneyModal(false);
        if (chrysalisJourneyModalContext === 'login') {
            setChrysalisJourneyModalContext('login');
        }
    }
  };

  const handleActivateDefaultChrysalis = async () => {
    setIsActivatingAvatar(true);
    await activateChrysalisAsAvatar();
    setIsActivatingAvatar(false);
  };

  const handleActivateCollectedCoinTheme = async () => {
    if (!justCollectedCoin) return;
    setIsActivatingTheme(true);
    await activateThemeFromCollectedCoin(justCollectedCoin);
    setIsActivatingTheme(false);
  };
  
  const handleLogStepsPrompt = () => {
    setShowChrysalisJourneyModal(false);
    setShowLogStepsModal(true, 'chrysalis'); 
  };


  const renderGamifiedCoinCollectedView = () => {
    const coinVariantToDisplay = authContext.justCollectedCoin;

    if (
      !coinVariantToDisplay ||
      typeof coinVariantToDisplay.id !== 'string' || !coinVariantToDisplay.id || // Added check for ID
      typeof coinVariantToDisplay.dayNumber !== 'number' ||
      typeof coinVariantToDisplay.name !== 'string' || !coinVariantToDisplay.name ||
      typeof coinVariantToDisplay.themePrimaryHSL !== 'string' || !coinVariantToDisplay.themePrimaryHSL ||
      typeof coinVariantToDisplay.themePrimaryForegroundHSL !== 'string' || !coinVariantToDisplay.themePrimaryForegroundHSL ||
      typeof coinVariantToDisplay.themeAccentHSL !== 'string' || !coinVariantToDisplay.themeAccentHSL ||
      typeof coinVariantToDisplay.themeAccentForegroundHSL !== 'string' || !coinVariantToDisplay.themeAccentForegroundHSL
    ) {
      console.error("ChrysalisJourneyModal: justCollectedCoin is null or malformed/incomplete in renderGamifiedCoinCollectedView. Value:", coinVariantToDisplay);
      return (
        <>
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="text-destructive text-lg font-semibold">Oops! Coin Display Error</DialogTitle>
        </DialogHeader>
        <DialogDescription className="text-muted-foreground mt-2 mb-4 px-6">
          There was an issue displaying the coin details. Please try again or contact support if this persists.
        </DialogDescription>
        <DialogFooter className="px-6 py-4 border-t">
          <Button variant="outline" onClick={() => handleDialogClose(false) }>Close</Button>
        </DialogFooter>
        </>
      );
    }

    const CoinIconToRender = coinVariantToDisplay.icon || ShellIconLucide;
    const dynamicHeaderStyle: React.CSSProperties = {
        background: `linear-gradient(to bottom right, hsl(${coinVariantToDisplay.themePrimaryHSL}), hsl(${coinVariantToDisplay.themeAccentHSL}))`,
    };
    const dynamicTitleStyle: React.CSSProperties = { 
        color: `hsl(${coinVariantToDisplay.themePrimaryForegroundHSL})`,
    };
    const dynamicDescriptionStyle: React.CSSProperties = {
      color: `hsl(${coinVariantToDisplay.themePrimaryForegroundHSL}, 0.9)` 
    };
    const dynamicActionButtonStyle: React.CSSProperties = {
        backgroundColor: `hsl(${coinVariantToDisplay.themePrimaryHSL})`,
        color: `hsl(${coinVariantToDisplay.themePrimaryForegroundHSL})`,
        borderColor: `hsl(${coinVariantToDisplay.themePrimaryHSL})`
    };
    const dynamicActionButtonHoverStyle: React.CSSProperties = {
        backgroundColor: `hsl(${coinVariantToDisplay.themePrimaryHSL.split(' ')[0]} ${coinVariantToDisplay.themePrimaryHSL.split(' ')[1]} ${Math.max(0, parseFloat(coinVariantToDisplay.themePrimaryHSL.split(' ')[2]) - 10)}%)`,
    };

    return (
      <>
        <DialogHeader
          className="relative w-full aspect-[4/5] flex flex-col items-center justify-around p-6 text-white rounded-t-lg !space-y-0 overflow-hidden"
          style={dynamicHeaderStyle}
        >
            <DialogClose asChild>
                <button onClick={() => handleDialogClose(false)} className="absolute right-3 top-3 z-20 p-1 rounded-full bg-white/20 hover:bg-white/40 text-primary-foreground hover:text-white transition-colors">
                <X className="h-5 w-5" />
                <span className="sr-only">Close</span>
                </button>
            </DialogClose>
            <Cloud className="w-20 h-10 top-16 -left-5 opacity-50" />
            <Cloud className="w-28 h-14 top-24 -right-10 opacity-40" />
            <Cloud className="w-16 h-8 bottom-32 -left-3 opacity-30" />
            <Cloud className="w-24 h-12 bottom-20 -right-8 opacity-35" />

            <Sparkle className="top-10 left-8 transform rotate-12" size="lg" />
            <Sparkle className="top-20 right-6 transform -rotate-15" size="md" />
            <Sparkle className="top-1/2 left-5 transform rotate-5" size="sm" />
            <Sparkle className="top-1/3 right-10 transform rotate-20" size="md" />
            <Sparkle className="bottom-1/4 left-10 transform -rotate-10" size="lg" />
            <Sparkle className="bottom-12 right-12 transform rotate-25" size="sm" />

            <DialogTitle className="text-center z-10" style={dynamicTitleStyle}>
              <span className="text-4xl font-bold tracking-wider">DAY {coinVariantToDisplay.dayNumber}</span>
            </DialogTitle>

            <div className="relative z-10 my-1">
              <div className="w-36 h-36 md:w-40 md:h-40 bg-gradient-to-br from-yellow-300 to-yellow-400 rounded-full shadow-2xl flex items-center justify-center border-8 border-yellow-400 ring-4 ring-orange-600 ring-inset">
                  <CoinIconToRender className="w-20 h-20 md:w-24 md:h-24" style={{ color: `hsl(${coinVariantToDisplay.themePrimaryHSL})` }} data-ai-hint={coinVariantToDisplay.name.toLowerCase().includes("shell") ? "chrysalis shell" : "icon nature"} />
              </div>
            </div>

            <DialogDescription className="text-center z-10" style={dynamicDescriptionStyle}>
              <span className="text-xl font-semibold">{coinVariantToDisplay.name}</span>
            </DialogDescription>
        </DialogHeader>
        
        <DialogFooter 
            className="px-6 py-4 border-t flex flex-col sm:flex-row justify-center gap-3 rounded-b-lg"
            style={{backgroundColor: `hsl(${coinVariantToDisplay.themeAccentHSL}, 0.3)`, borderColor: `hsl(${coinVariantToDisplay.themeAccentHSL})`}}
        >
            <Button
                onClick={handleActivateCollectedCoinTheme}
                className="w-full sm:flex-1 font-semibold transition-colors duration-150 ease-in-out"
                size="lg"
                disabled={isActivatingTheme}
                style={isActivatingTheme ? {} : dynamicActionButtonStyle}
                 onMouseEnter={e => {
                    if(!isActivatingTheme) Object.assign(e.currentTarget.style, dynamicActionButtonHoverStyle);
                }}
                onMouseLeave={e => {
                    if(!isActivatingTheme) Object.assign(e.currentTarget.style, dynamicActionButtonStyle);
                }}
            >
            {isActivatingTheme ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Palette className="mr-2 h-4 w-4"/>}
            Activate Theme
            </Button>
            <Button
                onClick={() => handleDialogClose(false)}
                variant="outline"
                className="w-full sm:flex-1"
                size="lg"
                disabled={isActivatingTheme}
                style={{borderColor: `hsl(${coinVariantToDisplay.themePrimaryHSL})`, color: `hsl(${coinVariantToDisplay.themePrimaryHSL})`}}
            >
            Continue <MoveRight className="ml-2 h-4 w-4" />
            </Button>
        </DialogFooter>
      </>
    );
  };


  const renderActivateAvatarContent = () => {
    const displayedVariantData = getChrysalisVariantByDay(1); 
    const DisplayedIcon = displayedVariantData.icon || ShellIconLucide;
    
    return (
    <>
      <DialogHeader className={cn(
          "p-6 pb-4 text-center items-center justify-center rounded-t-lg",
          "bg-gradient-to-br from-primary/90 via-primary/80 to-accent/70" 
      )}>
        <DialogTitle className="font-headline text-3xl text-primary-foreground flex items-center justify-center">
           Chrysalis Unlocked!
        </DialogTitle>
      </DialogHeader>
      <div className="pt-8 pb-8 px-6 space-y-4 text-center">
          <DisplayedIcon 
            className="!h-28 !w-28 mx-auto mb-5 animate-pulse"
            style={{color: `hsl(${displayedVariantData.themePrimaryHSL})`}} 
            data-ai-hint={displayedVariantData.name.toLowerCase().includes("shell") ? "chrysalis shell gold" : "icon nature"}
          />
          <DialogDescription className="text-muted-foreground text-md mt-2 max-w-xs mx-auto">
             Activate your Chrysalis Avatar! Then, collect unique Chrysalis Coins by reaching your daily step goal.
          </DialogDescription>
      </div>
      
      <DialogFooter className="px-6 py-4 bg-muted/30 border-t rounded-b-lg flex flex-col sm:flex-row justify-center items-center gap-3">
          <Button onClick={handleActivateDefaultChrysalis} className="w-full sm:w-auto" size="lg" disabled={isActivatingAvatar}>
            {isActivatingAvatar ? ( <><RefreshCw className="mr-2 h-5 w-5 animate-spin" /> Activating...</> ) : ( 'Set Golden Chrysalis as Avatar' )}
          </Button>
          <Button onClick={() => handleDialogClose(false)} variant="outline" className="w-full sm:w-auto" size="lg">Later</Button>
      </DialogFooter>
    </>
    );
  };

  const renderCollectCoinContent = () => {
    if (!userProfile) {
        return (
            <div className="p-8 text-center">
                <DialogHeader><DialogTitle>Loading Profile</DialogTitle></DialogHeader>
                <DialogDescription className="text-muted-foreground">Loading profile data...</DialogDescription>
            </div>
        );
    }

    if (isLoadingCoinStatus) {
      return (
        <div className="p-8 text-center">
          <DialogHeader><DialogTitle>Checking Status</DialogTitle></DialogHeader>
          <RefreshCw className="h-10 w-10 text-primary animate-spin mx-auto my-4" />
          <DialogDescription className="text-muted-foreground">Checking your daily progress...</DialogDescription>
        </div>
      );
    }

    const dailyTargetSteps = (userProfile.stepGoal && userProfile.stepGoal > 0)
        ? Math.round(userProfile.stepGoal / CHALLENGE_DURATION_DAYS)
        : 0;

    if (coinAlreadyCollectedThisSessionOrInDB) {
      const todaysCoinVariant = getChrysalisVariantByDay(currentDayNumberForCoin);
      return (
        <>
          <DialogHeader className="p-6 pb-4 text-center bg-slate-100 dark:bg-slate-800 rounded-t-lg">
            <DialogTitle className="font-headline text-2xl text-slate-700 dark:text-slate-200 flex items-center justify-center">
              <Check className="mr-2 h-7 w-7 text-green-500"/> Coin Already Collected!
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 text-center space-y-3">
            <DialogDescription className="text-muted-foreground">You've already collected the Chrysalis Coin for today ({currentDate}).</DialogDescription>
            {todaysCoinVariant && userProfile && userProfile.activeChrysalisThemeId !== todaysCoinVariant.id && userProfile.photoURL === CHRYSALIS_AVATAR_IDENTIFIER && (
                <Button onClick={() => activateThemeFromCollectedCoin(todaysCoinVariant, true)} disabled={isActivatingTheme} size="sm">
                    {isActivatingTheme ? <RefreshCw className="mr-2 h-4 w-4 animate-spin"/> : <Palette className="mr-2 h-4 w-4"/>}
                     Activate Today's Theme ({todaysCoinVariant.name})
                </Button>
            )}
          </div>
          <DialogFooter className="px-6 py-4 bg-muted/30 border-t rounded-b-lg">
            <Button onClick={() => handleDialogClose(false)} className="w-full">Keep Stepping!</Button>
          </DialogFooter>
        </>
      );
    }

    if (!stepsLoggedToday) {
      return (
        <>
          <DialogHeader className="p-6 pb-4 text-center bg-amber-50 dark:bg-amber-900/30 rounded-t-lg">
            <DialogTitle className="font-headline text-2xl text-amber-600 dark:text-amber-400 flex items-center justify-center">
             <Info className="mr-2 h-7 w-7"/> Log Steps First!
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 text-center space-y-3">
            <DialogDescription className="text-muted-foreground">
                Unlock your new Chrysalis Coin of the day by reaching your daily target of {dailyTargetSteps > 0 ? `${dailyTargetSteps.toLocaleString()} ` : ''}steps.
            </DialogDescription>
          </div>
          <DialogFooter className="px-6 py-4 bg-muted/30 border-t rounded-b-lg">
            <Button onClick={handleLogStepsPrompt} className="w-full">
              <Footprints className="mr-2 h-5 w-5"/> Log Your Steps
            </Button>
          </DialogFooter>
        </>
      );
    }
    
    return (
      <>
        <DialogHeader className="p-6 pb-4 text-center bg-green-50 dark:bg-green-900/30 rounded-t-lg">
          <DialogTitle className="font-headline text-2xl text-green-600 dark:text-green-400 flex items-center justify-center">
            <Gift className="mr-2 h-7 w-7"/> Daily Chrysalis Coin
          </DialogTitle>
        </DialogHeader>
        <div className="p-6 text-center space-y-3">
          <DialogDescription className="text-muted-foreground">You've met your daily goal! Ready to collect your Chrysalis Coin for today?</DialogDescription>
        </div>
        <DialogFooter className="px-6 py-4 bg-muted/30 border-t rounded-b-lg">
          <Button onClick={() => authContext.collectDailyChrysalisCoin()} className="w-full">
             <SparkleIconLucide className="mr-2 h-5 w-5"/>
            Collect Coin
          </Button>
        </DialogFooter>
      </>
    );
  };


  let contentToRender;

  if (authContext.justCollectedCoin && typeof authContext.justCollectedCoin.id === 'string' && chrysalisJourneyModalContext === 'login') { 
      contentToRender = renderGamifiedCoinCollectedView();
  } else if (chrysalisJourneyModalContext === 'profile_avatar_select' || (chrysalisJourneyModalContext === 'login' && userProfile && userProfile.photoURL !== CHRYSALIS_AVATAR_IDENTIFIER)) { 
      contentToRender = renderActivateAvatarContent();
  } else if (userProfile && chrysalisJourneyModalContext === 'login') { 
      contentToRender = renderCollectCoinContent(); 
  } else { 
    contentToRender = (
        <div className="p-4 text-center">
            <DialogHeader><DialogTitle>Information</DialogTitle></DialogHeader>
            <DialogDescription>Loading information...</DialogDescription>
            <Button onClick={() => handleDialogClose(false)} variant="outline" className="mt-4">Close</Button>
        </div>
    );
  }

  if (showDailyGoalMetModal && chrysalisJourneyModalContext === 'login' && !justCollectedCoin) {
    return null;
  }

  return (
    <Dialog open={showChrysalisJourneyModal} onOpenChange={handleDialogClose}>
      <DialogOverlay className="bg-black/60 backdrop-blur-sm" />
      <DialogContent className="sm:max-w-md p-0 overflow-hidden shadow-2xl rounded-lg">
        {contentToRender}
      </DialogContent>
    </Dialog>
  );
}
