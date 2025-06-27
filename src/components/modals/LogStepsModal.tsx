
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthContext';
import StepSubmissionForm from '@/components/dashboard/StepSubmissionForm';
import { PlusCircle } from 'lucide-react';

export default function LogStepsModal() {
  const { showLogStepsModal, setShowLogStepsModal, fetchUserProfile, user } = useAuth();

  // This function will be passed to the form, to be called after a successful submission.
  const handleSuccessfulSubmit = async () => {
    setShowLogStepsModal(false); // Close the modal
    if (user?.uid) {
      // The form submission updates the DB, now we refresh the local state
      // by fetching the updated profile.
      await fetchUserProfile(user.uid); 
    }
  };

  return (
    <Dialog open={showLogStepsModal} onOpenChange={(isOpen) => setShowLogStepsModal(isOpen, 'direct')}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl flex items-center">
            <PlusCircle className="mr-2 h-6 w-6 text-primary" />
            Log Your Steps
          </DialogTitle>
          <DialogDescription>
            Add the steps you've taken. They'll be added to your total for today.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <StepSubmissionForm onStepSubmit={handleSuccessfulSubmit} isModalVersion={true} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
