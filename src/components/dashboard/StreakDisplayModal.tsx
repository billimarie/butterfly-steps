
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogOverlay, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Leaf, Check, CalendarDays, Award, Sparkles, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const dayAbbreviations = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function StreakDisplayModal() {
  const { userProfile, showStreakModal, setShowStreakModal } = useAuth();
  const [streakDates, setStreakDates] = useState<string[]>([]);
  const [lastFiveDays, setLastFiveDays] = useState<{ dateString: string; dayAbbrev: string }[]>([]);
  const [animatedStreak, setAnimatedStreak] = useState(0); 

  useEffect(() => {
    if (userProfile?.currentStreak !== undefined && userProfile.currentStreak !== animatedStreak) {
        const oldStreakEl = document.getElementById('streak-modal-number-value'); // Target the span
        if (oldStreakEl) {
            oldStreakEl.classList.remove('animate-streak-update');
            void oldStreakEl.offsetWidth; 
            oldStreakEl.classList.add('animate-streak-update');
        }
        setAnimatedStreak(userProfile.currentStreak);
    }
  }, [userProfile?.currentStreak, animatedStreak]);


  useEffect(() => {
    if (userProfile && userProfile.lastStreakLoginDate && userProfile.currentStreak > 0) {
      const currentStreak = userProfile.currentStreak;
      const lastLogin = new Date(userProfile.lastStreakLoginDate + 'T00:00:00Z'); 

      const dates: string[] = [];
      for (let i = 0; i < currentStreak; i++) {
        const d = new Date(lastLogin);
        d.setUTCDate(lastLogin.getUTCDate() - i);
        dates.push(d.toISOString().split('T')[0]);
      }
      setStreakDates(dates.reverse()); 
    } else {
      setStreakDates([]);
    }

    const today = new Date();
    const fiveDays: { dateString: string; dayAbbrev: string }[] = [];
    for (let i = 4; i >= 0; i--) { 
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      fiveDays.push({
        dateString: d.toISOString().split('T')[0],
        dayAbbrev: dayAbbreviations[d.getDay()],
      });
    }
    setLastFiveDays(fiveDays);

  }, [userProfile]);
  
  useEffect(() => {
    if (userProfile?.currentStreak !== undefined) {
      setAnimatedStreak(userProfile.currentStreak);
    }
  }, [userProfile?.currentStreak]);


  if (!userProfile || !userProfile.profileComplete) {
    return null; 
  }

  const renderStreakMessage = () => {
    if (animatedStreak >= 2) {
      return (
        <>
          <span id="streak-modal-number-value" className="text-7xl font-bold text-primary">
            {animatedStreak}
          </span>
          <p className="text-xl text-muted-foreground mt-1">days in a row! Awesome!</p>
        </>
      );
    } else if (animatedStreak === 1) {
      return (
        <p id="streak-modal-number-value" className="text-3xl font-bold text-primary px-4">
          Your streak starts today! Keep it up!
        </p>
      );
    }
    // Should not happen if modal is shown only for streakProcessedForToday,
    // which implies streak >= 1
    return <p className="text-xl text-muted-foreground">Keep logging in to build your streak!</p>; 
  };


  return (
    <Dialog open={showStreakModal} onOpenChange={(isOpen) => setShowStreakModal(isOpen)}>
      <DialogOverlay className="bg-black/60 backdrop-blur-sm" />
      <DialogContent className="sm:max-w-md p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="p-6 pb-2 text-center bg-gradient-to-br from-primary via-primary to-accent">
          <DialogTitle className="font-headline text-3xl text-primary-foreground flex items-center justify-center">
            {animatedStreak >= 2 ? <TrendingUp className="mr-3 h-8 w-8 text-yellow-300" /> : <Sparkles className="mr-3 h-8 w-8 text-yellow-300" />}
            Daily Login Streak
          </DialogTitle>
        </DialogHeader>
        <div className="pt-6 pb-6 px-6 space-y-6 text-center">

            <div className="text-center space-y-1 min-h-[100px] flex flex-col justify-center items-center">
              <Leaf className="h-10 w-10 text-accent animate-pulse mb-2" data-ai-hint="butterfly monarch" />
              {renderStreakMessage()}
            </div>

            <div className="flex justify-around items-center pb-4">
            {lastFiveDays.map(({ dateString, dayAbbrev }) => {
                const isActive = streakDates.includes(dateString);
                const isPastOrToday = new Date(dateString + 'T00:00:00Z') <= new Date(new Date().toISOString().split('T')[0] + 'T00:00:00Z');
                
                return (
                <div key={dateString} className="flex flex-col items-center space-y-1">
                    <span className="text-xs text-muted-foreground">{dayAbbrev}</span>
                    <div
                    className={cn(
                        "h-12 w-12 rounded-full border-2 flex items-center justify-center transition-all duration-300",
                        isActive && isPastOrToday ? "bg-green-300 border-green-600 shadow-md" : "bg-muted/30 border-muted",
                         !isPastOrToday ? "opacity-50" : "" 
                    )}
                    >
                    {isActive && isPastOrToday && (
                        <Check className="h-7 w-7 text-green-600 animate-checkmark-appear" />
                    )}
                    </div>
                </div>
                );
            })}
            </div>
        </div>
        <DialogFooter className="px-6 py-4 bg-muted/30 flex justify-center items-center space-x-2">
          <p className="text-sm text-muted-foreground">Keep on flyin' high!</p>
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
