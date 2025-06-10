'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Timer } from 'lucide-react';

// Challenge dates
const CHALLENGE_START_DATE = new Date(new Date().getFullYear(), 5, 21); // June 21st
const CHALLENGE_END_DATE = new Date(new Date().getFullYear(), 9, 31, 23, 59, 59); // October 31st, end of day

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [challengeStatus, setChallengeStatus] = useState<'pending' | 'active' | 'ended'>('pending');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      let difference;
      let status: 'pending' | 'active' | 'ended';

      if (now < CHALLENGE_START_DATE) {
        difference = CHALLENGE_START_DATE.getTime() - now.getTime();
        status = 'pending';
      } else if (now <= CHALLENGE_END_DATE) {
        difference = CHALLENGE_END_DATE.getTime() - now.getTime();
        status = 'active';
      } else {
        difference = 0;
        status = 'ended';
      }
      setChallengeStatus(status);

      if (difference > 0) {
        return {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        };
      }
      return null;
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const renderTimeValue = (value: number, unit: string) => (
    <div className="flex flex-col items-center">
      <span className="text-3xl md:text-4xl font-bold text-primary">{String(value).padStart(2, '0')}</span>
      <span className="text-xs uppercase text-muted-foreground">{unit}</span>
    </div>
  );

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex items-center">
          <Timer className="mr-2 h-6 w-6 text-primary" />
          {challengeStatus === 'pending' && 'Challenge Starts In:'}
          {challengeStatus === 'active' && 'Challenge Ends In:'}
          {challengeStatus === 'ended' && 'Challenge Has Ended'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {challengeStatus === 'ended' ? (
          <p className="text-xl text-center text-muted-foreground">Thank you for participating! See you next year.</p>
        ) : timeLeft ? (
          <div className="grid grid-cols-4 gap-2 md:gap-4 text-center">
            {renderTimeValue(timeLeft.days, 'Days')}
            {renderTimeValue(timeLeft.hours, 'Hours')}
            {renderTimeValue(timeLeft.minutes, 'Minutes')}
            {renderTimeValue(timeLeft.seconds, 'Seconds')}
          </div>
        ) : (
          <p className="text-xl text-center text-muted-foreground">Loading timer...</p>
        )}
         <p className="text-sm text-center text-muted-foreground mt-4">
            Challenge runs from June 21st to October 31st, {new Date().getFullYear()}.
          </p>
      </CardContent>
    </Card>
  );
}
