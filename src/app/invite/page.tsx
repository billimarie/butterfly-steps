'use client';

import InviteMessageGenerator from '@/components/invite/InviteMessageGenerator';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';

export default function InvitePage() {
  useAuthRedirect({ requireAuth: true, requireProfileComplete: true });

  return (
    <div className="container mx-auto py-8">
      <InviteMessageGenerator />
    </div>
  );
}
