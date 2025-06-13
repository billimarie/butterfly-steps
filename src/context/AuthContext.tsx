
'use client';

import type { User as FirebaseUser, AuthError } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import type { UserProfile, AuthContextType, StreakUpdateResults } from '@/types';
import { getUserProfile, updateUserStreakOnLogin } from '@/lib/firebaseService';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [showDailyGoalMetModal, setShowDailyGoalMetModal] = useState(false); // New state for daily goal modal
  const router = useRouter();
  const { toast } = useToast();

  const fetchUserProfile = useCallback(async (uid: string, initialLogin: boolean = false) => {
    setLoading(true);
    try {
      let finalProfile: UserProfile | null = null;
      let streakUpdateResults: StreakUpdateResults | null = null;

      if (initialLogin) {
        streakUpdateResults = await updateUserStreakOnLogin(uid);
        // Fetch profile *after* streak update to get latest streak data
        finalProfile = await getUserProfile(uid);
      } else {
        finalProfile = await getUserProfile(uid);
      }

      setUserProfile(finalProfile);

      if (initialLogin && streakUpdateResults && finalProfile) {
        if (finalProfile.profileComplete && streakUpdateResults.streakProcessedForToday) {
          setShowStreakModal(true);
          // Do not show "Login Successful" toast if streak modal is shown
        } else {
          // Show "Login Successful" only if streak modal isn't shown
          toast({ title: 'Login Successful', description: "Welcome back!" });
        }
      } else if (initialLogin && !streakUpdateResults) {
        // Fallback toast if streak processing somehow failed but it was an initial login
        toast({ title: 'Login Successful', description: "Welcome back!" });
      }
    } catch (e) {
      console.error("Failed to fetch/update user profile:", e);
      setUserProfile(null);
      if (initialLogin) {
        toast({ title: 'Login Successful', description: "Welcome back! (Profile loading issue)" });
      }
    } finally {
        setLoading(false);
    }
  }, [toast, setShowStreakModal]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      setError(null);
      if (firebaseUser) {
        setUser(firebaseUser);
        await fetchUserProfile(firebaseUser.uid, true);
      } else {
        setUser(null);
        setUserProfile(null);
        setShowStreakModal(false);
        setShowDailyGoalMetModal(false); // Reset daily goal modal on logout
        setLoading(false);
      }
    }, (authError) => {
      setError(authError);
      setUser(null);
      setUserProfile(null);
      setShowStreakModal(false);
      setShowDailyGoalMetModal(false);
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
      // user, userProfile, and modal states are reset by onAuthStateChanged
    } catch (e) {
      setError(e as AuthError);
      console.error("Logout failed:", e);
      // Ensure states are cleared even if onAuthStateChanged doesn't fire as expected
      setUser(null);
      setUserProfile(null);
      setShowStreakModal(false);
      setShowDailyGoalMetModal(false);
    } finally {
      setLoading(false);
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      loading,
      error,
      logout,
      fetchUserProfile,
      setUserProfileState,
      showStreakModal,
      setShowStreakModal,
      showDailyGoalMetModal,
      setShowDailyGoalMetModal // Provide new state and setter
    }}>
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
