
'use client';

import ProfileSetupForm from '@/components/profile/ProfileSetupForm';
import ProfileDisplay from '@/components/profile/ProfileDisplay';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams } from 'next/navigation';
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import { useState, useEffect } from 'react';
import type { UserProfile } from '@/types';
import { getUserProfile, awardSpecificBadgeIfUnearned } from '@/lib/firebaseService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BadgeId } from '@/lib/badges';

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
  viewedUserId: string;
}

export default function ProfilePageContent({ viewedUserId }: ProfilePageContentProps) {
  const { user: authUser, userProfile: authUserProfile, loading: authLoading, fetchUserProfile, setShowNewBadgeModal, recordSectionVisit } = useAuth();
  useAuthRedirect({ requireAuth: true });

  const searchParams = useSearchParams();
  const editMode = searchParams.get('edit') === 'true';

  const [profileToDisplay, setProfileToDisplay] = useState<UserProfile | null>(null);
  const [isLoadingTargetProfile, setIsLoadingTargetProfile] = useState(true);
  const [isOwnProfileView, setIsOwnProfileView] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);


  useEffect(() => {
    if (authLoading) return;

    if (!authUser) {
      setIsLoadingTargetProfile(false);
      setProfileError("You must be logged in to view profiles.");
      return;
    }

    const ownProfile = viewedUserId === authUser.uid;
    setIsOwnProfileView(ownProfile);

    if (ownProfile) {
      setProfileToDisplay(authUserProfile);
      setIsLoadingTargetProfile(false);
      if (authUserProfile?.profileComplete) {
        recordSectionVisit('profile');
      }
    } else {
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
  }, [viewedUserId, authUser, authUserProfile, authLoading, recordSectionVisit]);

  useEffect(() => {
    // Award 'social-butterfly' badge if viewing another profile for the first time
    if (!authLoading && authUser && authUserProfile && profileToDisplay && !isOwnProfileView) {
      const socialButterflyBadgeId: BadgeId = 'social-butterfly';
      const alreadyHasBadge = authUserProfile.badgesEarned?.includes(socialButterflyBadgeId);

      if (!alreadyHasBadge) {
        const attemptAward = async () => {
          try {
            const awardedBadge = await awardSpecificBadgeIfUnearned(authUser.uid, socialButterflyBadgeId);
            if (awardedBadge) {
              setShowNewBadgeModal(awardedBadge);
              // Refresh authUserProfile to include the new badge for future checks
              await fetchUserProfile(authUser.uid);
            }
          } catch (error) {
            console.error("Error attempting to award social-butterfly badge:", error);
          }
        };
        attemptAward();
      }
    }
  }, [authLoading, authUser, authUserProfile, profileToDisplay, isOwnProfileView, setShowNewBadgeModal, fetchUserProfile, viewedUserId]);


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
    if (!isOwnProfileView) {
        return (
            <Card className="w-full max-w-lg mx-auto">
                <CardHeader><CardTitle>Profile Not Found</CardTitle></CardHeader>
                <CardContent><p>The user profile you are looking for does not exist or could not be loaded.</p></CardContent>
            </Card>
        );
    }
    return <ProfilePageSkeleton />;
  }

  if (isOwnProfileView && (!profileToDisplay.profileComplete || editMode)) {
    return <ProfileSetupForm isUpdate={!!profileToDisplay.profileComplete && editMode} />;
  }

  return <ProfileDisplay profileData={profileToDisplay} isOwnProfile={isOwnProfileView} />;
}
