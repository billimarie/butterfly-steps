
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Leaf, Check, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';

const dayAbbreviations = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function StreakDisplay() {
  const { userProfile } = useAuth();
  const [streakDates, setStreakDates] = useState<string[]>([]);
  const [lastFiveDays, setLastFiveDays] = useState<{ dateString: string; dayAbbrev: string }[]>([]);
  const [animatedStreak, setAnimatedStreak] = useState(userProfile?.currentStreak || 0);

  useEffect(() => {
    if (userProfile?.currentStreak !== animatedStreak) {
        // Trigger animation for streak number change
        const oldStreakEl = document.getElementById('streak-number');
        if (oldStreakEl) {
            oldStreakEl.classList.remove('animate-streak-update');
            void oldStreakEl.offsetWidth; // Trigger reflow
            oldStreakEl.classList.add('animate-streak-update');
        }
        setAnimatedStreak(userProfile?.currentStreak || 0);
    }
  }, [userProfile?.currentStreak, animatedStreak]);


  useEffect(() => {
    if (userProfile && userProfile.lastStreakLoginDate && userProfile.currentStreak > 0) {
      const currentStreak = userProfile.currentStreak;
      const lastLogin = new Date(userProfile.lastStreakLoginDate + 'T00:00:00Z'); // Ensure UTC context for date part

      const dates: string[] = [];
      for (let i = 0; i < currentStreak; i++) {
        const d = new Date(lastLogin);
        d.setUTCDate(lastLogin.getUTCDate() - i);
        dates.push(d.toISOString().split('T')[0]);
      }
      setStreakDates(dates.reverse()); // Oldest to newest
    } else {
      setStreakDates([]);
    }

    const today = new Date();
    const fiveDays: { dateString: string; dayAbbrev: string }[] = [];
    for (let i = 4; i >= 0; i--) { // Today is the last element
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      fiveDays.push({
        dateString: d.toISOString().split('T')[0],
        dayAbbrev: dayAbbreviations[d.getDay()],
      });
    }
    setLastFiveDays(fiveDays);

  }, [userProfile]);

  if (!userProfile || !userProfile.profileComplete) {
    return null; // Don't show if profile is incomplete or not loaded
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex items-center">
          <CalendarDays className="mr-2 h-6 w-6 text-primary" />
          Daily Login Streak
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-around items-center text-center">
          {lastFiveDays.map(({ dateString, dayAbbrev }, index) => {
            const isActive = streakDates.includes(dateString);
            const isFuture = new Date(dateString + 'T00:00:00Z') > new Date(new Date().toISOString().split('T')[0] + 'T00:00:00Z');
            
            return (
              <div key={dateString} className="flex flex-col items-center space-y-1">
                <span className="text-xs text-muted-foreground">{dayAbbrev}</span>
                <div
                  className={cn(
                    "h-10 w-10 rounded-full border-2 flex items-center justify-center transition-all duration-300",
                    isActive ? "bg-green-100 border-green-400" : "bg-muted/30 border-muted",
                    isFuture ? "opacity-50" : ""
                  )}
                >
                  {isActive && !isFuture && (
                    <Check className="h-6 w-6 text-green-500 animate-checkmark-appear" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">You've logged in for</p>
          <div className="flex items-center justify-center space-x-2 mt-1">
            <Leaf className="h-8 w-8 text-primary animate-pulse" data-ai-hint="butterfly monarch" />
            <span id="streak-number" className="text-4xl font-bold text-accent">
              {animatedStreak}
            </span>
            <span className="text-2xl text-muted-foreground">
              {animatedStreak === 1 ? 'day' : 'days'} in a row!
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
