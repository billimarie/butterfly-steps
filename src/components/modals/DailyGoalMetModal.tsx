
'use client';

import { useAuth } from '@/context/AuthContext';
import { Dialog, DialogContent, DialogOverlay, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Target, CheckCircle, Sparkles, Gift, X } from 'lucide-react';
import { isChallengeActive } from '@/lib/dateUtils'; // Updated import
import { getTodaysDateClientLocal } from '@/lib/firebaseService';

export default function DailyGoalMetModal() {
  const { 
    userProfile, 
    showDailyGoalMetModal, 
    setShowDailyGoalMetModal,
    canCollectTodaysChrysalisCoin,
    collectDailyChrysalisCoin,
    setCanCollectTodaysChrysalisCoin
  } = useAuth();

  if (!userProfile || !userProfile.profileComplete) {
    return null;
  }

  const challengeIsCurrentlyActive = isChallengeActive(); 
  const today = getTodaysDateClientLocal();
  const coinAlreadyCollectedToday = userProfile.chrysalisCoinDates?.includes(today) ?? false;
  const showUnlockButton = canCollectTodaysChrysalisCoin && !coinAlreadyCollectedToday && challengeIsCurrentlyActive;

  const handleUnlockCoin = () => {
    collectDailyChrysalisCoin();
    setShowDailyGoalMetModal(false); 
  };

  const handleClose = () => {
    setShowDailyGoalMetModal(false);
    if (canCollectTodaysChrysalisCoin) {
      setCanCollectTodaysChrysalisCoin(false);
    }
  };

  return (
    <Dialog open={showDailyGoalMetModal} onOpenChange={(isOpen) => {
      if (!isOpen) handleClose();
      else setShowDailyGoalMetModal(true);
    }}>
      <DialogOverlay className="bg-black/60 backdrop-blur-sm" />
      <DialogContent className="sm:max-w-md p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="p-6 pb-2 text-center bg-gradient-to-br from-primary via-primary to-accent relative">
          <DialogTitle className="font-headline text-3xl text-primary-foreground flex items-center justify-center">
            <Target className="mr-3 h-8 w-8 text-yellow-300" />
            Daily Goal Achieved
          </DialogTitle>
           <button 
            onClick={handleClose} 
            className="absolute top-3 right-3 p-1 rounded-full bg-white/20 hover:bg-white/40 text-primary-foreground hover:text-white transition-colors z-10"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </DialogHeader>
        <div className="pt-6 pb-6 px-6 space-y-6 text-center">
            <div className="text-center space-y-2 min-h-[100px] flex flex-col justify-center items-center">
              <Sparkles className="h-12 w-12 text-accent animate-pulse mb-3" data-ai-hint="celebration sparkles" />
              <p className="text-2xl font-semibold text-primary px-4">
                Fantastic!
              </p>
              <p className="text-lg text-muted-foreground mt-1">
                You've met your step target for today.
              </p>
            </div>
            {showUnlockButton ? (
              <Button onClick={handleUnlockCoin} size="lg" className="w-full">
                <Gift className="mr-2 h-5 w-5" />
                Unlock Today's Chrysalis Coin
              </Button>
            ) : !challengeIsCurrentlyActive && canCollectTodaysChrysalisCoin ? (
              <p className="text-sm text-muted-foreground italic">
                Chrysalis Coin collection is only available during the challenge period (June 21 - Oct 31).
              </p>
            ) : (
               challengeIsCurrentlyActive && !showUnlockButton && coinAlreadyCollectedToday && (
                 <p className="text-sm text-muted-foreground italic">
                    You've already collected today's Chrysalis Coin. Great job!
                 </p>
               )
            )}
        </div>
        <DialogFooter className="px-6 py-4 bg-muted/30 flex justify-center items-center space-x-2">
          <p className="text-sm text-muted-foreground">Keep up the great work!</p>
          <img
            src="https://res.cloudinary.com/djrhjkkvm/image/upload/v1749691114/Cartoons/catti-the-caterpillar_b9skmk.png"
            className="w-10 h-10 animate-catti-wiggle"
            alt="Catti the Caterpillar"
            data-ai-hint="caterpillar cartoon"
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
