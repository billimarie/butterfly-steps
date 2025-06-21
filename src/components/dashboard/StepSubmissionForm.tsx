
'use client';

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { submitSteps, getTodaysDateClientLocal } from '@/lib/firebaseService'; // Import getTodaysDateClientLocal
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Footprints } from 'lucide-react';
import type { StepSubmissionResult } from '@/types';

const stepSubmissionSchema = z.object({
  steps: z.preprocess(
    (val) => (val === "" ? undefined : Number(String(val).replace(/,/g, ''))),
    z.number().int().positive({ message: 'Steps must be a positive number.' }).min(1, 'Enter at least 1 step.')
  ),
});

type StepSubmissionFormInputs = z.infer<typeof stepSubmissionSchema>;

interface StepSubmissionFormProps {
  onStepSubmit?: () => void | Promise<void>;
  isModalVersion?: boolean;
}

export default function StepSubmissionForm({ onStepSubmit, isModalVersion = false }: StepSubmissionFormProps) {
  const { user, userProfile, setShowNewBadgeModal, collectDailyChrysalisCoin } = useAuth(); // Removed setShowDailyGoalMetModal, setCanCollectTodaysChrysalisCoin
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<StepSubmissionFormInputs>({
    resolver: zodResolver(stepSubmissionSchema),
  });

  const onSubmit: SubmitHandler<StepSubmissionFormInputs> = async (data) => {
    if (!user || !userProfile || !userProfile.profileComplete) {
      toast({ title: 'Profile Incomplete', description: 'Please complete your profile to submit steps.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const result: StepSubmissionResult = await submitSteps(user.uid, data.steps);
      // console.log('[StepSubmissionForm] Result from submitSteps:', result);

      if (result.dailyGoalAchieved) {
        // console.log('[StepSubmissionForm] Daily goal achieved! Checking if coin already collected.');
        const today = getTodaysDateClientLocal();
        const coinAlreadyCollectedForToday = userProfile.chrysalisCoinDates?.includes(today) ?? false;

        if (!coinAlreadyCollectedForToday) {
          // console.log('[StepSubmissionForm] Coin not yet collected for today. Calling collectDailyChrysalisCoin.');
          await collectDailyChrysalisCoin(); // This will trigger the ChrysalisJourneyModal (gamified view)
        } else {
          // console.log('[StepSubmissionForm] Coin already collected for today. Toasting.');
          toast({ title: 'Daily Goal Met!', description: "Great job! You've already collected today's Chrysalis Coin." });
        }
      } else {
        toast({ title: 'Steps Submitted!', description: `${data.steps.toLocaleString()} steps added to your total.` });
      }

      if (result.newlyAwardedBadges && result.newlyAwardedBadges.length > 0) {
        setShowNewBadgeModal(result.newlyAwardedBadges[0]);
         if (result.newlyAwardedBadges.length > 1) {
            for (let i = 1; i < result.newlyAwardedBadges.length; i++) {
                const badge = result.newlyAwardedBadges[i];
                 toast({
                    title: 'Another Badge Unlocked!',
                    description: `You've also earned the "${badge.name}" badge! View it on your profile.`,
                    duration: 5000,
                 });
            }
        }
      }

      reset();
      if (onStepSubmit) {
        await onStepSubmit();
      }
    } catch (error) {
      // console.error('Step submission error:', error);
      toast({ title: 'Submission Failed', description: (error as Error).message || 'Could not submit steps. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (!isModalVersion && !userProfile?.profileComplete) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Log Your Steps</CardTitle>
          <CardDescription>Complete your profile to start logging steps for the Monarchs!</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const formContent = (
    <>
      <div className="space-y-2">
        <Label htmlFor="steps">Number of Steps</Label>
        <div className="relative">
            <Footprints className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="steps"
              type="number"
              placeholder="e.g., 5000"
              {...register('steps')}
              className="pl-10"
            />
        </div>
        {errors.steps && <p className="text-sm text-destructive">{errors.steps.message}</p>}
      </div>
      <p className="text-xs text-muted-foreground">
        You can submit steps multiple times. They will be added to your total.
      </p>
    </>
  );

  const formFooter = (
     <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Submitting...' : 'Submit Steps'}
      </Button>
  );

  if (isModalVersion) {
    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
        {formContent}
        <div className="pt-2">
         {formFooter}
        </div>
      </form>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex items-center">
          <PlusCircle className="mr-2 h-6 w-6 text-primary" />
          Log Your Steps
        </CardTitle>
        <CardDescription>Add the steps you've taken today or recently.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {formContent}
        </CardContent>
        <CardFooter>
          {formFooter}
        </CardFooter>
      </form>
    </Card>
  );
}
