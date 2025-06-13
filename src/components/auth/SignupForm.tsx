
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
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { createTeam, joinTeam, incrementParticipantCount, getUserProfile } from '@/lib/firebaseService';
import type { ActivityStatus, UserProfile, TeamActionResult } from '@/types';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, UserPlus, User as UserIcon, CheckCircle, Zap, TrendingUp, Target, Users, PlusCircle, LogIn } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Separator } from '@/components/ui/separator';
// ToastAction removed
import type { BadgeData, BadgeId } from '@/lib/badges';
// getBadgeDataById removed as not directly used here for modal data


const activityGoalsMap: Record<ActivityStatus, { label: string; goals: string[] }> = {
  Sedentary: { label: 'Mostly sitting, little to no exercise', goals: ['25,000 steps', '75,000 steps', '200,000 steps', 'Custom'] },
  'Moderately Active': { label: 'Light exercise / walking a few times a week', goals: ['50,000 steps', '100,000 steps', '300,000 steps', 'Custom'] },
  'Very Active': { label: 'Regular vigorous exercise / active job', goals: ['100,000 steps', '300,000 steps', '500,000 steps', 'Custom'] },
};

const signupSchema = z.object({
  displayName: z.string().min(2, { message: 'Display name must be at least 2 characters' }).max(50),
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
  teamAction: z.enum(['none', 'create', 'join']).default('none'),
  newTeamName: z.string().min(3, "Team name must be at least 3 characters").max(50).optional(),
  joinTeamId: z.string().min(5, "Team ID seems too short").optional(),
}).refine(data => {
  if (data.stepGoalOption === 'Custom') {
    return data.customStepGoal !== undefined && data.customStepGoal > 0;
  }
  return true;
}, {
  message: 'Custom step goal is required when "Custom" is selected.',
  path: ['customStepGoal'],
}).refine(data => {
    if (data.teamAction === 'create') return !!data.newTeamName;
    return true;
}, { message: 'Team name is required to create a team.', path: ['newTeamName']})
.refine(data => {
    if (data.teamAction === 'join') return !!data.joinTeamId;
    return true;
}, { message: 'Team ID is required to join a team.', path: ['joinTeamId']});

type SignupFormInputs = z.infer<typeof signupSchema>;

interface SignupFormProps {
    invitedTeamId?: string | null;
}

