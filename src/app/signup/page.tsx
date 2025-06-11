
import { Suspense } from 'react';
import SignupPageContent from '@/components/auth/SignupPageContent';
import { Skeleton } from '@/components/ui/skeleton';

function SignupPageSkeleton() {
  return (
    <div className="flex min-h-[calc(100vh-15rem)] items-center justify-center py-12">
      <div className="w-full max-w-md space-y-6 p-4">
        <Skeleton className="h-12 w-32 mx-auto mb-6" /> {/* Logo placeholder */}
        <Skeleton className="h-8 w-3/4 mx-auto" /> {/* Title placeholder */}
        <Skeleton className="h-5 w-full mx-auto mb-6" /> {/* Description placeholder */}
        
        <div className="space-y-4">
          <div className="space-y-1">
            <Skeleton className="h-4 w-20" /> {/* Label */}
            <Skeleton className="h-10 w-full" /> {/* Input */}
          </div>
          <div className="space-y-1">
            <Skeleton className="h-4 w-20" /> {/* Label */}
            <Skeleton className="h-10 w-full" /> {/* Input */}
          </div>
          <div className="space-y-1">
            <Skeleton className="h-4 w-20" /> {/* Label */}
            <Skeleton className="h-10 w-full" /> {/* Input */}
          </div>
          <Skeleton className="h-10 w-full mt-6" /> {/* Button */}
        </div>
        <Skeleton className="h-5 w-3/4 mx-auto" /> {/* Bottom link placeholder */}
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<SignupPageSkeleton />}>
      <SignupPageContent />
    </Suspense>
  );
}
