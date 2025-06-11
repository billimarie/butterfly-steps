
'use client';

import ProfileSetupForm from '@/components/profile/ProfileSetupForm';
import ProfileDisplay from '@/components/profile/ProfileDisplay';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams } from 'next/navigation';
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthRedirect } from '@/hooks/useAuthRedirect';

function ProfilePageSkeleton() {
  // This skeleton is defined in the parent page for Suspense fallback
  // but can be duplicated here if this component were to be used elsewhere without Suspense
  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <Skeleton className="h-12 w-1/2" />
      <Skeleton className="h-8 w-3/4" />
      <div className="space-y-2 pt-6">
        <Skeleton className="h-6 w-1/4" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-6 w-1/4" />
        <Skeleton className="h-20 w-full" />
      </div>
      <Skeleton className="h-10 w-full mt-6" />
    </div>
  );
}

export default function ProfilePageContent() {
  const { user, userProfile, loading } = useAuth();
  useAuthRedirect({ requireAuth: true }); 
  
  const searchParams = useSearchParams();
  const editMode = searchParams.get('edit') === 'true';
  const invitedTeamId = searchParams.get('invitedTeamId');

  if (loading || !user) {
    return <ProfilePageSkeleton />;
  }

  if (user && (!userProfile?.profileComplete || editMode)) {
    return <ProfileSetupForm isUpdate={!!userProfile?.profileComplete && editMode} invitedTeamId={invitedTeamId} />;
  }
  
  if (userProfile?.profileComplete && !editMode) {
    return <ProfileDisplay />;
  }
  
  // Default fallback, though useAuthRedirect should handle most cases.
  // This can also be a redirect or a more specific message if needed.
  return <ProfileSetupForm isUpdate={false} invitedTeamId={invitedTeamId} />;
}
