'use client';

import type { UserProfile } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Footprints, Target } from 'lucide-react';

interface UserProgressCardProps {
  userProfile: UserProfile | null;
}

export default function UserProgressCard({ userProfile }: UserProgressCardProps) {
  if (!userProfile || !userProfile.profileComplete) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl flex items-center">
            <Footprints className="mr-2 h-6 w-6 text-primary" />
            Your Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Complete your profile to track your steps!</p>
        </CardContent>
      </Card>
    );
  }

  const { currentSteps, stepGoal } = userProfile;
  const progressPercentage = stepGoal ? (currentSteps / stepGoal) * 100 : 0;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex items-center">
          <Footprints className="mr-2 h-6 w-6 text-primary" />
          Your Journey
        </CardTitle>
        <CardDescription>
          You've taken <span className="font-bold text-accent">{currentSteps.toLocaleString()}</span> steps so far.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {stepGoal ? (
          <>
            <div className="flex justify-between items-baseline">
                <p className="text-sm text-muted-foreground flex items-center">
                    <Target className="mr-1 h-4 w-4" /> Goal: {stepGoal.toLocaleString()} steps
                </p>
                <p className="text-sm font-semibold text-primary">{Math.min(100, Math.round(progressPercentage))}%</p>
            </div>
            <Progress value={progressPercentage} className="w-full h-3" />
            {currentSteps >= stepGoal && (
                 <p className="text-center text-green-600 font-semibold mt-2">Congratulations! You've reached your goal!</p>
            )}
          </>
        ) : (
          <p className="text-muted-foreground">Set a step goal in your profile to see progress.</p>
        )}
      </CardContent>
    </Card>
  );
}
