
'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { updateUserProfile, incrementParticipantCount } from '@/lib/firebaseService';
import type { ActivityStatus, UserProfile } from '@/types';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Zap, TrendingUp, Target, Edit3 } from 'lucide-react';

const activityGoalsMap: Record<ActivityStatus, { label: string; goals: string[] }> = {
  Sedentary: { label: 'Sedentary (Mostly sitting, little to no exercise)', goals: ['25,000 steps', '75,000 steps', '200,000 steps', 'Custom'] },
  'Moderately Active': { label: 'Moderately Active (Light exercise / walking a few times a week)', goals: ['50,000 steps', '100,000 steps', '300,000 steps', 'Custom'] },
  'Very Active': { label: 'Very Active (Regular vigorous exercise / active job)', goals: ['100,000 steps', '300,000 steps', '500,000 steps', 'Custom'] },
};

const profileSetupSchema = z.object({
  displayName: z.string().min(2, "Display name is required").max(50),
  activityStatus: z.enum(['Sedentary', 'Moderately Active', 'Very Active'], {
    required_error: 'Please select your activity status.',
  }),
  stepGoalOption: z.string({ required_error: 'Please select a step goal.' }),
  customStepGoal: z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? undefined : Number(String(val).replace(/,/g, ''))),
    z.number().positive('Custom goal must be a positive number.').optional()
  ),
}).refine(data => {
  if (data.stepGoalOption === 'Custom') {
    return data.customStepGoal !== undefined && data.customStepGoal > 0;
  }
  return true;
}, {
  message: 'Custom step goal is required when "Custom" is selected.',
  path: ['customStepGoal'],
});

type ProfileSetupFormInputs = z.infer<typeof profileSetupSchema>;

interface ProfileSetupFormProps {
  isUpdate?: boolean; // To indicate if it's an update or initial setup
}

