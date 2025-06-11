
'use client';

import type { User as FirebaseUser, AuthError } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import type { UserProfile } from '@/types';
import { getUserProfile } from '@/lib/firebaseService';
import { useRouter } from 'next/navigation';


interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  error: AuthError | null;
  logout: () => Promise<void>;
  fetchUserProfile: (uid: string) => Promise<void>;
  setUserProfileState: (profile: UserProfile | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  const router = useRouter();

  const fetchUserProfile = useCallback(async (uid: string) => {
    try {
      const profileDataFromDb = await getUserProfile(uid);
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
        };
        setUserProfile(validatedProfile);
      } else {
        setUserProfile(null);
      }
    } catch (e) {
      console.error("Failed to fetch user profile:", e);
      setUserProfile(null);
    }
  }, []);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      setError(null);
      if (firebaseUser) {
        setUser(firebaseUser);
        await fetchUserProfile(firebaseUser.uid);
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
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
      router.push('/login'); 
    } catch (e) {
      setError(e as AuthError);
      console.error("Logout failed:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, error, logout, fetchUserProfile, setUserProfileState }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
