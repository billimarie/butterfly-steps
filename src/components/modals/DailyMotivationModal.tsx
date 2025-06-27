
'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogOverlay } from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthContext';
import { Footprints, Sparkles, X } from 'lucide-react';
// Logo import removed

export default function DailyMotivationModal() {
  const {
    userProfile,
    showDailyMotivationModal,
    setShowDailyMotivationModal,
    setShowLogStepsModal
  } = useAuth();

  const handleLogSteps = () => {
    setShowDailyMotivationModal(false);
    setShowLogStepsModal(true, 'direct');
  };

  const handleOnOpenChange = (open: boolean) => {
    setShowDailyMotivationModal(open);
  };

  return (
    <Dialog open={showDailyMotivationModal} onOpenChange={handleOnOpenChange}>
      <DialogOverlay className="bg-black/60 backdrop-blur-sm" />
      <DialogContent className="sm:max-w-md p-0 overflow-hidden shadow-2xl rounded-lg">
        <DialogHeader className="p-6 pb-4 text-center bg-gradient-to-br from-primary via-orange-500 to-accent items-center relative">
          {/* Logo component removed from here */}
          <DialogTitle className="font-headline text-3xl text-primary-foreground flex flex-col items-center justify-center pt-6"> {/* Added pt-6 for spacing */}
            Welcome Back, {userProfile?.displayName || 'Explorer'}!
            <Sparkles className="h-7 w-7 text-yellow-300 mt-2" />
          </DialogTitle>
        </DialogHeader>
        <DialogDescription className="pt-6 pb-8 px-6 space-y-4 text-center text-muted-foreground text-lg">
          Log your steps today to reveal and collect this day's unique Chrysalis Coin!
        </DialogDescription>
        <DialogFooter className="px-6 py-4 bg-muted/30 flex flex-col sm:flex-row justify-center items-center gap-3">
          <Button onClick={handleLogSteps} size="lg" className="w-full sm:flex-1 group">
            Log Your Steps
            <Footprints className="ml-2 h-5 w-5 transition-transform duration-300 ease-in-out group-hover:translate-x-1" />
          </Button>
          <Button onClick={() => handleOnOpenChange(false)} variant="outline" size="lg" className="w-full sm:flex-1">
            Later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