export default function ProfileSetupForm({ isUpdate = false }: ProfileSetupFormProps) {
  const { user, userProfile, fetchUserProfile, setUserProfileState } = useAuth();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<ProfileSetupFormInputs>({
    resolver: zodResolver(profileSetupSchema),
    defaultValues: {
      displayName: userProfile?.displayName || user?.email?.split('@')[0] || '',
      activityStatus: userProfile?.activityStatus || undefined,
      stepGoalOption: userProfile?.stepGoal ? 
        (activityGoalsMap[userProfile.activityStatus!]?.goals.includes(`${userProfile.stepGoal.toLocaleString()} steps`) ? 
          `${userProfile.stepGoal.toLocaleString()} steps` : 'Custom') 
        : undefined,
      customStepGoal: userProfile?.stepGoal && !activityGoalsMap[userProfile.activityStatus!]?.goals.includes(`${userProfile.stepGoal.toLocaleString()} steps`) ? userProfile.stepGoal : undefined,
    },
  });

  const selectedActivityStatus = watch('activityStatus');
  const selectedStepGoalOption = watch('stepGoalOption');

  useEffect(() => {
    if (userProfile) {
      setValue('displayName', userProfile.displayName || user?.email?.split('@')[0] || '');
      if (userProfile.activityStatus) {
        setValue('activityStatus', userProfile.activityStatus);
        if (userProfile.stepGoal) {
          const goalStr = `${userProfile.stepGoal.toLocaleString()} steps`;
          const currentGoals = activityGoalsMap[userProfile.activityStatus]?.goals || [];
          if (currentGoals.includes(goalStr)) {
            setValue('stepGoalOption', goalStr);
          } else {
            setValue('stepGoalOption', 'Custom');
            setValue('customStepGoal', userProfile.stepGoal);
          }
        }
      }
    }
  }, [userProfile, setValue, user]);


  const onSubmit: SubmitHandler<ProfileSetupFormInputs> = async (data) => {
    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in.', variant: 'destructive' });
      return;
    }
    setLoading(true);

    let finalStepGoal: number;
    if (data.stepGoalOption === 'Custom') {
      finalStepGoal = data.customStepGoal!;
    } else {
      finalStepGoal = parseInt(data.stepGoalOption.replace(/,/g, '').replace(' steps', ''));
    }

    const profileUpdateData: Partial<UserProfile> = {
      displayName: data.displayName,
      activityStatus: data.activityStatus,
      stepGoal: finalStepGoal,
      profileComplete: true,
      currentSteps: userProfile?.currentSteps ?? 0, // Ensure currentSteps is included
    };

    try {
      await updateUserProfile(user.uid, profileUpdateData);
      // If it's initial setup and profile wasn't complete, increment participant count
      if (!isUpdate && !userProfile?.profileComplete) {
        await incrementParticipantCount();
      }
      // Update local auth context state
      // Ensure all necessary fields for UserProfile are present
      const updatedProfileData = { 
        ...userProfile, // spread existing profile first
        ...profileUpdateData, // then updated fields
        uid: user.uid, // ensure uid
        email: user.email, // ensure email
        // ensure inviteLink is preserved or initialized
        inviteLink: userProfile?.inviteLink || `${process.env.NEXT_PUBLIC_APP_URL || ''}/profile/${user.uid}`,
      } as UserProfile; // Cast to UserProfile to satisfy type, assuming all fields are now compliant

      setUserProfileState(updatedProfileData);


      toast({ title: 'Profile Updated!', description: 'Your Monarch Miles profile is ready.' });
      router.push('/'); // Redirect to dashboard
    } catch (error) {
      console.error('Profile update error:', error);
      toast({ title: 'Update Failed', description: 'Could not update profile. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="font-headline text-3xl flex items-center">
          {isUpdate ? <Edit3 className="mr-2 h-7 w-7 text-primary" /> : <Zap className="mr-2 h-7 w-7 text-primary" />}
          {isUpdate ? 'Update Your Profile' : 'Set Up Your Profile'}
        </CardTitle>
        <CardDescription>
          {isUpdate ? 'Modify your details for the Stepping For Monarchs challenge.' : 'Tell us a bit about yourself to get started with the Stepping For Monarchs challenge.'}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-8">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Controller
              name="displayName"
              control={control}
              render={({ field }) => <Input id="displayName" placeholder="Your Name or Nickname" {...field} />}
            />
            {errors.displayName && <p className="text-sm text-destructive">{errors.displayName.message}</p>}
          </div>

          <div className="space-y-3">
            <Label className="text-base font-medium">Activity Status <TrendingUp className="inline h-5 w-5 text-primary" /></Label>
            <Controller
              name="activityStatus"
              control={control}
              render={({ field }) => (
                <RadioGroup
                  onValueChange={(value) => {
                    field.onChange(value as ActivityStatus);
                    setValue('stepGoalOption', undefined); // Reset step goal when activity status changes
                    setValue('customStepGoal', undefined);
                  }}
                  value={field.value}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                  {Object.entries(activityGoalsMap).map(([status, {label}]) => (
                    <Label
                      key={status}
                      htmlFor={status}
                      className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"
                    >
                      <RadioGroupItem value={status} id={status} className="sr-only" />
                       <span className="font-semibold text-center">{status}</span>
                       <span className="text-xs text-muted-foreground mt-1 text-center">{label}</span>
                    </Label>
                  ))}
                </RadioGroup>
              )}
            />
            {errors.activityStatus && <p className="text-sm text-destructive">{errors.activityStatus.message}</p>}
          </div>

          {selectedActivityStatus && (
            <div className="space-y-2">
              <Label htmlFor="stepGoalOption">Step Goal <Target className="inline h-5 w-5 text-primary" /></Label>
              <Controller
                name="stepGoalOption"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="stepGoalOption">
                      <SelectValue placeholder="Select your step goal" />
                    </SelectTrigger>
                    <SelectContent>
                      {(activityGoalsMap[selectedActivityStatus]?.goals || []).map(goal => (
                        <SelectItem key={goal} value={goal}>{goal}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.stepGoalOption && <p className="text-sm text-destructive">{errors.stepGoalOption.message}</p>}
            </div>
          )}

          {selectedStepGoalOption === 'Custom' && (
            <div className="space-y-2">
              <Label htmlFor="customStepGoal">Custom Step Goal</Label>
               <Controller
                name="customStepGoal"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="customStepGoal" 
                    type="number" 
                    placeholder="Enter your custom goal (e.g., 150000)" 
                    value={field.value === undefined ? '' : String(field.value)}
                    onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                  />
                )}
              />
              {errors.customStepGoal && <p className="text-sm text-destructive">{errors.customStepGoal.message}</p>}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (isUpdate ? 'Updating...' : 'Saving...') : (<><CheckCircle className="mr-2 h-5 w-5" /> {isUpdate ? 'Update Profile' : 'Save Profile & Start Challenge'}</>)}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
