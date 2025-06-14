
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { createUserWithEmailAndPassword, type AuthError } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { incrementParticipantCount } from '@/lib/firebaseService';
import type { ActivityStatus, UserProfile } from '@/types';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, UserPlus, User as UserIcon, CheckCircle, Zap, TrendingUp, Target, Globe } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Separator } from '@/components/ui/separator';


const activityGoalsMap: Record<ActivityStatus, { label: string; goals: string[] }> = {
  Sedentary: { label: 'Mostly sitting, little to no exercise', goals: ['25,000 steps', '75,000 steps', '200,000 steps', 'Custom'] },
  'Moderately Active': { label: 'Light exercise / walking a few times a week', goals: ['50,000 steps', '100,000 steps', '300,000 steps', 'Custom'] },
  'Very Active': { label: 'Regular vigorous exercise / active job', goals: ['100,000 steps', '300,000 steps', '500,000 steps', 'Custom'] },
};

// A curated list of common IANA timezones (consistent with ProfileSetupForm)
const commonTimezones = [
  { value: "America/New_York", label: "America/New_York (Eastern Time)" },
  { value: "America/Chicago", label: "America/Chicago (Central Time)" },
  { value: "America/Denver", label: "America/Denver (Mountain Time)" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles (Pacific Time)" },
  { value: "Europe/London", label: "Europe/London" },
  { value: "Europe/Paris", label: "Europe/Paris" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo" },
  { value: "Australia/Sydney", label: "Australia/Sydney" },
  { value: "UTC", label: "UTC" },
];

const signupSchema = z.object({
  displayName: z.string().trim().min(2, { message: 'Display name must be at least 2 characters' }).max(50, { message: 'Display name cannot exceed 50 characters' }),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  activityStatus: z.enum(['Sedentary', 'Moderately Active', 'Very Active'], {
    required_error: 'Please select your activity status.',
  }),
  stepGoalOption: z.string({ required_error: 'Please select a step goal.' }),
  customStepGoal: z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? undefined : Number(String(val).replace(/,/g, ''))),
    z.number().positive('Custom goal must be a positive number.').optional()
  ),
  timezone: z.string().optional().nullable(),
}).refine(data => {
  if (data.stepGoalOption === 'Custom') {
    return data.customStepGoal !== undefined && data.customStepGoal > 0;
  }
  return true;
}, {
  message: 'Custom step goal is required when "Custom" is selected.',
  path: ['customStepGoal'],
});

type SignupFormInputs = z.infer<typeof signupSchema>;

interface SignupFormProps {
    invitedTeamId?: string | null; // Keep prop for potential future use, but form won't use it now
}

