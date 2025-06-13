
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogOverlay, DialogClose } from '@/components/ui/dialog';
import StepSubmissionForm from '@/components/dashboard/StepSubmissionForm';
import { useAuth } from '@/context/AuthContext';
import { Plus, X } from 'lucide-react';

export default function FloatingLogStepsButton() {
  const { user, userProfile, fetchUserProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user || !userProfile?.profileComplete) {
    return null;
  }

  const handleFormSubmitSuccess = async () => {
    if (user?.uid) {
      await fetchUserProfile(user.uid); // Refresh user profile data
    }
    setIsOpen(false); // Close the modal
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="default"
          size="icon"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl z-50 animate-pulse hover:animate-none"
          aria-label="Log Steps"
        >
          <Plus className="h-7 w-7" />
        </Button>
      </DialogTrigger>
      <DialogOverlay className="bg-black/60 backdrop-blur-sm" />
      <DialogContent className="sm:max-w-md p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="font-headline text-2xl">Log Your Steps</DialogTitle>
           <DialogClose className="hidden">
            
          </DialogClose>
        </DialogHeader>
        <div className="px-6 py-2"> {/* Reduced vertical padding for content */}
          <StepSubmissionForm onStepSubmit={handleFormSubmitSuccess} isModalVersion={true}/>
        </div>
      </DialogContent>
    </Dialog>
  );
}
