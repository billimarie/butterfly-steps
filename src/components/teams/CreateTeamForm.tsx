
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
import { createTeam } from '@/lib/firebaseService';
import { useRouter } from 'next/navigation';
import { PlusCircle } from 'lucide-react';
import { ToastAction } from "@/components/ui/toast";
import type { BadgeData } from '@/lib/badges';

const createTeamSchema = z.object({
  teamName: z.string().min(3, "Team name must be at least 3 characters").max(50, "Team name is too long"),
});

type CreateTeamFormInputs = z.infer<typeof createTeamSchema>;

export default function CreateTeamForm() {
  const { user, userProfile, fetchUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<CreateTeamFormInputs>({
    resolver: zodResolver(createTeamSchema),
  });

  const onSubmit: SubmitHandler<CreateTeamFormInputs> = async (data) => {
    if (!user || !userProfile) {
      toast({ title: 'Error', description: 'You must be logged in and have a profile.', variant: 'destructive' });
      return;
    }
    if (userProfile.teamId) {
      toast({ title: 'Error', description: 'You are already on a team. Leave your current team to create a new one.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const result = await createTeam(user.uid, data.teamName, userProfile.currentSteps);
      toast({ title: 'Team Created!', description: `Team "${result.teamName}" has been successfully created.` });
      
      if (result.awardedTeamBadge) {
        const badge = result.awardedTeamBadge;
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

      await fetchUserProfile(user.uid); 
      reset();
      router.push(`/teams/${result.teamId}`); 
    } catch (error) {
      console.error('Create team error:', error);
      toast({ title: 'Creation Failed', description: (error as Error).message || 'Could not create team. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="teamName">Team Name</Label>
        <Input 
          id="teamName" 
          placeholder="e.g., The Monarch Marchers" 
          {...register('teamName')} 
        />
        {errors.teamName && <p className="text-sm text-destructive">{errors.teamName.message}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Creating Team...' : <><PlusCircle className="mr-2 h-5 w-5" /> Create Team</>}
      </Button>
    </form>
  );
}
