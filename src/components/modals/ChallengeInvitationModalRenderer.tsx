
'use client';

import { useAuth } from '@/context/AuthContext';
import ChallengeInvitationModal from '@/components/challenges/ChallengeInvitationModal';

/**
 * This component is specifically for rendering the ChallengeInvitationModal
 * when a new challenge invitation is detected for the logged-in user.
 * It pulls the challenge data and visibility control from AuthContext.
 */
export default function ChallengeInvitationModalRenderer() {
  const { pendingChallengeInvitationToShow, setShowChallengeInvitationModal } = useAuth();

  return (
    <ChallengeInvitationModal
      isOpen={!!pendingChallengeInvitationToShow}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          setShowChallengeInvitationModal(null); // Clear the challenge and hide modal
        }
      }}
      challenge={pendingChallengeInvitationToShow}
    />
  );
}
