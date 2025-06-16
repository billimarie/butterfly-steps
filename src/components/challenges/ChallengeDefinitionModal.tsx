
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogOverlay, DialogClose } from '@/components/ui/dialog';
import CreateChallengeForm from './CreateChallengeForm';
import { Swords } from 'lucide-react';

interface ChallengeDefinitionModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  opponentUid: string;
  opponentDisplayName: string;
}

export default function ChallengeDefinitionModal({ isOpen, onOpenChange, opponentUid, opponentDisplayName }: ChallengeDefinitionModalProps) {
  
  const handleChallengeIssued = (challengeId: string) => {
    // Potentially redirect to a challenges page or show further instructions
    // For now, just close the modal.
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogOverlay className="bg-black/60 backdrop-blur-sm" />
      <DialogContent className="sm:max-w-lg p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="font-headline text-2xl flex items-center">
            <Swords className="mr-2 h-6 w-6 text-primary"/>
            Challenge {opponentDisplayName}
          </DialogTitle>
          <DialogDescription>
            Set the terms for your friendly step competition.
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 py-4">
          <CreateChallengeForm 
            opponentUid={opponentUid} 
            opponentDisplayName={opponentDisplayName}
            onChallengeIssued={handleChallengeIssued}
          />
        </div>
         <DialogClose asChild>
            <button className="hidden" />
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
