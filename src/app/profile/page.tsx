
import type { Metadata } from 'next';
import { Suspense } from 'react';
import ProfilePageContent from '@/components/profile/ProfilePageContent';
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: 'Your Profile | Butterfly Steps',
  description: 'Manage your Butterfly Steps profile, track your progress, and view your badges.',
};

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

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfilePageSkeleton />}>
      <ProfilePageContent />
    </Suspense>
  );
}
