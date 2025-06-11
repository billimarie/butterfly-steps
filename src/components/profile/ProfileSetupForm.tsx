
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
import { updateUserProfile, incrementParticipantCount, createTeam, joinTeam, leaveTeam, getUserProfile } from '@/lib/firebaseService';
import type { ActivityStatus, UserProfile } from '@/types';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Zap, TrendingUp, Target, Edit3, Users, LogOut } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { ToastAction } from "@/components/ui/toast";
import type { BadgeData } from '@/lib/badges';


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
  if (data.teamAction === 'create') {
    return !!data.newTeamName;
  }
  return true;
}, {
  message: 'Team name is required to create a team.',
  path: ['newTeamName'],
}).refine(data => {
  if (data.teamAction === 'join') {
    return !!data.joinTeamId;
  }
  return true;
}, {
  message: 'Team ID is required to join a team.',
  path: ['joinTeamId'],
});

type ProfileSetupFormInputs = z.infer<typeof profileSetupSchema>;

interface ProfileSetupFormProps {
  isUpdate?: boolean;
  invitedTeamId?: string | null;
}

export default function ProfileSetupForm({ isUpdate = false, invitedTeamId }: ProfileSetupFormProps) {
  const { user, userProfile, fetchUserProfile, setUserProfileState } = useAuth();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<ProfileSetupFormInputs>({
    resolver: zodResolver(profileSetupSchema),
    defaultValues: {
      displayName: '',
      activityStatus: undefined,
      stepGoalOption: undefined,
      customStepGoal: undefined,
      teamAction: 'none',
      newTeamName: '',
      joinTeamId: '',
    },
  });

  const selectedActivityStatus = watch('activityStatus');
  const selectedStepGoalOption = watch('stepGoalOption');
  const selectedTeamAction = watch('teamAction');

  useEffect(() => {
    if (user) { // Base: user is authenticated
      const baseDisplayName = user.email?.split('@')[0] || '';
      if (userProfile) { // Profile data is available
        setValue('displayName', userProfile.displayName || baseDisplayName);
        if (userProfile.activityStatus) {
          setValue('activityStatus', userProfile.activityStatus);
          if (userProfile.stepGoal) {
            const goalStr = `${userProfile.stepGoal.toLocaleString()} steps`;
            const currentGoals = activityGoalsMap[userProfile.activityStatus!]?.goals || [];
            if (currentGoals.includes(goalStr)) {
              setValue('stepGoalOption', goalStr);
              setValue('customStepGoal', undefined);
            } else {
              setValue('stepGoalOption', 'Custom');
              setValue('customStepGoal', userProfile.stepGoal);
            }
          } else {
              setValue('stepGoalOption', undefined);
              setValue('customStepGoal', undefined);
          }
        } else {
            setValue('activityStatus', undefined);
            setValue('stepGoalOption', undefined);
            setValue('customStepGoal', undefined);
        }
        
        if (userProfile.teamId) { // Already on a team
          setValue('teamAction', 'none'); 
          setValue('joinTeamId', ''); 
          setValue('newTeamName', '');
        } else if (invitedTeamId) { // Not on a team AND was invited
          setValue('teamAction', 'join');
          setValue('joinTeamId', invitedTeamId);
          setValue('newTeamName', '');
        } else { // Not on a team, not invited
          setValue('teamAction', 'none');
          setValue('joinTeamId', '');
          setValue('newTeamName', '');
        }
      } else { // Profile data not yet loaded, but user exists (e.g. immediately after signup)
        setValue('displayName', baseDisplayName);
        if (invitedTeamId) { // Invited, but no profile data yet loaded into context
          setValue('teamAction', 'join');
          setValue('joinTeamId', invitedTeamId);
          setValue('newTeamName', '');
        } else { // Not invited, no profile data yet
          setValue('teamAction', 'none');
          setValue('joinTeamId', '');
          setValue('newTeamName', '');
        }
      }
    }
  }, [user, userProfile, setValue, invitedTeamId]);


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

    const currentSteps = userProfile?.currentSteps ?? 0;
    const profileUpdateData: Partial<UserProfile> = {
      displayName: data.displayName,
      activityStatus: data.activityStatus,
      stepGoal: finalStepGoal,
      profileComplete: true,
      currentSteps: currentSteps, // Ensure currentSteps is preserved or initialized
      badgesEarned: userProfile?.badgesEarned || [], // Preserve existing badges
    };

    try {
      let teamUpdate: { teamId: string | null; teamName: string | null } = { 
        teamId: userProfile?.teamId || null, 
        teamName: userProfile?.teamName || null 
      };
      let awardedTeamBadgeData: BadgeData | undefined = undefined;

      // Handle team action logic
      // This condition allows joining/creating a team if the user is not currently on one.
      if (!userProfile?.teamId) {
        if (data.teamAction === 'create' && data.newTeamName) {
          const result = await createTeam(user.uid, data.newTeamName, currentSteps);
          teamUpdate = { teamId: result.teamId, teamName: result.teamName };
          awardedTeamBadgeData = result.awardedTeamBadge;
          toast({ title: 'Team Created!', description: `You've created and joined "${result.teamName}".` });
        } else if (data.teamAction === 'join' && data.joinTeamId) {
          const result = await joinTeam(user.uid, data.joinTeamId, currentSteps);
          if (result) {
              teamUpdate = { teamId: result.teamId, teamName: result.teamName };
              awardedTeamBadgeData = result.awardedTeamBadge;
              toast({ title: 'Team Joined!', description: `You've joined "${result.teamName}".` });
          } else {
              // joinTeam returns null if team ID is invalid or other specific handled failures
              toast({ title: 'Failed to join team', description: 'Please check the Team ID and try again, or the team may no longer exist.', variant: 'destructive'});
              setLoading(false);
              return; // Stop processing if join failed expectedly
          }
        }
      }
      
      profileUpdateData.teamId = teamUpdate.teamId;
      profileUpdateData.teamName = teamUpdate.teamName;
      
      // If a team badge was awarded, ensure it's part of the profile update
      if (awardedTeamBadgeData && !profileUpdateData.badgesEarned?.includes(awardedTeamBadgeData.id)) {
        profileUpdateData.badgesEarned = [...(profileUpdateData.badgesEarned || []), awardedTeamBadgeData.id];
      }
      
      await updateUserProfile(user.uid, profileUpdateData);
      
      if (!isUpdate && !userProfile?.profileComplete) { // Only increment if it's the first time profile is completed
        await incrementParticipantCount();
      }
      
      // Fetch the latest profile to update context, including potentially new team info and badges
      const updatedFullProfile = await getUserProfile(user.uid);
      if (updatedFullProfile) {
        setUserProfileState(updatedFullProfile); 
        // Display badge toast only if it was awarded in this transaction and not for other reasons
        if (awardedTeamBadgeData) { 
             const badge = awardedTeamBadgeData;
             toast({
                title: 'Badge Unlocked!',
                description: (
                  <div className="flex items-center">
                    <badge.icon className="mr-2 h-5 w-5 text-primary" />
                    <span>You've earned the "{badge.name}" badge!</span>
                  </div>
                ),
                action: (
                  <ToastAction
                    altText="View on Profile"
                    onClick={() => router.push('/profile')}
                  >
                    View on Profile
                  </ToastAction>
                ),
            });
        }
      }

      toast({ title: 'Profile Updated!', description: 'Your Mojave Monarch Challenge profile is ready.' });
      router.push('/');
    } catch (error) { // This catches errors from createTeam, joinTeam (if they throw), updateUserProfile, etc.
      console.error('Profile update/team action error:', error);
      toast({ title: 'Update Failed', description: (error as Error).message || 'Could not update profile or team. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveTeam = async () => {
    if (!user || !userProfile?.teamId) return;
    setLoading(true);
    try {
      await leaveTeam(user.uid, userProfile.teamId, userProfile.currentSteps);
      toast({ title: 'Left Team', description: `You have left ${userProfile.teamName}.` });
      // Reset team-related form fields as user is no longer on a team
      setValue('teamAction', 'none'); 
      setValue('joinTeamId', '');
      setValue('newTeamName','');
      await fetchUserProfile(user.uid); // Refresh context userProfile which will re-trigger useEffect
    } catch (error) {
      toast({ title: 'Error Leaving Team', description: (error as Error).message, variant: 'destructive' });
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
                    setValue('stepGoalOption', undefined); 
                    setValue('customStepGoal', undefined);
                  }}
                  value={field.value}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                  {Object.entries(activityGoalsMap).map(([status, {label}]) => (
                    <Label
                      key={status}
                      htmlFor={status}
                      className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary cursor-pointer"
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
        
          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center"><Users className="mr-2 h-5 w-5 text-primary" /> Team Options</h3>
            {userProfile?.teamId && userProfile?.teamName ? (
              <div>
                <p>You are currently on team: <strong className="text-accent">{userProfile.teamName}</strong>.</p>
                <Button type="button" variant="outline" onClick={handleLeaveTeam} disabled={loading} className="mt-2">
                  <LogOut className="mr-2 h-4 w-4" /> Leave Team
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
                      onValueChange={(newTeamActionValue) => {
                        field.onChange(newTeamActionValue as 'none' | 'create' | 'join');
                        
                        if (newTeamActionValue === 'join') {
                          // If user selects 'join', and there was an original invite,
                          // ensure the joinTeamId field is (re)set to that invite.
                          // User can still manually type if no invite was present.
                          if (invitedTeamId) {
                            setValue('joinTeamId', invitedTeamId);
                          }
                        } else {
                          // If user selects 'create' or 'none',
                          // and if the joinTeamId field currently holds the invitedTeamId, clear it.
                          // This means they are opting out of the specific invite.
                          if (watch('joinTeamId') === invitedTeamId) {
                            setValue('joinTeamId', '');
                          }
                        }
                        // If 'create' is selected, newTeamName field is separate and not cleared here.
                        // If 'none' is selected, newTeamName should also be cleared if it was from a previous 'create' thought.
                        if (newTeamActionValue !== 'create') {
                            setValue('newTeamName', '');
                        }
                      }}
                      value={field.value} // This is the current value from RHF state
                      className="space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="none" id="teamNone" />
                        <Label htmlFor="teamNone">No team action / Skip for now</Label>
                      </div>
                       <div className="flex items-center space-x-2">
                        <RadioGroupItem value="create" id="teamCreate" />
                        <Label htmlFor="teamCreate">Create a new team</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="join" id="teamJoin" />
                        <Label htmlFor="teamJoin">Join an existing team</Label>
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
                    <Label htmlFor="joinTeamId">Team ID to Join</Label>
                     <Controller
                        name="joinTeamId"
                        control={control}
                        render={({ field }) => (
                            <Input 
                                id="joinTeamId" 
                                placeholder="Enter Team ID" 
                                {...field} 
                                readOnly={!!(invitedTeamId && field.value === invitedTeamId)}
                                className={!!(invitedTeamId && field.value === invitedTeamId) ? "bg-muted/50" : ""}
                            />
                        )}
                    />
                    {errors.joinTeamId && <p className="text-sm text-destructive">{errors.joinTeamId.message}</p>}
                    {invitedTeamId && watch('joinTeamId') === invitedTeamId && (
                        <p className="text-xs text-muted-foreground">Joining team from invite. You can choose a different action if you wish.</p>
                    )}
                    {!invitedTeamId && selectedTeamAction === 'join' && (
                         <p className="text-xs text-muted-foreground">Ask the team creator for the Team ID.</p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
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

