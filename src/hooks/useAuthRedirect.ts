'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface UseAuthRedirectOptions {
  requireAuth?: boolean; // Page requires authentication
  requireProfileComplete?: boolean; // Page requires profile to be complete
  redirectIfAuthenticated?: string; // Redirect to this path if user is authenticated (e.g., for login/signup pages)
}

export function useAuthRedirect(options: UseAuthRedirectOptions = {}) {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    const isAuthPage = pathname === '/login' || pathname === '/signup';

    if (options.redirectIfAuthenticated && user) {
      router.push(options.redirectIfAuthenticated);
      return;
    }
    
    if (options.requireAuth && !user) {
      router.push('/login');
      return;
    }

    if (user && options.requireProfileComplete) {
      if (!userProfile || !userProfile.profileComplete) {
        if (pathname !== '/profile') { // Allow access to profile page for completion
            router.push('/profile');
        }
      }
    }

    // If on login/signup page and already logged in, redirect to home
     if (isAuthPage && user) {
       if (userProfile && userProfile.profileComplete) {
         router.push('/');
       } else {
         router.push('/profile');
       }
     }


  }, [user, userProfile, loading, router, pathname, options]);

  return { user, userProfile, loading };
}
