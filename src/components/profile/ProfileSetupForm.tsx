
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
import { useAuth } from '@/context/AuthContext';
import { createTeam, joinTeam, leaveTeam, getUserProfile } from '@/lib/firebaseService';
import type { ActivityStatus, UserProfile, TeamActionResult } from '@/types';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { CheckCircle, Zap, TrendingUp, Target, Edit3, Users, LogOut, PlusCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import type { BadgeData, BadgeId } from '@/lib/badges';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

const activityGoalsMap: Record<ActivityStatus, { label: string; goals: string[] }> = {
  Sedentary: { label: 'Mostly sitting, little to no exercise', goals: ['25,000 steps', '75,000 steps', '200,000 steps', 'Custom'] },
  'Moderately Active': { label: 'Light exercise / walking a few times a week', goals: ['50,000 steps', '100,000 steps', '300,000 steps', 'Custom'] },
  'Very Active': { label: 'Regular vigorous exercise / active job', goals: ['100,000 steps', '300,000 steps', '500,000 steps', 'Custom'] },
};

const profileUpdateSchema = z.object({
  displayName: z
    .string()
    .min(2, { message: "Display name must be at least 2 characters." })
    .max(50, { message: "Display name cannot exceed 50 characters."})
    .regex(/^[a-zA-Z0-9_-]+$/, { message: "Display name can only contain letters, numbers, hyphens (-), and underscores (_)." }),
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
    if (data.teamAction === 'create') return !!data.newTeamName && data.newTeamName.length >=3;
    return true;
}, { message: 'Team name is required and must be at least 3 characters to create a team.', path: ['newTeamName']})
.refine(data => {
    if (data.teamAction === 'join') return !!data.joinTeamId && data.joinTeamId.length >= 5;
    return true;
}, { message: 'Team ID is required and seems too short to join a team.', path: ['joinTeamId']});


type ProfileUpdateFormInputs = z.infer<typeof profileUpdateSchema>;

interface ProfileSetupFormProps {
  isUpdate?: boolean;
}

export default function ProfileSetupForm({ isUpdate = false }: ProfileSetupFormProps) {
  const { user, userProfile, fetchUserProfile, setUserProfileState, setShowNewBadgeModal } = useAuth();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const { control, handleSubmit, watch, setValue, formState, trigger, reset } = useForm<ProfileUpdateFormInputs>({
    resolver: zodResolver(profileUpdateSchema),
    mode: 'onChange',
    defaultValues: {
      displayName: '',
      activityStatus: undefined,
      stepGoalOption: undefined,
      customStepGoal: undefined,
      teamAction: 'none',
      newTeamName: undefined,
      joinTeamId: undefined,
    },
  });
  const { errors, isDirty, isValid } = formState;

  const selectedActivityStatus = watch('activityStatus');
  const selectedStepGoalOption = watch('stepGoalOption');
  const selectedTeamAction = watch('teamAction');


  useEffect(() => {
    if (userProfile && (isUpdate || !userProfile.profileComplete)) {
        let determinedActivityStatus: ActivityStatus = userProfile.activityStatus || 'Moderately Active';
        let goalOpt: string | undefined = undefined;
        let customGoalVal: number | undefined = undefined;

        if (userProfile.stepGoal) {
            const goalStr = `${userProfile.stepGoal.toLocaleString()} steps`;
            const currentActivityGoals = activityGoalsMap[determinedActivityStatus];
            if (currentActivityGoals?.goals?.includes(goalStr)) {
                goalOpt = goalStr;
            } else {
                goalOpt = 'Custom';
                customGoalVal = userProfile.stepGoal;
            }
        } else {
             goalOpt = activityGoalsMap[determinedActivityStatus]?.goals?.[0];
        }
        
        const resetValues: ProfileUpdateFormInputs = {
            displayName: userProfile.displayName || user?.email?.split('@')[0] || '',
            activityStatus: determinedActivityStatus,
            stepGoalOption: goalOpt!,
            customStepGoal: customGoalVal,
            teamAction: 'none', 
            newTeamName: undefined,
            joinTeamId: undefined,
        };
        reset(resetValues);
        trigger(); 

    } else if (user && !isUpdate && !userProfile) { 
        const defaultDisplayName = user.email?.split('@')[0] || '';
        const defaultActivityStatus: ActivityStatus = 'Moderately Active';
        const defaultStepGoalOption = activityGoalsMap[defaultActivityStatus].goals[0];
        const resetValues: ProfileUpdateFormInputs = {
            displayName: defaultDisplayName,
            activityStatus: defaultActivityStatus,
            stepGoalOption: defaultStepGoalOption,
            customStepGoal: undefined,
            teamAction: 'none',
            newTeamName: undefined,
            joinTeamId: undefined,
        };
        reset(resetValues);
        trigger();
    }
  }, [user, userProfile, isUpdate, reset, trigger]);


  const onSubmit: SubmitHandler<ProfileUpdateFormInputs> = async (data) => {
    if (!user) {
      toast({ title: 'Error', description: 'User not authenticated. Please log in again.', variant: "destructive" });
      return;
    }

    if (isUpdate && !userProfile && !isDirty) { // if it's an update, userProfile must exist. if !isDirty, don't submit.
      toast({ title: 'No Changes', description: 'No changes were made to the profile.', variant: "default" });
      router.push(`/profile/${user.uid}`); // Navigate back if no changes
      return;
    }
    setLoading(true);

    try {
      let finalStepGoal: number;
      if (data.stepGoalOption === 'Custom') {
        finalStepGoal = data.customStepGoal!;
      } else {
        finalStepGoal = parseInt(data.stepGoalOption.replace(/,/g, '').replace(' steps', ''));
      }
      
      // Construct the base for profile data. If userProfile exists, use it as a starting point.
      // Otherwise, create a new profile structure with defaults.
      const existingProfileFieldsOrDefaults: UserProfile = userProfile 
        ? { ...userProfile } 
        : {
            uid: user.uid, // This will be authoritative from 'user' object later
            email: user.email, // This will be authoritative from 'user' object later
            displayName: user.email?.split('@')[0] || '',
            photoURL: user.photoURL || null,
            activityStatus: 'Moderately Active' as ActivityStatus,
            stepGoal: parseInt(activityGoalsMap['Moderately Active'].goals[0].replace(/,/g, '').replace(' steps', '')),
            currentSteps: 0,
            profileComplete: false, 
            inviteLink: `${process.env.NEXT_PUBLIC_APP_URL || ''}/profile/${user.uid}`,
            badgesEarned: [] as BadgeId[],
            teamId: null,
            teamName: null,
            currentStreak: 0,
            lastStreakLoginDate: null,
            lastLoginTimestamp: null,
            chrysalisCoinDates: [] as string[],
            dashboardLayout: { dashboardOrder: [], communityOrder: [] },
      };
      
      // Merge existing/default fields with form data and authoritative fields
      const profileUpdateData: UserProfile = {
        ...existingProfileFieldsOrDefaults, // Spread existing or new profile defaults
        // Overwrite with data from the form
        displayName: data.displayName,
        activityStatus: data.activityStatus,
        stepGoal: finalStepGoal,
        profileComplete: true, // Always true after this form submission
        // Explicitly use authoritative uid and email from the authenticated user object
        uid: user.uid,
        email: user.email,
      };
      
      let awardedTeamBadgeFromAction: BadgeData | null | undefined = undefined;
      
      // Check if user is already on a team FROM THE LOADED userProfile (not profileUpdateData yet)
      const canPerformTeamAction = !userProfile?.teamId; 

      if (canPerformTeamAction && data.teamAction !== 'none') {
          if (data.teamAction === 'create' && data.newTeamName) {
              const result: TeamActionResult = await createTeam(user.uid, data.newTeamName, profileUpdateData.currentSteps);
              profileUpdateData.teamId = result.teamId;
              profileUpdateData.teamName = result.teamName;
              awardedTeamBadgeFromAction = result.awardedTeamBadge;
              toast({ title: 'Team Created!', description: `You've created and joined "${result.teamName}".` });
          } else if (data.teamAction === 'join' && data.joinTeamId) {
              const result: TeamActionResult | null = await joinTeam(user.uid, data.joinTeamId, profileUpdateData.currentSteps);
              if (result) {
                  profileUpdateData.teamId = result.teamId;
                  profileUpdateData.teamName = result.teamName;
                  awardedTeamBadgeFromAction = result.awardedTeamBadge;
                  toast({ title: 'Team Joined!', description: `You've joined "${result.teamName}".` });
              } else {
                  toast({ title: 'Failed to join team', description: 'Please check the Team ID and try again.', variant: "destructive"});
                  setLoading(false);
                  return; 
              }
          }
      } else if (userProfile?.teamId && data.teamAction !== 'none' && (data.newTeamName || data.joinTeamId)) {
        toast({ title: 'Team Action Skipped', description: 'You are already on a team. Leave your current team to create or join another.', variant: 'default' });
        // Reset team form fields visually as they were not processed
        setValue('teamAction', 'none');
        setValue('newTeamName', undefined);
        setValue('joinTeamId', undefined);
      }
      
      if (awardedTeamBadgeFromAction && !profileUpdateData.badgesEarned?.includes(awardedTeamBadgeFromAction.id as BadgeId)) {
          profileUpdateData.badgesEarned = [...(profileUpdateData.badgesEarned || []), awardedTeamBadgeFromAction.id as BadgeId];
      }
      
      await setDoc(doc(db, "users", user.uid), profileUpdateData, { merge: true });
      toast({ title: 'Profile Updated!', description: 'Your Butterfly Steps profile has been successfully saved.' });
      
      const updatedFullProfile = await getUserProfile(user.uid); // Fetch the fully merged profile
      if (updatedFullProfile) {
        setUserProfileState(updatedFullProfile); // Update context with the truly latest data from DB
        if (awardedTeamBadgeFromAction) {
             setShowNewBadgeModal(awardedTeamBadgeFromAction);
        }
      } else {
        // Fallback to updating context with what we tried to save if fetch fails
        setUserProfileState(profileUpdateData); 
        toast({ title: 'Profile Saved', description: 'Profile was saved, but there was an issue refreshing the display. Please manually refresh if needed.', variant: 'default' });
      }
      
      router.push(`/profile/${user.uid}`);
      
    } catch (error) {
        toast({ title: 'Update Failed', description: (error as Error).message || 'Could not update profile or team. Please try again.', variant: "destructive" });
    } finally {
        setLoading(false);
    }
  };
  
  const handleLeaveTeamAndResetForm = async () => {
    if (!user || !userProfile?.teamId) {
      return;
    }
    setLoading(true);
    try {
      await leaveTeam(user.uid, userProfile.teamId, userProfile.currentSteps);
      toast({ title: 'Left Team', description: `You have left ${userProfile.teamName}. You can now create or join a new team.` });
      
      // Optimistically update local context
      const tempProfile = {...userProfile, teamId: null, teamName: null};
      setUserProfileState(tempProfile); // Update context

      // Reset form fields related to team actions
      setValue('teamAction', 'none');
      setValue('joinTeamId', undefined);
      setValue('newTeamName', undefined);
      trigger(); // Re-validate the form state

    } catch (error) {
      toast({ title: 'Error Leaving Team', description: (error as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const cancelLink = user ? `/profile/${user.uid}` : '/';

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="font-headline text-3xl flex items-center">
          {isUpdate ? <Edit3 className="mr-2 h-7 w-7 text-primary" /> : <Zap className="mr-2 h-7 w-7 text-primary" />}
          {isUpdate ? 'Update Your Profile' : 'Complete Your Profile Setup'}
        </CardTitle>
        <CardDescription>
          {isUpdate ? 'Modify your details for the Butterfly Steps challenge.' : 'Tell us a bit about yourself to get started with the Butterfly Steps challenge.'}
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
                    const newActivityStatus = value as ActivityStatus;
                    setValue('stepGoalOption', activityGoalsMap[newActivityStatus]?.goals?.[0]);
                    setValue('customStepGoal', undefined);
                    trigger(['activityStatus', 'stepGoalOption', 'customStepGoal']);
                  }}
                  value={field.value}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                  {Object.entries(activityGoalsMap).map(([status, {label}]) => (
                    <Label
                      key={status}
                      htmlFor={`update-${status}`}
                      className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                      <RadioGroupItem value={status} id={`update-${status}`} className="sr-only" />
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
                      trigger(['stepGoalOption', 'customStepGoal']);
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
        
          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center"><Users className="mr-2 h-5 w-5 text-primary" /> Team Information</h3>
            {userProfile?.teamId && userProfile?.teamName ? (
              <div>
                <p>You are currently on team: <strong className="text-accent">{userProfile.teamName}</strong>.</p>
                <Button type="button" variant="outline" onClick={handleLeaveTeamAndResetForm} disabled={loading} className="mt-2">
                  <LogOut className="mr-2 h-4 w-4" /> {loading && selectedTeamAction === 'none' ? 'Processing...' : 'Leave Current Team'}
                </Button>
                <p className="text-xs text-muted-foreground mt-1">To join or create a new team, you must first leave your current team.</p>
              </div>
            ) : (
              <>
                <Controller
                  name="teamAction"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup
                      onValueChange={(value) => {
                        field.onChange(value);
                        if (value === 'create') {
                            setValue('joinTeamId', undefined);
                        } else if (value === 'join') {
                            setValue('newTeamName', undefined);
                        } else {
                            setValue('newTeamName', undefined);
                            setValue('joinTeamId', undefined);
                        }
                        trigger(['teamAction', 'newTeamName', 'joinTeamId']);
                      }}
                      value={field.value}
                      className="space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="none" id="profileTeamNone" />
                        <Label htmlFor="profileTeamNone">No team action / Skip for now</Label>
                      </div>
                       <div className="flex items-center space-x-2">
                        <RadioGroupItem value="create" id="profileTeamCreate" />
                        <Label htmlFor="profileTeamCreate">Create a new team</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="join" id="profileTeamJoin" />
                        <Label htmlFor="profileTeamJoin">Join an existing team</Label>
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
                        render={({ field }) => <Input id="newTeamName" placeholder="e.g., The Monarch Trackers" {...field} onChange={(e) => { field.onChange(e); trigger('newTeamName'); }} />}
                    />
                    {errors.newTeamName && <p className="text-sm text-destructive">{errors.newTeamName.message}</p>}
                  </div>
                )}

                {selectedTeamAction === 'join' && (
                  <div className="space-y-2 pl-6 pt-2">
                        <Label htmlFor="joinTeamIdManual">Team ID to Join</Label>
                        <Controller
                            name="joinTeamId"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    id="joinTeamIdManual"
                                    placeholder="Enter Team ID"
                                    {...field}
                                    value={field.value || ''} 
                                    onChange={(e) => { field.onChange(e); trigger('joinTeamId');}}
                                />
                            )}
                        />
                        {errors.joinTeamId && <p className="text-sm text-destructive">{errors.joinTeamId.message}</p>}
                        <p className="text-xs text-muted-foreground">Ask the team creator for the Team ID.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-3">
          <Button type="button" variant="outline" onClick={() => router.push(cancelLink)} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="w-full sm:w-auto" 
            disabled={loading || (isUpdate && !isDirty) || !isValid}
          >
            {loading ? (isUpdate ? 'Updating...' : 'Saving...') : (<><CheckCircle className="mr-2 h-5 w-5" /> {isUpdate ? 'Update Profile' : 'Save Profile & Start Challenge'}</>)}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
    
