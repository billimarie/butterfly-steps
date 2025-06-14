
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
    showLogStepsModal,      
    setShowLogStepsModal,   
    logStepsFlowOrigin,     
    // setShowStreakModal,    // No longer directly controlled here
    // setStreakModalContext  // No longer directly controlled here
  } = useAuth();

  if (!user || !userProfile?.profileComplete) {
    return null;
  }

  const handleFormSubmitSuccess = async () => {
    if (user?.uid) {
      const wasFromChrysalisWelcomeFlow = logStepsFlowOrigin === 'chrysalis';
      // Call fetchUserProfile, indicating if this submission was part of the initial welcome flow
      await fetchUserProfile(user.uid, false, false, wasFromChrysalisWelcomeFlow); 
    }
    
    // setShowLogStepsModal will be called with 'direct' to ensure flowOrigin is reset
    setShowLogStepsModal(false, 'direct'); 
    // The explicit re-opening of the streak modal if origin was 'chrysalis' is REMOVED.
    // fetchUserProfile now handles the logic of when to show (or not show) the streak modal.
  };

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
          onClick={() => setShowLogStepsModal(true, 'direct')} 
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
        <div className="px-6 py-2"> 
          <StepSubmissionForm onStepSubmit={handleFormSubmitSuccess} isModalVersion={true}/>
        </div>
      </DialogContent>
    </Dialog>
  );
}
