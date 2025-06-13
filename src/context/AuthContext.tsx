
'use client';

import type { User as FirebaseUser } from 'firebase/auth'; // AuthError removed
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import type { UserProfile, AuthContextType, StreakUpdateResults, BadgeData } from '@/types';
import { getUserProfile, updateUserStreakOnLogin } from '@/lib/firebaseService';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null); // Changed AuthError to Error
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [showDailyGoalMetModal, setShowDailyGoalMetModal] = useState(false);
  const [newlyEarnedBadgeToShow, setNewlyEarnedBadgeToShow] = useState<BadgeData | null>(null);
  const [showNewBadgeModalState, setShowNewBadgeModalState] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const fetchUserProfile = useCallback(async (uid: string, initialLogin: boolean = false) => {
    setLoading(true);
    try {
      let finalProfile: UserProfile | null = null;
      let streakUpdateResults: StreakUpdateResults | null = null;

      if (initialLogin) {
        streakUpdateResults = await updateUserStreakOnLogin(uid);
        finalProfile = await getUserProfile(uid);
      } else {
        finalProfile = await getUserProfile(uid);
      }

      setUserProfile(finalProfile);

      if (initialLogin && streakUpdateResults && finalProfile) {
        if (finalProfile.profileComplete && streakUpdateResults.streakProcessedForToday) {
          setShowStreakModal(true);
        } else {
          toast({ title: 'Login Successful', description: "Welcome back!" });
        }
      } else if (initialLogin && !streakUpdateResults) {
        toast({ title: 'Login Successful', description: "Welcome back!" });
      }
    } catch (e) {
      console.error("Failed to fetch/update user profile:", e);
      setUserProfile(null);
      setError(e as Error);
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
        setShowDailyGoalMetModal(false);
        setShowNewBadgeModalState(false);
        setNewlyEarnedBadgeToShow(null);
        setLoading(false);
      }
    }, (authError) => {
      setError(authError as Error); // Cast to Error
      setUser(null);
      setUserProfile(null);
      setShowStreakModal(false);
      setShowDailyGoalMetModal(false);
      setShowNewBadgeModalState(false);
      setNewlyEarnedBadgeToShow(null);
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
      setError(e as Error);
      console.error("Logout failed:", e);
      setUser(null);
      setUserProfile(null);
      setShowStreakModal(false);
      setShowDailyGoalMetModal(false);
      setShowNewBadgeModalState(false);
      setNewlyEarnedBadgeToShow(null);
    } finally {
      setLoading(false);
      router.push('/login');
    }
  };

  const setShowNewBadgeModal = (badge: BadgeData | null) => {
    if (badge) {
      setNewlyEarnedBadgeToShow(badge);
      setShowNewBadgeModalState(true);
    } else {
      setShowNewBadgeModalState(false);
      // Delay clearing the badge data to allow modal to fade out smoothly
      setTimeout(() => setNewlyEarnedBadgeToShow(null), 300);
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
      setShowDailyGoalMetModal,
      newlyEarnedBadgeToShow,
      setShowNewBadgeModal
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
