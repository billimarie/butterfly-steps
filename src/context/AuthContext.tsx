
'use client';

import type { User as FirebaseUser, AuthError } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import type { UserProfile, AuthContextType, StreakUpdateResults } from '@/types';
import { getUserProfile, updateUserStreakOnLogin } from '@/lib/firebaseService';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast'; // Import useToast

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const router = useRouter();
  const { toast } = useToast(); // Initialize useToast

  const fetchUserProfile = useCallback(async (uid: string, initialLogin: boolean = false) => {
    setLoading(true); // Keep setLoading(true) at the beginning
    try {
      let finalProfile: UserProfile | null = null;
      let streakUpdateResults: StreakUpdateResults | null = null;

      if (initialLogin) {
        streakUpdateResults = await updateUserStreakOnLogin(uid);
        finalProfile = await getUserProfile(uid);

        if (finalProfile && streakUpdateResults) {
          finalProfile = {
            ...finalProfile,
            currentStreak: streakUpdateResults.updatedStreakCount,
            lastStreakLoginDate: streakUpdateResults.updatedLastStreakLoginDate,
            lastLoginTimestamp: streakUpdateResults.updatedLastLoginTimestamp,
          };
        }
      } else {
        finalProfile = await getUserProfile(uid);
      }

      setUserProfile(finalProfile);

      if (initialLogin && streakUpdateResults) {
        const { streakProcessedForToday } = streakUpdateResults;
        if (streakProcessedForToday && finalProfile && finalProfile.profileComplete) {
          setShowStreakModal(true);
        } else {
          // Only show "Login Successful" toast if it was an initial login
          // AND the streak modal isn't being shown.
          toast({ title: 'Login Successful', description: "Welcome back!" });
        }
      }
    } catch (e) {
      console.error("Failed to fetch/update user profile:", e);
      setUserProfile(null);
      if (initialLogin) { // If profile fetch failed on initial login, still show generic success
        toast({ title: 'Login Successful', description: "Welcome back! (Profile loading issue)" });
      }
    } finally {
        setLoading(false); 
    }
  }, [toast]); // Add toast to useCallback dependencies
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      setError(null);
      if (firebaseUser) {
        setUser(firebaseUser);
        // Pass true for initialLogin only if it's a new user session or different user
        // For simplicity here, we'll consider any auth state change with a user as needing initial processing.
        // More sophisticated logic could check if firebaseUser.uid is different from previous user.uid.
        await fetchUserProfile(firebaseUser.uid, true); 
      } else {
        setUser(null);
        setUserProfile(null);
        setShowStreakModal(false); 
        setLoading(false); 
      }
    }, (authError) => {
      setError(authError);
      setUser(null);
      setUserProfile(null);
      setShowStreakModal(false);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchUserProfile]);
  
  const setUserProfileState = (profile: UserProfile | null) => {
    setUserProfile(profile);
  };

  const logout = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      setError(e as AuthError);
      console.error("Logout failed:", e);
      setUser(null);
      setUserProfile(null);
      setShowStreakModal(false);
    } finally {
      setLoading(false);
      router.push('/login'); 
    }
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, error, logout, fetchUserProfile, setUserProfileState, showStreakModal, setShowStreakModal }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
