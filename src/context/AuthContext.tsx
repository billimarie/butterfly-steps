
'use client';

import type { User as FirebaseUser } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { auth, db } from '@/lib/firebase'; // Import db
import { onAuthStateChanged, signOut as firebaseSignOut, updateProfile } from 'firebase/auth';
import type { UserProfile, AuthContextType, StreakUpdateResults, BadgeData, StreakModalViewContext } from '@/types';
import { 
  getUserProfile, 
  updateUserStreakOnLogin, 
  updateUserProfile as updateUserProfileInFirestore,
  getDailyStepForDate, 
  getTodaysDateClientLocal
} from '@/lib/firebaseService';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { arrayUnion, doc, updateDoc } from 'firebase/firestore'; 

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CHRYSALIS_AVATAR_IDENTIFIER = 'lucide:shell';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [streakModalContext, setStreakModalContext] = useState<StreakModalViewContext>('login');
  const [showDailyGoalMetModal, setShowDailyGoalMetModal] = useState(false);
  const [newlyEarnedBadgeToShow, setNewlyEarnedBadgeToShow] = useState<BadgeData | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const fetchUserProfile = useCallback(async (uid: string, initialLogin: boolean = false) => {
    setLoading(true);
    try {
      let finalProfile: UserProfile | null = null;
      
      if (initialLogin) {
        await updateUserStreakOnLogin(uid); 
        finalProfile = await getUserProfile(uid); 
        if (finalProfile?.profileComplete) {
            setStreakModalContext('login'); // Ensure context is login for initial display
            setShowStreakModal(true);
            toast({ title: 'Welcome Back!', description: "Your daily login streak has been updated." });
        } else if (finalProfile) { 
            toast({ title: 'Welcome!', description: "Let's complete your profile setup." });
        } else { 
            toast({ title: 'Welcome!', description: "Please set up your profile to get started." });
        }
      } else {
        finalProfile = await getUserProfile(uid);
      }
      setUserProfile(finalProfile);

    } catch (e) {
      console.error("Failed to fetch/update user profile:", e);
      setUserProfile(null);
      setError(e as Error);
      if (initialLogin) {
        toast({ title: 'Welcome!', description: "There was an issue loading your full profile details." });
      }
    } finally {
        setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      setError(null);
      if (firebaseUser) {
        const isActuallyNewLogin = user === null || firebaseUser.uid !== user?.uid;
        setUser(firebaseUser); 
        if (isActuallyNewLogin) {
            await fetchUserProfile(firebaseUser.uid, true);
        } else {
            setUser(prevUser => {
                if(prevUser && JSON.stringify(prevUser) !== JSON.stringify(firebaseUser)){
                    return firebaseUser;
                }
                return prevUser;
            });
            setLoading(false);
        }
      } else {
        setUser(null);
        setUserProfile(null);
        setShowStreakModal(false);
        setStreakModalContext('login');
        setShowDailyGoalMetModal(false);
        setNewlyEarnedBadgeToShow(null);
        setLoading(false);
      }
    }, (authError) => {
      setError(authError as Error);
      setUser(null);
      setUserProfile(null);
      setShowStreakModal(false);
      setStreakModalContext('login');
      setShowDailyGoalMetModal(false);
      setNewlyEarnedBadgeToShow(null);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchUserProfile, user]);

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
    } finally {
      setUser(null);
      setUserProfile(null);
      setShowStreakModal(false);
      setStreakModalContext('login');
      setShowDailyGoalMetModal(false);
      setNewlyEarnedBadgeToShow(null);
      setLoading(false);
      router.push('/login');
    }
  };

  const internalSetShowStreakModal = (show: boolean) => {
    setShowStreakModal(show);
    if (!show) {
      setStreakModalContext('login'); // Reset context when modal is closed
    }
  };


  const setShowNewBadgeModal = (badge: BadgeData | null) => {
    if (badge) {
      setNewlyEarnedBadgeToShow(badge);
    } else {
      setTimeout(() => setNewlyEarnedBadgeToShow(null), 300);
    }
  };

  const activateChrysalisAsAvatar = async () => {
    if (!auth.currentUser || !userProfile) {
      toast({ title: 'Error', description: 'You must be logged in and profile loaded.', variant: 'destructive' });
      return;
    }
    const uid = auth.currentUser.uid;
    try {
      await updateProfile(auth.currentUser, { photoURL: CHRYSALIS_AVATAR_IDENTIFIER });
      await updateUserProfileInFirestore(uid, { photoURL: CHRYSALIS_AVATAR_IDENTIFIER });
      
      if (auth.currentUser) {
         setUser(prevUser => prevUser ? { ...auth.currentUser! } : auth.currentUser);
      }
      await fetchUserProfile(uid, false); 

      toast({ title: 'Chrysalis Activated!', description: 'Your profile icon has been updated.' });
      internalSetShowStreakModal(false);
    } catch (e) {
      console.error('Failed to update profile picture:', e);
      toast({ title: 'Update Failed', description: (e as Error).message, variant: 'destructive' });
    }
  };

  const collectDailyChrysalisCoin = async () => {
    if (!user || !userProfile) {
      toast({ title: 'Error', description: 'You must be logged in to collect a coin.', variant: 'destructive' });
      return;
    }
    const uid = user.uid;
    const currentDate = getTodaysDateClientLocal();

    try {
      if (userProfile.chrysalisCoinDates?.includes(currentDate)) {
        toast({ title: 'Already Collected', description: "You've already collected your chrysalis coin for today." });
        return;
      }

      const dailyStepLog = await getDailyStepForDate(uid, currentDate);
      if (!dailyStepLog || dailyStepLog.steps === 0) {
        toast({ title: 'Log Steps First', description: "You need to log your steps for today before collecting a coin.", variant: "default" });
        return;
      }

      const userDocRef = doc(db, "users", uid);
      await updateDoc(userDocRef, {
        chrysalisCoinDates: arrayUnion(currentDate)
      });

      await fetchUserProfile(uid, false); 
      toast({ title: 'Chrysalis Coin Collected!', description: "Way to go! Your coin has been added to your profile." });
      internalSetShowStreakModal(false);

    } catch (e) {
      console.error('Failed to collect chrysalis coin:', e);
      toast({ title: 'Collection Failed', description: (e as Error).message, variant: 'destructive' });
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
      setShowStreakModal: internalSetShowStreakModal,
      streakModalContext,
      setStreakModalContext,
      showDailyGoalMetModal,
      setShowDailyGoalMetModal,
      newlyEarnedBadgeToShow,
      setShowNewBadgeModal,
      activateChrysalisAsAvatar,
      collectDailyChrysalisCoin
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
    
