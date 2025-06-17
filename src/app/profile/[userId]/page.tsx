
import type { Metadata, ResolvingMetadata } from 'next'; // Import ResolvingMetadata
import { Suspense } from 'react';
import ProfilePageContent from '@/components/profile/ProfilePageContent';
import { Skeleton } from "@/components/ui/skeleton";

// This function can be used to generate metadata dynamically based on params
export async function generateMetadata(
  { params }: { params: { userId: string } },
  parent: ResolvingMetadata // Add and type the parent parameter
): Promise<Metadata> {
  // Await the parent metadata promise before accessing params.
  // This ensures that any asynchronous operations in parent layouts/segments are complete.
  await parent;

  const userId = params.userId;
  return {
    title: `Profile: ${userId} | Butterfly Steps`, // Dynamic title
    description: `View user profile (${userId}), progress, and badges in the Butterfly Steps challenge.`,
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

export default function UserProfilePage({ params }: { params: { userId: string } }) {
  const userId = params.userId; // Explicit access
  return (
    <Suspense fallback={<ProfilePageSkeleton />}>
      <ProfilePageContent viewedUserId={userId} />
    </Suspense>
  );
}

