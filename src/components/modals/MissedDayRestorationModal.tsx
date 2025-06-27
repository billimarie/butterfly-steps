
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogOverlay, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile } from '@/types';
import { redeemMissedDay } from '@/lib/firebaseService';
import { cn } from '@/lib/utils';
import { Leaf, Sparkles, Sprout, Flower2, RefreshCw, X, Gift, Share2, HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";


interface MissedDayRestorationModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  missedDate: string | null;
  userProfile: UserProfile;
  onRedemptionComplete: () => void;
}

const RestorationOption = ({ icon: Icon, title, description, action, disabled = false, isLink = false, href = "#" }: any) => {
    const content = (
        <div className={cn(
            "flex items-center space-x-4 p-4 rounded-lg border w-full text-left transition-colors",
            disabled
                ? "bg-muted/50 text-muted-foreground cursor-not-allowed"
                : "bg-background hover:bg-accent/50 cursor-pointer"
        )}>
            <Icon className={cn("h-8 w-8 flex-shrink-0", disabled ? "text-muted-foreground" : "text-primary")} />
            <div className="flex-grow">
                <p className="font-semibold text-foreground">{title}</p>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
        </div>
    );

    if (disabled) {
        return <TooltipProvider><Tooltip><TooltipTrigger asChild>{content}</TooltipTrigger><TooltipContent><p>This feature is coming soon!</p></TooltipContent></Tooltip></TooltipProvider>
    }

    if (isLink) {
        return <Link href={href} className="w-full block">{content}</Link>;
    }

    return <button onClick={action} className="w-full">{content}</button>;
}

export default function MissedDayRestorationModal({ isOpen, onOpenChange, missedDate, userProfile, onRedemptionComplete }: MissedDayRestorationModalProps) {
  const [isRedeeming, setIsRedeeming] = useState(false);
  const { toast } = useToast();

  const handleFreeRedeem = async () => {
    if (!missedDate || !userProfile) return;

    setIsRedeeming(true);
    try {
      await redeemMissedDay(userProfile.uid, missedDate);
      toast({ title: 'Day Restored!', description: `You've successfully restored your progress for ${missedDate}!` });
      onRedemptionComplete();
      onOpenChange(false);
    } catch (error) {
      toast({ title: 'Restoration Failed', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleShare = () => {
    if (userProfile.inviteLink) {
      navigator.clipboard.writeText(userProfile.inviteLink)
        .then(() => {
          toast({ title: "Link Copied!", description: "Share your profile to inspire a friend!" });
          onOpenChange(false);
        })
        .catch(() => toast({ title: "Copy Failed", description: "Could not copy link.", variant: "destructive" }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0">
        <DialogHeader className="p-6 pb-4 border-b text-center items-center">
            <Sparkles className="h-12 w-12 text-primary mb-2" />
          <DialogTitle className="font-headline text-2xl">
            Let's Catch Up!
          </DialogTitle>
          <DialogDescription className="mt-2 text-base">
          Sometimes a chrysalis cracks...but every butterfly deserves a second chance.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4 space-y-3">
            <RestorationOption
                icon={Leaf}
                title="Walk the Extra Mile"
                description="Log an extra 2,000 steps today to restore the missed day."
                disabled={true}
            />
            <RestorationOption
                icon={Sparkles}
                title="Reflect on Your Journey"
                description="Write a short reflection about your progress."
                disabled={true}
            />
             <RestorationOption
                icon={Share2}
                title="Inspire a Friend"
                description="Share your progress to motivate someone else (and yourself)!"
                action={handleShare}
            />
             <RestorationOption
                icon={Sprout}
                title="Plant a Real Habitat"
                description="Sponsor a day by donating to help plant butterfly habitats."
                isLink={true}
                href="/donate"
            />
            <RestorationOption
                icon={Flower2}
                title="Join a Volunteer Day"
                description="Sign up for an upcoming volunteer event."
                disabled={true}
            />
        </div>

        <DialogFooter className="px-6 py-4 bg-muted/30 border-t flex-col sm:flex-row justify-between items-center gap-2">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
                <HelpCircle className="h-3 w-3"/>
                <span>For testing, you can use this free pass.</span>
            </div>
            <Button onClick={handleFreeRedeem} disabled={isRedeeming} variant="outline" size="sm">
                {isRedeeming ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Gift className="mr-2 h-4 w-4" />}
                Use Free Pass
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
