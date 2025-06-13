
'use client';

import ProfileSetupForm from '@/components/profile/ProfileSetupForm';
import ProfileDisplay from '@/components/profile/ProfileDisplay';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams } from 'next/navigation';
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import { useState, useEffect } from 'react';
import type { UserProfile } from '@/types';
import { getUserProfile } from '@/lib/firebaseService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

interface ProfilePageContentProps {
  viewedUserId: string; // From URL params, always present for this dynamic route
}

export default function ProfilePageContent({ viewedUserId }: ProfilePageContentProps) {
  const { user: authUser, userProfile: authUserProfile, loading: authLoading } = useAuth();
  useAuthRedirect({ requireAuth: true }); // All profile views require login for now

  const searchParams = useSearchParams();
  const editMode = searchParams.get('edit') === 'true';

  const [profileToDisplay, setProfileToDisplay] = useState<UserProfile | null>(null);
  const [isLoadingTargetProfile, setIsLoadingTargetProfile] = useState(true);
  const [isOwnProfileView, setIsOwnProfileView] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);


  useEffect(() => {
    if (authLoading) return; // Wait for auth state to be resolved

    if (!authUser) {
      // This case should ideally be handled by useAuthRedirect if requireAuth is true,
      // but as a safeguard:
      setIsLoadingTargetProfile(false);
      setProfileError("You must be logged in to view profiles.");
      return;
    }

    // Determine if the viewed profile is the authenticated user's own profile
    const ownProfile = viewedUserId === authUser.uid;
    setIsOwnProfileView(ownProfile);

    if (ownProfile) {
      if (authUserProfile) {
        setProfileToDisplay(authUserProfile);
      } else if (!authLoading) {
        // Auth is loaded, authUser exists, but no authUserProfile. This might be mid-fetch or an error.
        // AuthContext's fetchUserProfile should handle setting authUserProfile.
        // If it's consistently null here, there might be an issue in AuthContext.
        // For now, rely on authUserProfile being set by AuthContext.
      }
      setIsLoadingTargetProfile(authLoading); // Own profile loading state is tied to authLoading
    } else {
      // Viewing someone else's profile
      setIsLoadingTargetProfile(true);
      getUserProfile(viewedUserId)
        .then(profile => {
          if (profile) {
            setProfileToDisplay(profile);
          } else {
            setProfileError("User profile not found.");
          }
        })
        .catch(err => {
          console.error("Error fetching viewed user's profile:", err);
          setProfileError("Could not load user profile.");
        })
        .finally(() => {
          setIsLoadingTargetProfile(false);
        });
    }
  }, [viewedUserId, authUser, authUserProfile, authLoading]);


  if (authLoading || isLoadingTargetProfile) {
    return <ProfilePageSkeleton />;
  }

  if (profileError) {
     return (
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>Profile Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{profileError}</p>
        </CardContent>
      </Card>
    );
  }

  if (!profileToDisplay) {
    // This can happen if authUser exists but authUserProfile is null (e.g. during initial load of own profile)
    // or if fetching another user's profile returned null and didn't set an error.
    // The Skeleton handles loading, so this implies a "not found" or unexpected state if not loading.
    if (!isOwnProfileView) { // Only show "not found" for other users' profiles
        return (
            <Card className="w-full max-w-lg mx-auto">
                <CardHeader><CardTitle>Profile Not Found</CardTitle></CardHeader>
                <CardContent><p>The user profile you are looking for does not exist or could not be loaded.</p></CardContent>
            </Card>
        );
    }
    // For own profile, if profileToDisplay is null but auth is loaded, something is wrong or still loading, skeleton should cover.
    // This state should ideally be brief for own profile.
    return <ProfilePageSkeleton />;
  }

  // If viewing own profile and it's incomplete, or if in editMode for own profile:
  if (isOwnProfileView && (!profileToDisplay.profileComplete || editMode)) {
    return <ProfileSetupForm isUpdate={!!profileToDisplay.profileComplete && editMode} />;
  }

  // Display the profile (own or other's)
  return <ProfileDisplay profileData={profileToDisplay} isOwnProfile={isOwnProfileView} />;
}
