
'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogOverlay, DialogClose } from '@/components/ui/dialog';
import StepSubmissionForm from '@/components/dashboard/StepSubmissionForm';
import { useAuth } from '@/context/AuthContext';
import { Plus, X } from 'lucide-react';

export default function FloatingLogStepsButton() {
  const { 
    user, 
    userProfile, 
    fetchUserProfile,
    showLogStepsModal,      // Get from context
    setShowLogStepsModal,   // Get from context
    logStepsFlowOrigin,     // Get from context
    setShowStreakModal,     // Get from context
    setStreakModalContext   // Get from context
  } = useAuth();

  if (!user || !userProfile?.profileComplete) {
    return null;
  }

  const handleFormSubmitSuccess = async () => {
    if (user?.uid) {
      await fetchUserProfile(user.uid); // Refresh user profile data
    }
    
    const origin = logStepsFlowOrigin; // Capture before closing modal might reset it
    setShowLogStepsModal(false, 'direct'); // Close the log steps modal

    if (origin === 'chrysalis') {
      setStreakModalContext('login'); // Ensure correct context for chrysalis modal
      setShowStreakModal(true);   // Re-open Chrysalis modal
    }
  };

  // When user manually clicks the X or outside the dialog
  const handleOpenChange = (isOpen: boolean) => {
    setShowLogStepsModal(isOpen, 'direct');
  };

  return (
    <Dialog open={showLogStepsModal} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="default"
          size="icon"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl z-50 animate-pulse hover:animate-none"
          aria-label="Log Steps"
          onClick={() => setShowLogStepsModal(true, 'direct')} // Explicitly open with 'direct' origin
        >
          <Plus className="h-7 w-7" />
        </Button>
      </DialogTrigger>
      <DialogOverlay className="bg-black/60 backdrop-blur-sm" />
      <DialogContent className="sm:max-w-md p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="font-headline text-2xl">Log Your Steps</DialogTitle>
           <DialogClose asChild>
            <button className="hidden" />
          </DialogClose>
        </DialogHeader>
        <div className="px-6 py-2"> {/* Reduced vertical padding for content */}
          <StepSubmissionForm onStepSubmit={handleFormSubmitSuccess} isModalVersion={true}/>
        </div>
      </DialogContent>
    </Dialog>
  );
}

    