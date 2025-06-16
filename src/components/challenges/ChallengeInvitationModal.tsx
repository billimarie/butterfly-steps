
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogOverlay, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import type { Challenge } from '@/types';
import { Swords, CheckCircle, XCircle, CalendarDays, Target, Gift, Info, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

interface ChallengeInvitationModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  challenge: Challenge | null;
}

export default function ChallengeInvitationModal({ isOpen, onOpenChange, challenge }: ChallengeInvitationModalProps) {
  const { acceptChallengeInvitation, declineChallengeInvitation } = useAuth();
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);

  if (!challenge) return null;

  const handleAccept = async () => {
    setIsAccepting(true);
    await acceptChallengeInvitation(challenge.id);
    setIsAccepting(false);
    onOpenChange(false); // Close modal on action
  };

  const handleDecline = async () => {
    setIsDeclining(true);
    await declineChallengeInvitation(challenge.id);
    setIsDeclining(false);
    onOpenChange(false); // Close modal on action
  };

  const startDateFormatted = challenge.startDate ? format(challenge.startDate.toDate(), 'PPP') : 'Not set';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogOverlay className="bg-black/60 backdrop-blur-sm" />
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="p-6 pb-4 text-center items-center bg-gradient-to-br from-primary via-accent to-secondary">
          <Swords className="h-12 w-12 text-primary-foreground mb-3" />
          <DialogTitle className="font-headline text-3xl text-primary-foreground">
            You've Been Challenged!
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-6 space-y-5">
            <div className="flex justify-center my-4">
                <Image
                    src="https://res.cloudinary.com/djrhjkkvm/image/upload/v1750005412/Cartoons/catti-and-moni_h4m3cd.png"
                    alt="Catti the Caterpillar and Moni the Monarch dueling with swords"
                    width={150}
                    height={100}
                    className="rounded-md"
                    data-ai-hint="caterpillar butterfly duel"
                />
            </div>

          <DialogDescription className="text-center text-lg text-muted-foreground px-2">
            <strong>{challenge.creatorName || 'A challenger'}</strong> has invited you to a daily step battle!
          </DialogDescription>

          <div className="border bg-card p-4 rounded-lg shadow-sm space-y-3">
            <h4 className="text-md font-semibold text-foreground mb-1">Challenge Details:</h4>
            <p className="text-sm text-muted-foreground"><strong className="text-foreground">Challenge Name:</strong> {challenge.name}</p>
            <p className="text-sm text-muted-foreground"><CalendarDays className="inline mr-1.5 h-4 w-4 text-primary" /><strong>Start Date:</strong> {startDateFormatted} (daily challenge)</p>
            <p className="text-sm text-muted-foreground"><Target className="inline mr-1.5 h-4 w-4 text-primary" /><strong>Daily Goal:</strong> {challenge.goalValue.toLocaleString()} steps</p>
            {challenge.stakes && <p className="text-sm text-muted-foreground"><Gift className="inline mr-1.5 h-4 w-4 text-primary" /><strong>Stakes:</strong> {challenge.stakes}</p>}
            <p className="text-sm text-muted-foreground mt-1"><Info className="inline mr-1.5 h-4 w-4 text-primary" />{challenge.structuredDescription}</p>
            {challenge.creatorMessage && <p className="text-sm italic text-accent-foreground/80 p-2 bg-accent/10 rounded-md">"{challenge.creatorMessage}"</p>}
          </div>
        </div>

        <DialogFooter className="px-6 py-4 bg-muted/30 border-t flex flex-col sm:flex-row justify-center gap-3">
          <Button onClick={handleAccept} disabled={isAccepting || isDeclining} className="w-full sm:flex-1 bg-green-500 hover:bg-green-600 text-white">
            {isAccepting ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-5 w-5" />}
            Accept Challenge
          </Button>
          <Button onClick={handleDecline} variant="destructive" disabled={isAccepting || isDeclining} className="w-full sm:flex-1">
             {isDeclining ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-5 w-5" />}
            Decline
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
