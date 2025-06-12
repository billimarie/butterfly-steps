
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogOverlay, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Leaf, Check, CalendarDays, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

const dayAbbreviations = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function StreakDisplayModal() {
  const { userProfile, showStreakModal, setShowStreakModal } = useAuth();
  const [streakDates, setStreakDates] = useState<string[]>([]);
  const [lastFiveDays, setLastFiveDays] = useState<{ dateString: string; dayAbbrev: string }[]>([]);
  const [animatedStreak, setAnimatedStreak] = useState(0); // Initialize with 0

  useEffect(() => {
     // Ensure animatedStreak updates when userProfile.currentStreak changes
    if (userProfile?.currentStreak !== undefined && userProfile.currentStreak !== animatedStreak) {
        const oldStreakEl = document.getElementById('streak-modal-number');
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
      // Ensure date string is parsed correctly, assuming it's YYYY-MM-DD from server
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
  
  // Set initial animatedStreak from userProfile when component mounts or userProfile changes
  useEffect(() => {
    if (userProfile?.currentStreak !== undefined) {
      setAnimatedStreak(userProfile.currentStreak);
    }
  }, [userProfile?.currentStreak]);


  if (!userProfile || !userProfile.profileComplete) {
    return null; 
  }

  return (
    <Dialog open={showStreakModal} onOpenChange={(isOpen) => setShowStreakModal(isOpen)}>
      <DialogOverlay className="bg-black/60 backdrop-blur-sm" />
      <DialogContent className="sm:max-w-md p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="p-6 pb-2 text-center bg-gradient-to-br from-primary via-primary to-accent">
          <DialogTitle className="font-headline text-3xl text-primary-foreground flex items-center justify-center mb-4">
            <Award className="mr-3 h-8 w-8 text-yellow-300" />
            Daily Streak
          </DialogTitle>
        </DialogHeader>
        <div className="pt-2 pb-6 px-6 space-y-6 text-center">

            <div className="text-center space-y-2 pb-6">
              <div className="flex items-center justify-center space-x-2 mt-1">
                  <Leaf className="h-10 w-10 text-accent animate-pulse" data-ai-hint="butterfly monarch" />
                  <span id="streak-modal-number" className="text-7xl font-bold text-primary">
                  {animatedStreak}
                  </span>
              </div>
              <p className="text-base text-muted-foreground">{animatedStreak === 1 ? 'day' : 'days'} in a row!</p>
            </div>

            <div className="flex justify-around items-center pb-4">
            {lastFiveDays.map(({ dateString, dayAbbrev }) => {
                const isActive = streakDates.includes(dateString);
                // Check if the date string is today or in the past relative to the current local "today"
                const isPastOrToday = new Date(dateString) <= new Date(new Date().toDateString());
                
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
        <DialogFooter className="px-6 pb-6 bg-muted/30 mx-auto flex justify-center items-center">
          <p className="text-sm text-muted-foreground">Keep on flyin' high! 🦋</p>
          <img src="https://res.cloudinary.com/djrhjkkvm/image/upload/v1749691114/Cartoons/catti-the-caterpillar_b9skmk.png" className="w-12" />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
