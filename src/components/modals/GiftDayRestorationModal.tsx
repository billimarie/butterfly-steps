'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogOverlay, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile, ChrysalisVariantData } from '@/types';
import { getChallengeDayNumberFromDateString } from '@/lib/firebaseService';
import { getChrysalisVariantByDay } from '@/lib/chrysalisVariants';
import { cn } from '@/lib/utils';
import { Gift, RefreshCw, Shell as ShellIconLucide } from 'lucide-react';

interface GiftDayRestorationModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  recipientProfile: UserProfile;
  dateToGift: string | null;
}

export default function GiftDayRestorationModal({ isOpen, onOpenChange, recipientProfile, dateToGift }: GiftDayRestorationModalProps) {
  const [isGifting, setIsGifting] = useState(false);
  const { toast } = useToast();

  const handleGift = async () => {
    setIsGifting(true);
    // Placeholder for future backend implementation
    toast({
      title: 'Gifting Feature Coming Soon!',
      description: `The ability to gift this coin to ${recipientProfile.displayName} is in the works.`,
    });
    // Simulating a delay
    setTimeout(() => {
      setIsGifting(false);
      onOpenChange(false);
    }, 1500);
  };

  const dayNumber = dateToGift ? getChallengeDayNumberFromDateString(dateToGift) : 0;
  const coinVariant = dayNumber > 0 ? getChrysalisVariantByDay(dayNumber) : null;
  const CoinIcon = coinVariant?.icon || ShellIconLucide;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b text-center items-center bg-gradient-to-br from-accent via-accent/80 to-primary/60">
          <Gift className="h-12 w-12 text-primary-foreground mb-2" />
          <DialogTitle className="font-headline text-2xl text-accent-foreground">
            Gift a Chrysalis Coin
          </DialogTitle>
        </DialogHeader>

        {coinVariant && recipientProfile && (
           <div className="px-6 py-6 space-y-4 text-center">
             <div className="flex justify-center items-center gap-4">
                <CoinIcon className="h-16 w-16 text-primary" />
                <div className="text-left">
                     <p className="text-lg font-semibold">Gift the "{coinVariant.name}"?</p>
                     <p className="text-muted-foreground">
                       This will restore the coin for <strong className="text-accent-foreground">{recipientProfile.displayName}</strong> for their missed day on <strong className="text-accent-foreground">{dateToGift}</strong>.
                    </p>
                </div>
             </div>
          </div>
        )}

        <DialogFooter className="px-6 py-4 bg-muted/30 border-t">
          <Button onClick={() => onOpenChange(false)} variant="outline" className="w-full sm:w-auto">Cancel</Button>
          <Button onClick={handleGift} disabled={isGifting} className="w-full sm:w-auto">
            {isGifting ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Gift className="mr-2 h-4 w-4" />}
            Confirm Gift
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
