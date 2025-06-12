
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

  if (loading || !user) {
    return <ProfilePageSkeleton />;
  }

  // If user exists but profile is not complete, OR if in editMode, show the setup/update form.
  // The `isUpdate` prop for ProfileSetupForm determines its behavior (initial setup vs. update).
  // For initial setup, `isUpdate` will be false. For edits, it will be true.
  if (!userProfile?.profileComplete || editMode) {
    return <ProfileSetupForm isUpdate={!!userProfile?.profileComplete && editMode} />;
  }
  
  // If profile is complete and not in edit mode, display the profile.
  if (userProfile?.profileComplete && !editMode) {
    return <ProfileDisplay />;
  }
  
  // Fallback, should ideally be covered by above conditions or redirection.
  // This would render the form for initial setup if somehow profile is null but user exists.
  return <ProfileSetupForm isUpdate={false} />;
}

    