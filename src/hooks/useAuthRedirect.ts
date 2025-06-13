
'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface UseAuthRedirectOptions {
  requireAuth?: boolean;
  requireProfileComplete?: boolean;
  redirectIfAuthenticated?: string;
}

export function useAuthRedirect(options: UseAuthRedirectOptions = {}) {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    const isAuthPage = pathname === '/login' || pathname === '/signup';
    const isProfileSetupPage = pathname.startsWith('/profile'); // Includes /profile/[userId]

    if (options.redirectIfAuthenticated && user) {
      // If user is authenticated and on a page like login/signup, redirect them.
      // If profile is incomplete, redirect to their profile setup. Otherwise, to the specified path.
      if (userProfile && !userProfile.profileComplete) {
        router.push(`/profile/${user.uid}?setup=true`); // or just /profile/${user.uid}
      } else {
        router.push(options.redirectIfAuthenticated);
      }
      return;
    }
    
    if (options.requireAuth && !user) {
      router.push('/login');
      return;
    }

    if (user && options.requireProfileComplete) {
      if (!userProfile || !userProfile.profileComplete) {
        // If profile is incomplete, redirect to their own profile page for completion.
        // Avoid redirecting if already on some version of the profile page.
        // Check if current path IS NOT their own profile page.
        if (pathname !== `/profile/${user.uid}`) { 
             router.push(`/profile/${user.uid}?setup=true`); // Add query param to indicate setup
        }
      }
    }

     if (isAuthPage && user) {
       if (userProfile && userProfile.profileComplete) {
         router.push('/');
       } else if (userProfile) { // Profile exists but incomplete
         router.push(`/profile/${user.uid}?setup=true`);
       } else {
        // User exists, but userProfile is null (still loading or error).
        // This typically means AuthContext is still fetching.
        // For now, to avoid loops, we can let it be or direct to a generic profile.
        // The "?setup=true" helps ProfilePageContent know it's an initial setup.
         router.push(`/profile/${user.uid}?setup=true`);
       }
     }

  }, [user, userProfile, loading, router, pathname, options]);

  return { user, userProfile, loading };
}
