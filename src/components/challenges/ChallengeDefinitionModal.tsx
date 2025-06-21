
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogOverlay, DialogClose } from '@/components/ui/dialog';
import CreateChallengeForm from './CreateChallengeForm';
import { Swords } from 'lucide-react';
import Image from 'next/image';

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
        <DialogHeader className="p-6 pb-4 border-b text-center items-center">
          <DialogTitle className="font-headline text-2xl flex items-center justify-center">
            <Swords className="mr-2 h-6 w-6 text-primary"/>
            Challenge {opponentDisplayName}
          </DialogTitle>
          <DialogDescription className="mt-2">
            Set the terms for your friendly step competition.
          </DialogDescription>
           <div className="mt-4 mb-2">
            <Image
              src="https://res.cloudinary.com/djrhjkkvm/image/upload/v1750005412/Cartoons/catti-and-moni_h4m3cd.png"
              alt="Catti the Caterpillar and Moni the Monarch preparing for a friendly duel"
              width={150}
              height={100} 
              className="mx-auto"
              data-ai-hint="caterpillar butterfly duel"
            />
          </div>
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
