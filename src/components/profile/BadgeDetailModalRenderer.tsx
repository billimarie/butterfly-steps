
'use client';

import { useAuth } from '@/context/AuthContext';
import BadgeDetailModal from '@/components/profile/BadgeDetailModal';

/**
 * This component is specifically for rendering the BadgeDetailModal
 * when a NEW badge is earned and needs to be shown automatically.
 * It pulls the badge data and visibility control from AuthContext.
 */
export default function BadgeDetailModalRenderer() {
  const { newlyEarnedBadgeToShow, setShowNewBadgeModal } = useAuth();

  return (
    <BadgeDetailModal
      isOpen={!!newlyEarnedBadgeToShow}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          setShowNewBadgeModal(null); // This will clear the badge and hide the modal
        }
      }}
      badge={newlyEarnedBadgeToShow}
    />
  );
}
