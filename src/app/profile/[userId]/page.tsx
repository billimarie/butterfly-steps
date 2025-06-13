
import type { Metadata } from 'next';
import { Suspense } from 'react';
import ProfilePageContent from '@/components/profile/ProfilePageContent';
import { Skeleton } from "@/components/ui/skeleton";

// This function can be used to generate metadata dynamically based on params
// For now, we'll keep it generic, but it could fetch user's name for title
export async function generateMetadata({ params }: { params: { userId: string } }): Promise<Metadata> {
  // In a real app, you might fetch user's name using params.userId
  // const userName = await fetchUserName(params.userId);
  // For now, a generic title:
  return {
    title: `User Profile | Butterfly Steps`,
    description: 'View user profile, progress, and badges in the Butterfly Steps challenge.',
  };
}

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

export default async function UserProfilePage({ params: { userId } }: { params: { userId: string } }) {
  // userId is now directly available from the destructured params
  return (
    <Suspense fallback={<ProfilePageSkeleton />}>
      <ProfilePageContent viewedUserId={userId} />
    </Suspense>
  );
}
