
'use client';

import ProfileSetupForm from '@/components/profile/ProfileSetupForm';
import ProfileDisplay from '@/components/profile/ProfileDisplay';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams } from 'next/navigation';
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthRedirect } from '@/hooks/useAuthRedirect';

function ProfilePageSkeleton() {
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
  // const invitedTeamId = searchParams.get('invitedTeamId'); // Read, but not passed down

  if (loading || !user) {
    return <ProfilePageSkeleton />;
  }

  // invitedTeamId prop removed from ProfileSetupForm
  if (user && (!userProfile?.profileComplete || editMode)) {
    return <ProfileSetupForm isUpdate={!!userProfile?.profileComplete && editMode} />;
  }
  
  if (userProfile?.profileComplete && !editMode) {
    return <ProfileDisplay />;
  }
  
  // invitedTeamId prop removed from ProfileSetupForm
  return <ProfileSetupForm isUpdate={false} />;
}
