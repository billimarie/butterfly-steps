
'use client';

import type { User as FirebaseUser } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut as firebaseSignOut, updateProfile } from 'firebase/auth';
import type { UserProfile, AuthContextType, StreakUpdateResults, BadgeData, StreakModalViewContext, LogStepsModalOrigin, ChrysalisVariantData } from '@/types';
import { CHRYSALIS_AVATAR_IDENTIFIER } from '@/types';
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
import { ALL_CHRYSALIS_VARIANTS, getChrysalisVariantByDay } from '@/lib/chrysalisVariants';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_THEME_VALUES = {
  primary: "39 100% 50%",
  primaryForeground: "0 0% 100%",
  accent: "51 100% 50%",
  accentForeground: "39 60% 30%",
};

function getChallengeDayNumber(dateString: string): number {
  const [year, month, day] = dateString.split('-').map(Number);
  const currentDate = new Date(Date.UTC(year, month - 1, day));

  const challengeStartDate = new Date(Date.UTC(currentDate.getUTCFullYear(), 5, 21)); // June 21st

  if (currentDate < challengeStartDate) return 0;

  const diffTime = currentDate.getTime() - challengeStartDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  const dayNumber = diffDays + 1;
  return Math.max(1, Math.min(dayNumber, 133)); // Clamp between 1 and 133
}


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [streakModalContext, setStreakModalContext] = useState<StreakModalViewContext>('login');
  const [showDailyGoalMetModal, setShowDailyGoalMetModal] = useState(false);
  const [newlyEarnedBadgeToShow, setNewlyEarnedBadgeToShow] = useState<BadgeData | null>(null);
  const [activeChrysalisThemeId, setActiveChrysalisThemeId] = useState<string | null | undefined>(undefined);

  const [_showLogStepsModal, _setShowLogStepsModal] = useState(false);
  const [logStepsFlowOrigin, setLogStepsFlowOrigin] = useState<LogStepsModalOrigin>(null);
  const [justCollectedCoin, setJustCollectedCoin] = useState<ChrysalisVariantData | null>(null);


  const router = useRouter();
  const { toast } = useToast();

  const applyTheme = useCallback((themeId: string | null) => {
    let variantToApply: ChrysalisVariantData | undefined;

    if (themeId) {
      variantToApply = ALL_CHRYSALIS_VARIANTS.find(v => v.id === themeId);
    }

    if (variantToApply) {
      document.documentElement.style.setProperty('--primary', variantToApply.themePrimaryHSL);
      document.documentElement.style.setProperty('--primary-foreground', variantToApply.themePrimaryForegroundHSL);
      document.documentElement.style.setProperty('--accent', variantToApply.themeAccentHSL);
      document.documentElement.style.setProperty('--accent-foreground', variantToApply.themeAccentForegroundHSL);
      setActiveChrysalisThemeId(themeId);
    } else {
      document.documentElement.style.setProperty('--primary', DEFAULT_THEME_VALUES.primary);
      document.documentElement.style.setProperty('--primary-foreground', DEFAULT_THEME_VALUES.primaryForeground);
      document.documentElement.style.setProperty('--accent', DEFAULT_THEME_VALUES.accent);
      document.documentElement.style.setProperty('--accent-foreground', DEFAULT_THEME_VALUES.accentForeground);
      setActiveChrysalisThemeId(null);
    }
  }, []);

  const fetchUserProfile = useCallback(async (uid: string, initialLogin: boolean = false) => {
    setLoading(true);
    try {
      let finalProfile: UserProfile | null = null;
      let streakResult: StreakUpdateResults | null = null;

      if (initialLogin) {
        streakResult = await updateUserStreakOnLogin(uid);
        finalProfile = await getUserProfile(uid);

        if (finalProfile?.profileComplete) {
          if (streakResult.streakProcessedForToday) {
            toast({ title: 'Welcome Back!', description: "Your daily login streak has been updated." });
            setStreakModalContext('login');
            setShowStreakModal(true);
          } else {
             toast({ title: 'Welcome Back!'});
          }
        } else if (finalProfile) {
            toast({ title: 'Welcome!', description: "Let's complete your profile setup." });
        } else {
            toast({ title: 'Welcome!', description: "Please set up your profile to get started." });
        }
      } else {
        finalProfile = await getUserProfile(uid);
      }
      setUserProfile(finalProfile);
      if (finalProfile?.activeChrysalisThemeId) {
        applyTheme(finalProfile.activeChrysalisThemeId);
      } else {
        applyTheme(null);
      }

    } catch (e) {
      console.error("Failed to fetch/update user profile:", e);
      setUserProfile(null);
      setError(e as Error);
      applyTheme(null);
      if (initialLogin) {
        toast({ title: 'Profile Load Issue', description: "There was an issue loading your full profile details." });
      }
    } finally {
        setLoading(false);
    }
  }, [toast, applyTheme]);

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
            if (userProfile?.activeChrysalisThemeId) {
                applyTheme(userProfile.activeChrysalisThemeId);
            } else {
                applyTheme(null);
            }
            setLoading(false);
        }
      } else {
        setUser(null);
        setUserProfile(null);
        setShowStreakModal(false);
        setStreakModalContext('login');
        setShowDailyGoalMetModal(false);
        setNewlyEarnedBadgeToShow(null);
        _setShowLogStepsModal(false);
        setLogStepsFlowOrigin(null);
        setJustCollectedCoin(null);
        applyTheme(null);
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
      _setShowLogStepsModal(false);
      setLogStepsFlowOrigin(null);
      setJustCollectedCoin(null);
      applyTheme(null);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchUserProfile, user, applyTheme, userProfile?.activeChrysalisThemeId]);

  const setUserProfileState = (profile: UserProfile | null) => {
    setUserProfile(profile);
    if (profile?.activeChrysalisThemeId) {
      applyTheme(profile.activeChrysalisThemeId);
    } else if (profile === null) {
      applyTheme(null);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      setError(e as Error);
      console.error("Logout failed:", e);
      applyTheme(null);
    } finally {
      setLoading(false);
      router.push('/login');
    }
  };

  const internalSetShowStreakModal = (show: boolean) => {
    setShowStreakModal(show);
    if (!show) {
      setStreakModalContext('login');
      // If closing and a coin was just collected but not activated, clear it.
      // This is also handled by clearJustCollectedCoinDetails, but good for direct closes too.
      if (justCollectedCoin) {
        setJustCollectedCoin(null);
      }
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

    const goldenChrysalisVariant = getChrysalisVariantByDay(1);
    if (!goldenChrysalisVariant) {
      toast({ title: 'Theme Error', description: 'Default Chrysalis theme not found.', variant: 'destructive' });
      return;
    }
    
    await activateThemeFromCollectedCoin(goldenChrysalisVariant, true);
    // No need to navigate here as this is usually called from profile or a specific non-collection context
  };

  const collectDailyChrysalisCoin = async () => {
    if (!user || !userProfile) {
      toast({ title: 'Error', description: 'You must be logged in to collect a coin.', variant: 'destructive' });
      return;
    }
    const uid = user.uid;
    const currentDate = getTodaysDateClientLocal();

    if (userProfile.chrysalisCoinDates?.includes(currentDate)) {
      toast({ title: 'Already Collected', description: "You've already collected your chrysalis coin for today." });
      // Don't close modal, let the modal re-render to show "already collected"
      const dayNumber = getChallengeDayNumber(currentDate);
      const variant = getChrysalisVariantByDay(dayNumber);
      if (variant) setJustCollectedCoin(variant); // Show details even if already collected for user to activate theme.
      return;
    }

    const dailyStepLog = await getDailyStepForDate(uid, currentDate);
    if (!dailyStepLog || dailyStepLog.steps === 0) {
      toast({ title: 'Log Steps First', description: "You need to log your steps for today before collecting a coin.", variant: "default" });
      return;
    }

    try {
      const userDocRef = doc(db, "users", uid);
      await updateDoc(userDocRef, {
        chrysalisCoinDates: arrayUnion(currentDate)
      });

      setUserProfile(prevProfile => {
        if (!prevProfile) return null;
        const existingDates = prevProfile.chrysalisCoinDates || [];
        const newCoinDates = existingDates.includes(currentDate) ? existingDates : [...existingDates, currentDate];
        return { ...prevProfile, chrysalisCoinDates: newCoinDates };
      });

      toast({ title: 'Chrysalis Coin Collected!', description: "Way to go! Your coin has been added to your profile." });

      const dayNumber = getChallengeDayNumber(currentDate);
      const variant = getChrysalisVariantByDay(dayNumber);
      if (variant) {
        setJustCollectedCoin(variant); // Set state to show collected coin details in modal
      } else {
        console.error(`Could not find Chrysalis variant for day ${dayNumber}`);
        internalSetShowStreakModal(false); // Fallback: close modal if variant details can't be shown
      }

    } catch (e) {
      console.error('Failed to collect chrysalis coin:', e);
      toast({ title: 'Collection Failed', description: (e as Error).message, variant: 'destructive' });
      await fetchUserProfile(uid, false);
      internalSetShowStreakModal(false);
    }
  };

  const activateThemeFromCollectedCoin = async (coinToActivate: ChrysalisVariantData, fromProfileActivation: boolean = false) => {
    if (!user || !userProfile) {
      toast({ title: 'Error', description: 'User not found.', variant: 'destructive' });
      return;
    }
    const uid = user.uid;
    try {
      const updates: Partial<UserProfile> = {
        activeChrysalisThemeId: coinToActivate.id,
        photoURL: CHRYSALIS_AVATAR_IDENTIFIER, // Always set chrysalis avatar when a theme is activated
      };
      
      // Optimistic UI updates
      setUser(prevUser => prevUser ? { ...auth.currentUser!, photoURL: CHRYSALIS_AVATAR_IDENTIFIER } : null );
      setUserProfile(prevProfile => {
        if (!prevProfile) return null;
        return { ...prevProfile, photoURL: CHRYSALIS_AVATAR_IDENTIFIER, activeChrysalisThemeId: coinToActivate.id };
      });

      // Firestore updates
      await updateProfile(auth.currentUser!, { photoURL: CHRYSALIS_AVATAR_IDENTIFIER });
      await updateUserProfileInFirestore(uid, updates);
      
      applyTheme(coinToActivate.id);
      toast({ title: 'Theme Activated!', description: `${coinToActivate.name} theme is now active.` });
      
      setJustCollectedCoin(null);
      internalSetShowStreakModal(false);
      
      if (!fromProfileActivation) { // Only navigate if not triggered by the "activate chrysalis avatar" button on profile page
         router.push(`/profile/${uid}`);
      }

    } catch (e) {
      console.error('Failed to activate theme:', e);
      toast({ title: 'Theme Activation Failed', description: (e as Error).message, variant: 'destructive' });
      await fetchUserProfile(uid, false); // Re-fetch to ensure consistency
      setJustCollectedCoin(null);
      internalSetShowStreakModal(false);
    }
  };

  const clearJustCollectedCoinDetails = () => {
    setJustCollectedCoin(null);
    // The modal closing itself will be handled by its onOpenChange or explicit close button.
    // If modal is still open, it will revert to its initial display logic.
  };


  const internalSetShowLogStepsModal = (show: boolean, origin: LogStepsModalOrigin = 'direct') => {
    _setShowLogStepsModal(show);
    if (show) {
      setLogStepsFlowOrigin(origin);
    } else {
      if (origin === 'direct' || !show) { 
         setLogStepsFlowOrigin(null);
      }
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
      collectDailyChrysalisCoin,
      applyTheme,
      activeChrysalisThemeId,
      showLogStepsModal: _showLogStepsModal,
      setShowLogStepsModal: internalSetShowLogStepsModal,
      logStepsFlowOrigin,
      justCollectedCoin,
      activateThemeFromCollectedCoin,
      clearJustCollectedCoinDetails,
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
