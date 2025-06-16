
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
  const { user, userProfile, loading, isLoggingOut } = useAuth(); // Added isLoggingOut
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading || isLoggingOut) return; // If loading or logging out, do nothing yet

    const isAuthPage = pathname === '/login' || pathname === '/signup';
    // const isProfileSetupPage = pathname.startsWith('/profile'); // Not directly used for this logic block

    if (options.redirectIfAuthenticated && user) {
      if (userProfile && !userProfile.profileComplete) {
        if (pathname !== `/profile/${user.uid}`) { // Avoid loop if already on their own profile setup
          router.push(`/profile/${user.uid}?setup=true`);
        }
      } else if (userProfile?.profileComplete && isAuthPage) { // Only redirect from auth pages if profile is complete
        router.push(options.redirectIfAuthenticated);
      } else if (isAuthPage) { // User exists, profile may be null or incomplete, on auth page
         router.push(`/profile/${user.uid}?setup=true`); // Direct to setup
      }
      return;
    }
    
    if (options.requireAuth && !user) {
      router.push('/login');
      return;
    }

    if (user && options.requireProfileComplete) {
      if (!userProfile || !userProfile.profileComplete) {
        if (pathname !== `/profile/${user.uid}`) { 
             router.push(`/profile/${user.uid}?setup=true`);
        }
      }
    }

     if (isAuthPage && user) { // This block might be redundant due to options.redirectIfAuthenticated
       if (userProfile && userProfile.profileComplete) {
         router.push('/');
       } else { 
         if (pathname !== `/profile/${user.uid}`) {
           router.push(`/profile/${user.uid}?setup=true`);
         }
       }
     }

  }, [user, userProfile, loading, isLoggingOut, router, pathname, options]); // Added isLoggingOut

  return { user, userProfile, loading, isLoggingOut }; // Return isLoggingOut
}