export default function SignupForm({ invitedTeamId }: SignupFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { fetchUserProfile, setShowNewBadgeModal } = useAuth(); 

  const [invitedTeamDetailsLoading, setInvitedTeamDetailsLoading] = useState(false);
  const [fetchedInvitedTeamName, setFetchedInvitedTeamName] = useState<string | null>(null);
  const [fetchedInvitedTeamCreatorDisplayName, setFetchedInvitedTeamCreatorDisplayName] = useState<string | null>(null);
  
  const { control, handleSubmit, watch, setValue, formState: { errors }, trigger } = useForm<SignupFormInputs>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      activityStatus: undefined,
      stepGoalOption: undefined,
      customStepGoal: undefined,
      teamAction: invitedTeamId ? 'join' : 'none',
      newTeamName: '',
      joinTeamId: invitedTeamId || '',
    },
  });

  const selectedActivityStatus = watch('activityStatus');
  const selectedStepGoalOption = watch('stepGoalOption');
  const selectedTeamAction = watch('teamAction');
  const currentJoinTeamIdValue = watch('joinTeamId');


  const fetchInvitedTeamDetails = useCallback(async (teamIdToFetch: string) => {
    if (!teamIdToFetch) return;
    setInvitedTeamDetailsLoading(true);
    try {
      const teamDocRef = doc(db, 'teams', teamIdToFetch);
      const teamSnap = await getDoc(teamDocRef);
      if (teamSnap.exists()) {
        const teamData = teamSnap.data();
        setFetchedInvitedTeamName(teamData.name);
        if (teamData.creatorUid) {
          const creatorProfile = await getUserProfile(teamData.creatorUid);
          setFetchedInvitedTeamCreatorDisplayName(creatorProfile?.displayName || 'Unknown Creator');
        }
      } else {
        toast({ title: "Invite Invalid", description: "The team ID from the invite link could not be found. You can still join manually.", variant: "destructive" });
        setFetchedInvitedTeamName(null);
        setFetchedInvitedTeamCreatorDisplayName(null);
        setValue('teamAction', 'none'); 
        setValue('joinTeamId', '');
      }
    } catch (error) {
      console.error("Error fetching invited team details:", error);
      toast({ title: "Error", description: "Could not fetch details for the invited team.", variant: "destructive" });
      setFetchedInvitedTeamName(null);
      setFetchedInvitedTeamCreatorDisplayName(null);
    } finally {
      setInvitedTeamDetailsLoading(false);
    }
  }, [toast, setValue]);

  useEffect(() => {
    if (invitedTeamId) {
      setValue('teamAction', 'join');
      setValue('joinTeamId', invitedTeamId);
      fetchInvitedTeamDetails(invitedTeamId);
    }
  }, [invitedTeamId, setValue, fetchInvitedTeamDetails]);

  const handleNextStep = async () => {
    let fieldsToValidate: (keyof SignupFormInputs)[] = [];
    if (currentStep === 1) {
      fieldsToValidate = ['displayName', 'email', 'password'];
    } else if (currentStep === 2) {
      fieldsToValidate = ['activityStatus', 'stepGoalOption'];
      if (watch('stepGoalOption') === 'Custom') {
        fieldsToValidate.push('customStepGoal');
      }
    }

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
        displayName: data.displayName,
        activityStatus: data.activityStatus,
        stepGoal: finalStepGoal,
        currentSteps: 0,
        profileComplete: true,
        inviteLink: `${process.env.NEXT_PUBLIC_APP_URL || ''}/profile/${firebaseUser.uid}`,
        badgesEarned: [],
        teamId: null,
        teamName: null,
        currentStreak: 0,
        lastStreakLoginDate: null,
        lastLoginTimestamp: null,
      };

      let awardedTeamBadgeFromAction: BadgeData | null | undefined = undefined;

      if (data.teamAction === 'create' && data.newTeamName) {
        const teamResult: TeamActionResult = await createTeam(firebaseUser.uid, data.newTeamName, 0);
        fullProfileData.teamId = teamResult.teamId;
        fullProfileData.teamName = teamResult.teamName;
        awardedTeamBadgeFromAction = teamResult.awardedTeamBadge;
      } else if (data.teamAction === 'join' && data.joinTeamId) {
        const teamResult: TeamActionResult | null = await joinTeam(firebaseUser.uid, data.joinTeamId, 0);
        if (teamResult) {
          fullProfileData.teamId = teamResult.teamId;
          fullProfileData.teamName = teamResult.teamName;
          awardedTeamBadgeFromAction = teamResult.awardedTeamBadge;
        } else {
          toast({ title: 'Failed to Join Team', description: 'Please check the Team ID and try again, or the team may no longer exist.', variant: 'destructive'});
          setLoading(false);
          return;
        }
      }

      if (awardedTeamBadgeFromAction && !fullProfileData.badgesEarned?.includes(awardedTeamBadgeFromAction.id as BadgeId)) {
        fullProfileData.badgesEarned = [...(fullProfileData.badgesEarned || []), awardedTeamBadgeFromAction.id as BadgeId];
      }
      
      await setDoc(doc(db, "users", firebaseUser.uid), fullProfileData);
      await incrementParticipantCount();
      
      toast({ title: 'Account Created & Profile Setup!', description: "Welcome to the Butterfly Steps challenge!" });

      if (awardedTeamBadgeFromAction) {
         setShowNewBadgeModal(awardedTeamBadgeFromAction);
      }
      
      await fetchUserProfile(firebaseUser.uid, true); 
      
    } catch (error) {
      const authError = error as AuthError;
      console.error('Signup error:', authError);
      toast({
        title: 'Signup Failed',
        description: authError.message || 'An unexpected error occurred. Please try again.',
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
            </div>
          </>
        );
      case 3:
        return (
          <>
            <h2 className="text-xl font-semibold font-headline text-primary border-b pb-2 mb-6">Step 3: Join a Team (Optional)</h2>
            <div className="space-y-4">
                <Controller
                    name="teamAction"
                    control={control}
                    render={({ field }) => (
                    <RadioGroup
                        onValueChange={(newTeamActionValue) => {
                        const action = newTeamActionValue as 'none' | 'create' | 'join';
                        field.onChange(action);
                        
                        if (action === 'join') {
                            setValue('newTeamName', '');
                            if (invitedTeamId) {
                                setValue('joinTeamId', invitedTeamId);
                                if (!fetchedInvitedTeamName || currentJoinTeamIdValue !== invitedTeamId) {
                                    fetchInvitedTeamDetails(invitedTeamId);
                                }
                            } else {
                                if(currentJoinTeamIdValue === invitedTeamId && invitedTeamId){
                                    // User manually selected 'join' but was already on the invite context, keep details
                                } else {
                                    setValue('joinTeamId', ''); 
                                    setFetchedInvitedTeamName(null);
                                    setFetchedInvitedTeamCreatorDisplayName(null);
                                }
                            }
                        } else if (action === 'create') {
                            setValue('joinTeamId', '');
                            setFetchedInvitedTeamName(null);
                            setFetchedInvitedTeamCreatorDisplayName(null);
                        } else { 
                            setValue('joinTeamId', '');
                            setValue('newTeamName', '');
                            setFetchedInvitedTeamName(null);
                            setFetchedInvitedTeamCreatorDisplayName(null);
                        }
                        }}
                        value={field.value} 
                        className="space-y-2"
                    >
                        <div className="flex items-center space-x-2">
                        <RadioGroupItem value="none" id="signupTeamNone" />
                        <Label htmlFor="signupTeamNone">No team action / Skip for now</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                        <RadioGroupItem value="create" id="signupTeamCreate" />
                        <Label htmlFor="signupTeamCreate">Create a new team</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                        <RadioGroupItem value="join" id="signupTeamJoin" />
                        <Label htmlFor="signupTeamJoin">Join an existing team</Label>
                        </div>
                    </RadioGroup>
                    )}
                />

                {selectedTeamAction === 'create' && (
                    <div className="space-y-2 pl-6 pt-2">
                    <Label htmlFor="newTeamName">New Team Name</Label>
                    <Controller
                        name="newTeamName"
                        control={control}
                        render={({ field }) => <Input id="newTeamName" placeholder="e.g., The Monarch Trackers" {...field} />}
                    />
                    {errors.newTeamName && <p className="text-sm text-destructive">{errors.newTeamName.message}</p>}
                    </div>
                )}

                {selectedTeamAction === 'join' && (
                    <div className="space-y-2 pl-6 pt-2">
                    {currentJoinTeamIdValue === invitedTeamId && invitedTeamId ? (
                        invitedTeamDetailsLoading ? (
                        <p className="text-sm text-muted-foreground">Loading team details for invite...</p>
                        ) : fetchedInvitedTeamName ? (
                        <div>
                            <Label>Joining team from invite:</Label>
                            <div className="p-3 mt-1 border rounded-md bg-muted/30 shadow-sm">
                            <p className="font-semibold text-primary">{fetchedInvitedTeamName}</p>
                            {fetchedInvitedTeamCreatorDisplayName && (
                                <p className="text-xs text-muted-foreground">
                                Created by: {fetchedInvitedTeamCreatorDisplayName}
                                </p>
                            )}
                            </div>
                            <Controller name="joinTeamId" control={control} defaultValue={invitedTeamId} render={({ field }) => ( <input type="hidden" {...field} /> )} />
                        </div>
                        ) : (
                        <>
                            <Label htmlFor="joinTeamIdManualFallback">Team ID to Join</Label>
                            <Controller name="joinTeamId" control={control} defaultValue="" render={({ field }) => ( <Input id="joinTeamIdManualFallback" placeholder="Invited team not found. Enter ID manually." {...field} /> )} />
                            {errors.joinTeamId && <p className="text-sm text-destructive">{errors.joinTeamId.message}</p>}
                        </>
                        )
                    ) : (
                        <>
                        <Label htmlFor="joinTeamIdManual">Team ID to Join</Label>
                        <Controller name="joinTeamId" control={control} render={({ field }) => ( <Input id="joinTeamIdManual" placeholder="Enter Team ID" {...field} value={field.value || ''} /> )} />
                        {errors.joinTeamId && <p className="text-sm text-destructive">{errors.joinTeamId.message}</p>}
                        <p className="text-xs text-muted-foreground">Ask the team creator for the Team ID.</p>
                        </>
                    )}
                    </div>
                )}
            </div>
          </>
        );
      default:
        return null;
    }
  };


  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="min-h-[350px]"> {/* Added min-height to reduce layout shift */}
        {renderStepContent()}
      </div>

      <Separator className="my-6" />

      <div className="flex flex-col space-y-3 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
        <div>
            {currentStep > 1 && (
            <Button type="button" variant="outline" onClick={handlePrevStep} disabled={loading || invitedTeamDetailsLoading} className="w-full sm:w-auto">
                Back
            </Button>
            )}
        </div>
        <div>
            {currentStep < 3 ? (
            <Button type="button" onClick={handleNextStep} disabled={loading || invitedTeamDetailsLoading} className="w-full sm:w-auto">
                Continue
            </Button>
            ) : (
            <Button type="submit" className="w-full sm:w-auto" disabled={loading || invitedTeamDetailsLoading}>
                {loading || invitedTeamDetailsLoading ? 'Creating Account & Profile...' : (<><UserPlus className="mr-2 h-5 w-5" /> Sign Up & Start Challenge</>)}
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
