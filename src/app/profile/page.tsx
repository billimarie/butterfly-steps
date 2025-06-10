'use client';

import ProfileSetupForm from '@/components/profile/ProfileSetupForm';
import ProfileDisplay from '@/components/profile/ProfileDisplay';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams } from 'next/navigation';
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthRedirect } from '@/hooks/useAuthRedirect';

export default function ProfilePage() {
  const { user, userProfile, loading } = useAuth();
  useAuthRedirect({ requireAuth: true }); // No need for requireProfileComplete here as this IS the profile page
  
  const searchParams = useSearchParams();
  const editMode = searchParams.get('edit') === 'true';

  if (loading || !user) {
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

  // If user is loaded, and (profile is not complete OR explicitly in edit mode)
  if (user && (!userProfile?.profileComplete || editMode)) {
    return <ProfileSetupForm isUpdate={!!userProfile?.profileComplete && editMode} />;
  }
  
  // If profile is complete and not in edit mode
  if (userProfile?.profileComplete && !editMode) {
    return <ProfileDisplay />;
  }
  
  // Fallback, though ideally covered by loading state or redirection.
  // This could happen if user exists, profile fetch failed or is in an unexpected state.
  return <ProfileSetupForm isUpdate={false} />;
}
