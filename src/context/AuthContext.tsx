'use client';

import type { User as FirebaseUser, AuthError } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import type { UserProfile, AuthContextType } from '@/types';
import { getUserProfile, updateUserStreakOnLogin } from '@/lib/firebaseService';
import { useRouter } from 'next/navigation';


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const router = useRouter();

  const fetchUserProfile = useCallback(async (uid: string, initialLogin: boolean = false) => {
    setLoading(true); // Ensure loading is true while fetching profile details
    try {
      let profileDataFromDb = await getUserProfile(uid);
      const previousStreak = profileDataFromDb?.currentStreak || 0;

      if (initialLogin) {
        const streakUpdateResults = await updateUserStreakOnLogin(uid);
        if (!profileDataFromDb && streakUpdateResults.updatedLastStreakLoginDate) {
            profileDataFromDb = await getUserProfile(uid); 
        }

        if (profileDataFromDb) {
          profileDataFromDb = {
            ...profileDataFromDb,
            currentStreak: streakUpdateResults.updatedStreakCount,
            lastStreakLoginDate: streakUpdateResults.updatedLastStreakLoginDate,
            lastLoginTimestamp: streakUpdateResults.updatedLastLoginTimestamp,
          };
        }
         // Determine if modal should be shown
        if (profileDataFromDb && profileDataFromDb.profileComplete) { // Only show for complete profiles
            const newStreak = streakUpdateResults.updatedStreakCount;
            if (newStreak > 0 && (newStreak > previousStreak || (newStreak === 1 && previousStreak === 0))) {
                 // Only show modal if streak is active and has advanced or just started.
                if (streakUpdateResults.updatedLastStreakLoginDate === new Date().toISOString().split('T')[0]) {
                     setShowStreakModal(true);
                }
            }
        }
      }
      
      if (profileDataFromDb) {
        const validatedProfile: UserProfile = {
          uid: profileDataFromDb.uid,
          email: profileDataFromDb.email,
          displayName: profileDataFromDb.displayName,
          activityStatus: profileDataFromDb.activityStatus,
          stepGoal: profileDataFromDb.stepGoal,
          currentSteps: typeof profileDataFromDb.currentSteps === 'number' ? profileDataFromDb.currentSteps : 0,
          profileComplete: !!profileDataFromDb.profileComplete,
          inviteLink: profileDataFromDb.inviteLink,
          badgesEarned: Array.isArray(profileDataFromDb.badgesEarned) ? profileDataFromDb.badgesEarned : [],
          teamId: profileDataFromDb.teamId || null,
          teamName: profileDataFromDb.teamName || null,
          currentStreak: profileDataFromDb.currentStreak || 0,
          lastStreakLoginDate: profileDataFromDb.lastStreakLoginDate || null,
          lastLoginTimestamp: profileDataFromDb.lastLoginTimestamp || null,
        };
        setUserProfile(validatedProfile);
      } else {
        setUserProfile(null);
      }
    } catch (e) {
      console.error("Failed to fetch/update user profile:", e);
      setUserProfile(null);
    } finally {
        setLoading(false); // Set loading to false after all profile operations
    }
  }, []); 
  
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
        setLoading(false); 
      }
      // setLoading(false); // Moved to finally block in fetchUserProfile
    }, (authError) => {
      setError(authError);
      setUser(null);
      setUserProfile(null);
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
      setUser(null);
      setUserProfile(null);
      setShowStreakModal(false); // Reset modal on logout
      router.push('/login'); 
    } catch (e) {
      setError(e as AuthError);
      console.error("Logout failed:", e);
    } finally {
      setLoading(false);
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