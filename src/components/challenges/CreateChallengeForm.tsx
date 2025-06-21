
'use client';

import { useState, useMemo } from 'react';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { issueDirectChallenge } from '@/lib/firebaseService';
import type { ChallengeCreationData } from '@/types';
import { Footprints, CalendarIcon, Target, Gift, Swords as GiftIcon, Swords } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, addYears } from 'date-fns';

const createChallengeSchema = z.object({
  goalValue: z.preprocess(
    (val) => (val === "" ? undefined : Number(String(val).replace(/,/g, ''))),
    z.number().int().positive({ message: 'Steps goal must be a positive number.' }).min(100, 'Daily challenge goal should be at least 100 steps.')
  ),
  startDate: z.date({ required_error: "Please select a start date." })
    .min(new Date(new Date().setHours(0, 0, 0, 0)), { message: "Start date cannot be in the past." }),
  stakes: z.string().max(100, "Stakes description is too long (max 100 characters).").optional(),
});

type CreateChallengeFormInputs = z.infer<typeof createChallengeSchema>;

interface CreateChallengeFormProps {
  opponentUid: string;
  opponentDisplayName: string;
  onChallengeIssued: (challengeId: string) => void;
}

export default function CreateChallengeForm({ opponentUid, opponentDisplayName, onChallengeIssued }: CreateChallengeFormProps) {
  const { userProfile: creatorProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [startDatePopoverOpen, setStartDatePopoverOpen] = useState(false);

  const defaultStakes = "Bragging rights!";

  const { control, register, handleSubmit, formState: { errors }, watch, setValue } = useForm<CreateChallengeFormInputs>({
    resolver: zodResolver(createChallengeSchema),
    defaultValues: {
      stakes: defaultStakes,
      startDate: new Date(new Date().setHours(0,0,0,0)), 
      goalValue: 5000, 
    }
  });


  const onSubmit: SubmitHandler<CreateChallengeFormInputs> = async (data) => {
    if (!creatorProfile || !creatorProfile.uid || !creatorProfile.displayName) {
      toast({ title: 'Error', description: 'Your profile is not loaded or UID/Display Name is missing. Cannot issue challenge.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    
    try {
      const challengeDetails: ChallengeCreationData = {
        startDate: data.startDate,
        goalValue: data.goalValue,
        stakes: data.stakes || defaultStakes,
      };

      const challengeId = await issueDirectChallenge(
        creatorProfile.uid,
        creatorProfile.displayName,
        opponentUid,
        opponentDisplayName,
        challengeDetails
      );
      toast({ title: 'Challenge Issued!', description: `You've challenged ${opponentDisplayName}. Waiting for their response.` });
      onChallengeIssued(challengeId);
    } catch (error) {
      // console.error('Challenge issue error:', error);
      toast({ title: 'Challenge Failed', description: (error as Error).message || 'Could not issue challenge. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const currentMonth = new Date(new Date().getFullYear(), new Date().getMonth());

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-2">
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="startDate">Start Date <CalendarIcon className="inline h-4 w-4 text-primary"/></Label>
          <Controller
            name="startDate"
            control={control}
            render={({ field }) => (
              <Popover open={startDatePopoverOpen} onOpenChange={setStartDatePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {field.value ? format(field.value, "PPP") : <span>Pick a start date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={(date) => {
                      field.onChange(date);
                      setStartDatePopoverOpen(false); 
                    }}
                    disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                    captionLayout="dropdown-buttons"
                    fromMonth={currentMonth}
                    toYear={addYears(new Date(), 1).getFullYear()}
                  />
                </PopoverContent>
              </Popover>
            )}
          />
          {errors.startDate && <p className="text-sm text-destructive">{errors.startDate.message}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="goalValue">Daily Steps Goal <Target className="inline h-4 w-4 text-primary"/></Label>
          <div className="relative">
            <Footprints className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input id="goalValue" type="number" placeholder="e.g., 5000" {...register('goalValue')} className="pl-10" />
          </div>
          {errors.goalValue && <p className="text-sm text-destructive">{errors.goalValue.message}</p>}
        </div>
      </div>

       <div className="space-y-1">
        <Label htmlFor="stakes">Fun Stakes (Optional) <GiftIcon className="inline h-4 w-4 text-primary"/></Label>
        <Input id="stakes" placeholder="e.g., Winner buys coffee!" {...register('stakes')} />
        {errors.stakes && <p className="text-sm text-destructive">{errors.stakes.message}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Issuing Challenge...' : <><Swords className="mr-2 h-5 w-5"/> Challenge!</>}
      </Button>
    </form>
  );
}
