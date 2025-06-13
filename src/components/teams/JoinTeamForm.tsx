
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
import { joinTeam } from '@/lib/firebaseService';
import { useRouter } from 'next/navigation';
import { LogIn } from 'lucide-react';
import type { TeamActionResult } from '@/types'; // Import TeamActionResult
// ToastAction removed

const joinTeamSchema = z.object({
  teamId: z.string().min(5, "Team ID seems too short. Please check and try again."),
});

type JoinTeamFormInputs = z.infer<typeof joinTeamSchema>;

interface JoinTeamFormProps {
  onTeamJoined?: () => void | Promise<void>; 
}

export default function JoinTeamForm({ onTeamJoined }: JoinTeamFormProps) {
  const { user, userProfile, fetchUserProfile, setShowNewBadgeModal } = useAuth();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<JoinTeamFormInputs>({
    resolver: zodResolver(joinTeamSchema),
  });

  const onSubmit: SubmitHandler<JoinTeamFormInputs> = async (data) => {
    if (!user || !userProfile) {
      toast({ title: 'Error', description: 'You must be logged in to join a team.', variant: 'destructive' });
      return;
    }
    if (userProfile.teamId) {
        toast({ title: 'Already on a team', description: `You are already on team "${userProfile.teamName}". Leave it first to join another.`, variant: 'destructive' });
        return;
    }

    setLoading(true);
    try {
      const result: TeamActionResult | null = await joinTeam(user.uid, data.teamId, userProfile.currentSteps);
      if (result) {
        toast({ title: 'Joined Team!', description: `Successfully joined team "${result.teamName}".` });
        
        if (result.awardedTeamBadge) {
          setShowNewBadgeModal(result.awardedTeamBadge);
        }
        
        await fetchUserProfile(user.uid); 
        if (onTeamJoined) {
            await onTeamJoined();
        }
        reset();
        router.push(`/teams/${result.teamId}`);
      } else {
         toast({ title: 'Failed to Join', description: 'Could not join the team. Please verify the Team ID.', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Join team error:', error);
      toast({ title: 'Join Failed', description: (error as Error).message || 'Could not join team. Please verify the ID and try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="teamId">Team ID</Label>
        <Input 
          id="teamId" 
          placeholder="Enter the Team ID" 
          {...register('teamId')} 
        />
        {errors.teamId && <p className="text-xs text-destructive mt-1">{errors.teamId.message}</p>}
      </div>
      <Button type="submit" className="w-full sm:w-auto" disabled={loading}>
        {loading ? 'Joining...' : <><LogIn className="mr-2 h-4 w-4" /> Join Team</>}
      </Button>
    </form>
  );
}