export default function SignupForm({ invitedTeamId }: SignupFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { fetchUserProfile } = useAuth(); 

  const [browserTimezone, setBrowserTimezone] = useState<string | null>(null);

  useEffect(() => {
    try {
      setBrowserTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    } catch (e) {
      console.warn("Could not determine browser timezone for signup form.", e);
    }
  }, []);
  
  const { control, handleSubmit, watch, setValue, formState: { errors }, trigger } = useForm<SignupFormInputs>({
    resolver: zodResolver(signupSchema),
    mode: 'onChange',
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      activityStatus: undefined,
      stepGoalOption: undefined,
      customStepGoal: undefined,
      timezone: browserTimezone || null,
    },
  });

  useEffect(() => {
    if (browserTimezone && !watch('timezone')) {
        setValue('timezone', browserTimezone);
    }
  }, [browserTimezone, setValue, watch]);

  const selectedActivityStatus = watch('activityStatus');
  const selectedStepGoalOption = watch('stepGoalOption');

  const handleNextStep = async () => {
    let fieldsToValidate: (keyof SignupFormInputs)[] = [];
    if (currentStep === 1) {
      fieldsToValidate = ['displayName', 'email', 'password'];
    } 
    // No Step 2 validation here, submission happens on Step 2
    
    const isValid = fieldsToValidate.length > 0 ? await trigger(fieldsToValidate) : true;
    if (isValid) {
      setCurrentStep(prev => prev + 1);
    } else {
        toast({
            title: "Hold Up!",
            description: "Please fill out all required fields correctly before continuing.",
            variant: "destructive",
        });
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const onSubmit: SubmitHandler<SignupFormInputs> = async (data) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const firebaseUser = userCredential.user;
      
      let finalStepGoal: number;
      if (data.stepGoalOption === 'Custom') {
        finalStepGoal = data.customStepGoal!;
      } else {
        finalStepGoal = parseInt(data.stepGoalOption.replace(/,/g, '').replace(' steps', ''));
      }

      const fullProfileData: UserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: data.displayName.trim(), 
        activityStatus: data.activityStatus,
        stepGoal: finalStepGoal,
        timezone: data.timezone || browserTimezone || null,
        currentSteps: 0,
        profileComplete: true,
        inviteLink: `${process.env.NEXT_PUBLIC_APP_URL || ''}/profile/${firebaseUser.uid}`,
        badgesEarned: [], // No team badge awarded at signup now
        teamId: null,     // Team info is null at signup
        teamName: null,   // Team info is null at signup
        currentStreak: 0,
        lastStreakLoginDate: null,
        lastLoginTimestamp: null,
        chrysalisCoinDates: [],
        activeChrysalisThemeId: null,
        photoURL: firebaseUser.photoURL,
        dashboardLayout: { dashboardOrder: [], communityOrder: [] },
      };
      
      await setDoc(doc(db, "users", firebaseUser.uid), fullProfileData);
      await incrementParticipantCount();
      
      toast({ title: 'Account Created & Profile Setup!', description: "Welcome to the Butterfly Steps challenge!" });
      
      await fetchUserProfile(firebaseUser.uid, true); 
      
    } catch (error) {
      const authError = error as AuthError;
      console.error('Signup error:', authError);
      let description = authError.message || 'An unexpected error occurred. Please try again.';
      if (authError.code === 'auth/email-already-in-use') {
        description = 'This email address is already registered. Please use a different email or log in.';
      }
      toast({
        title: 'Signup Failed',
        description: description,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            <h2 className="text-xl font-semibold font-headline text-primary border-b pb-2 mb-6">Step 1: Account Information</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input id="displayName" type="text" placeholder="Your Name or Nickname" {...control.register('displayName')} className="pl-10" />
                </div>
                {errors.displayName && <p className="text-sm text-destructive">{errors.displayName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="you@example.com" {...control.register('email')} className="pl-10" />
                </div>
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input id="password" type="password" placeholder="•••••••• (min. 6 characters)" {...control.register('password')} className="pl-10" />
                </div>
                {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
              </div>
            </div>
          </>
        );
      case 2:
        return (
          <>
            <h2 className="text-xl font-semibold font-headline text-primary border-b pb-2 mb-6">Step 2: Challenge Setup</h2>
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-base font-medium">Activity Status <TrendingUp className="inline h-5 w-5 text-primary" /></Label>
                <Controller
                  name="activityStatus"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup
                      onValueChange={(value) => {
                        field.onChange(value as ActivityStatus);
                        setValue('stepGoalOption', undefined); 
                        setValue('customStepGoal', undefined);
                      }}
                      value={field.value}
                      className="grid grid-cols-1 md:grid-cols-3 gap-4"
                    >
                      {Object.entries(activityGoalsMap).map(([status, {label}]) => (
                        <Label
                          key={status}
                          htmlFor={`signup-${status}`}
                          className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary cursor-pointer"
                        >
                          <RadioGroupItem value={status} id={`signup-${status}`} className="sr-only" />
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
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          if (value !== 'Custom') {
                            setValue('customStepGoal', undefined);
                          }
                        }} 
                        value={field.value}
                      >
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
                  <Label htmlFor="customStepGoal">Custom Step Goal (enter numbers only)</Label>
                    <Controller
                    name="customStepGoal"
                    control={control}
                    render={({ field }) => (
                      <Input 
                        id="customStepGoal" 
                        type="number" 
                        placeholder="e.g., 150000" 
                        value={field.value === undefined ? '' : String(field.value)}
                        onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value.replace(/,/g, '')))}
                      />
                    )}
                  />
                  {errors.customStepGoal && <p className="text-sm text-destructive">{errors.customStepGoal.message}</p>}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone <Globe className="inline h-5 w-5 text-primary" /></Label>
                <Controller
                    name="timezone"
                    control={control}
                    render={({ field }) => (
                        <Select
                            onValueChange={(value) => {
                                field.onChange(value === "auto" ? browserTimezone : value);
                            }}
                            value={field.value || "auto"} 
                        >
                            <SelectTrigger id="timezone">
                                <SelectValue placeholder="Select your timezone" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="auto">Auto-detect ({browserTimezone || "Unavailable"})</SelectItem>
                                {commonTimezones.map(tz => (
                                    <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                />
                {errors.timezone && <p className="text-sm text-destructive">{errors.timezone.message}</p>}
                <p className="text-xs text-muted-foreground">
                    This helps us calculate your daily rewards. If unsure, "Auto-detect" will use your browser's setting.
                </p>
              </div>
            </div>
          </>
        );
      default:
        return null;
    }
  };


  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="min-h-[350px]"> 
        {renderStepContent()}
      </div>

      <Separator className="my-6" />

      <div className="flex flex-col space-y-3 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
        <div>
            {currentStep > 1 && (
            <Button type="button" variant="outline" onClick={handlePrevStep} disabled={loading} className="w-full sm:w-auto">
                Back
            </Button>
            )}
        </div>
        <div>
            {currentStep < 2 ? ( // Only 2 steps now
            <Button type="button" onClick={handleNextStep} disabled={loading} className="w-full sm:w-auto">
                Continue
            </Button>
            ) : (
            <Button type="submit" className="w-full sm:w-auto" disabled={loading}>
                {loading ? 'Creating Account & Profile...' : (<><UserPlus className="mr-2 h-5 w-5" /> Sign Up & Start Challenge</>)}
            </Button>
            )}
        </div>
      </div>

      {currentStep === 1 && (
        <p className="text-center text-sm text-muted-foreground pt-4">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </p>
      )}
    </form>
  );
}

