
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
              {badge.id === 'team-player' ? 'Joined or created a team' : 
               badge.milestone === 1 && badge.id === 'first-step' ? 'Logged your first step' : 
               `${badge.milestone.toLocaleString()} steps`}
            </p>
          </div>
        </div>
        <DialogFooter className="px-6 py-4 bg-muted/20 border-t rounded-b-lg flex justify-center">
          <Button onClick={() => onOpenChange(false)} variant="outline" className="w-full sm:w-auto">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
