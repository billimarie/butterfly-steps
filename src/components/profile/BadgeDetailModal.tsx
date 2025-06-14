
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { BadgeData } from '@/lib/badges';
import { cn } from '@/lib/utils';
import { Award } from 'lucide-react'; // Default icon

interface BadgeDetailModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  badge: BadgeData | null;
}

export default function BadgeDetailModal({ isOpen, onOpenChange, badge }: BadgeDetailModalProps) {
  if (!badge) return null;

  const BadgeIconComponent = badge.icon || Award;

  let milestoneText = '';
  if (badge.type === 'streak') {
    milestoneText = `${badge.milestone} day streak`;
  } else if (badge.type === 'step') {
    if (badge.id === 'first-step') {
      milestoneText = 'Logged your first step';
    } else {
      milestoneText = `${badge.milestone.toLocaleString()} steps`;
    }
  } else if (badge.type === 'event') {
    if (badge.id === 'team-player') {
      milestoneText = 'Joined or created a team';
    } else if (badge.id === 'social-butterfly') {
      milestoneText = 'Just fluttering on by';
    } else {
      milestoneText = `Completed event: ${badge.name}`; // Fallback for other event types
    }
  }


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden shadow-2xl rounded-lg">
        <DialogHeader className={cn(
            "p-6 pb-4 text-center items-center justify-center rounded-t-lg",
            "bg-gradient-to-br from-primary/90 via-primary/80 to-accent/70"
        )}>
          <BadgeIconComponent className="h-20 w-20 text-primary-foreground mb-3" />
          <DialogTitle className="font-headline text-3xl text-primary-foreground">
            {badge.name}
          </DialogTitle>
        </DialogHeader>
        <div className="pt-4 pb-6 px-6 space-y-4 text-center">
          <DialogDescription className="text-muted-foreground text-base">
            {badge.description}
          </DialogDescription>
          <div className="p-3 bg-muted/30 rounded-md border">
            <p className="text-sm font-semibold text-foreground">Milestone Reached:</p>
            <p className="text-sm text-muted-foreground">
              {milestoneText}
            </p>
          </div>
        </div>
        <DialogFooter className="px-6 py-4 bg-muted/20 border-t rounded-b-lg flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button onClick={() => onOpenChange(false)} variant="outline" className="order-2 sm:order-1 w-full sm:w-auto">Close</Button>
          <img
            src="https://res.cloudinary.com/djrhjkkvm/image/upload/v1749691114/Cartoons/catti-the-caterpillar_b9skmk.png"
            alt="Catti the Caterpillar"
            className="w-12 h-12 order-1 sm:order-2 animate-catti-wiggle"
            data-ai-hint="caterpillar cartoon"
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

