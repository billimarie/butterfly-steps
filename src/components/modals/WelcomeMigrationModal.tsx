
'use client';

import { useAuth } from '@/context/AuthContext';
import { Dialog, DialogContent, DialogOverlay, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Footprints, Sparkles, MoveRight } from 'lucide-react';
import Logo from '@/components/ui/Logo';

export default function WelcomeMigrationModal() {
  const { 
    userProfile, 
    showWelcomeMigrationModal, 
    setShowWelcomeMigrationModal,
    setShowLogStepsModal
  } = useAuth();

  if (!userProfile || !userProfile.profileComplete) {
    return null;
  }

  const handleLogFirstSteps = () => {
    setShowWelcomeMigrationModal(false);
    setShowLogStepsModal(true, 'chrysalis'); // Origin 'chrysalis' indicates part of this onboarding flow
  };

  return (
    <Dialog open={showWelcomeMigrationModal} onOpenChange={(isOpen) => {
        if (!isOpen) {
            setShowWelcomeMigrationModal(false);
        }
    }}>
      <DialogOverlay className="bg-black/60 backdrop-blur-sm" />
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden shadow-2xl rounded-lg">
        <DialogHeader className="p-6 pb-4 text-center bg-gradient-to-br from-primary via-orange-500 to-accent items-center">
          <DialogTitle className="font-headline text-3xl md:text-4xl text-primary-foreground flex flex-col items-center justify-center">
          <Sparkles className="h-8 w-8 text-yellow-300 mt-2 mb-4" />
            Welcome to the Migration!
          </DialogTitle>
        </DialogHeader>
        <div className="pt-6 pb-8 px-6 space-y-6 text-center">
            <p className="text-xl text-foreground">
              We're thrilled to have you, <span className="font-semibold text-primary">{userProfile.displayName}</span>
            </p>
            <p className="text-muted-foreground text-lg">
              Your journey to help the Monarchs begins now. The first step? Log your steps!
            </p>
            <img 
                src="https://res.cloudinary.com/djrhjkkvm/image/upload/v1749691114/Cartoons/catti-the-caterpillar_b9skmk.png" 
                alt="Catti the Caterpillar welcoming you"
                className="mx-auto w-24 h-24 animate-catti-wiggle"
                data-ai-hint="caterpillar cartoon happy"
            />
        </div>
        <DialogFooter className="px-6 py-4 bg-muted/30 flex flex-col sm:flex-row justify-center items-center gap-3">
          <Button onClick={handleLogFirstSteps} size="lg" className="w-full sm:w-auto group">
            Log Your First Steps 
            <Footprints className="ml-2 h-5 w-5 transition-transform duration-300 ease-in-out group-hover:translate-x-1" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
