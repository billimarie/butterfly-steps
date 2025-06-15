
'use client';

import type { User as FirebaseUser } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut as firebaseSignOut, updateProfile } from 'firebase/auth';
import type { UserProfile, AuthContextType, StreakUpdateResults, BadgeData, StreakModalViewContext, LogStepsModalOrigin, ChrysalisVariantData, ExplorerSectionKey, Challenge } from '@/types';
import { CHRYSALIS_AVATAR_IDENTIFIER } from '@/types';
import {
  getUserProfile,
  updateUserStreakOnLogin,
  updateUserProfile as updateUserProfileInFirestore,
  getDailyStepForDate,
  getTodaysDateClientLocal,
  checkAndAwardBadges as checkAndAwardStepBadges,
  awardSpecificBadgeIfUnearned,
  getPendingChallengeInvitations, 
  acceptChallenge as acceptChallengeService, 
  declineChallenge as declineChallengeService, 
} from '@/lib/firebaseService';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { arrayUnion, doc, updateDoc } from 'firebase/firestore';
import { ALL_CHRYSALIS_VARIANTS, getChrysalisVariantByDay } from '@/lib/chrysalisVariants';
import { ALL_BADGES } from '@/lib/badges';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_THEME_VALUES = {
  primary: "39 100% 50%",
  primaryForeground: "0 0% 100%",
  accent: "51 100% 50%",
  accentForeground: "39 60% 30%",
};

const EXPLORER_SECTIONS: readonly ExplorerSectionKey[] = ['profile', 'dashboard', 'community', 'donate'] as const;
const EXPLORER_BADGE_ID: BadgeId = 'explorer-award';


function getChallengeDayNumber(dateString: string): number {
  const [year, month, day] = dateString.split('-').map(Number);
  const currentDate = new Date(Date.UTC(year, month - 1, day));

  const challengeStartDate = new Date(Date.UTC(currentDate.getUTCFullYear(), 5, 21));

  if (currentDate < challengeStartDate) return 0;

  const diffTime = currentDate.getTime() - challengeStartDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  const dayNumber = diffDays + 1;
  return Math.max(1, Math.min(dayNumber, 133));
}


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false); // New state
  const [error, setError] = useState<Error | null>(null);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [streakModalContext, setStreakModalContext] = useState<StreakModalViewContext>('login');
  const [showDailyGoalMetModal, setShowDailyGoalMetModal] = useState(false);
  const [newlyEarnedBadgeToShow, setNewlyEarnedBadgeToShow] = useState<BadgeData | null>(null);
  const [activeChrysalisThemeId, setActiveChrysalisThemeId] = useState<string | null | undefined>(undefined);

  const [_showLogStepsModal, _setShowLogStepsModal] = useState(false);
  const [logStepsFlowOrigin, setLogStepsFlowOrigin] = useState<LogStepsModalOrigin>(null);
  const [justCollectedCoin, setJustCollectedCoin] = useState<ChrysalisVariantData | null>(null);

  const [showWelcomeMigrationModal, setShowWelcomeMigrationModal] = useState(false);
  const [hasSeenWelcomeMigrationModal, setHasSeenWelcomeMigrationModal] = useState(false);

  const [pendingChallengeInvitationToShow, setPendingChallengeInvitationToShow] = useState<Challenge | null>(null);


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

  const fetchUserProfile = useCallback(async (
    uid: string,
    isInitialAuthEvent: boolean = false,
    isPostSignup: boolean = false,
    isFirstStepSubmissionViaWelcomeFlow: boolean = false
  ) => {
    setLoading(true);
    setError(null);
    try {
      const streakResult = await updateUserStreakOnLogin(uid);
      let finalProfile = await getUserProfile(uid);

      const isFirstTimeSignupExperience = isInitialAuthEvent && isPostSignup && !hasSeenWelcomeMigrationModal && finalProfile?.profileComplete;

      if (isFirstTimeSignupExperience) {
        setShowWelcomeMigrationModal(true);
        setHasSeenWelcomeMigrationModal(true);
      } else {
        if (isInitialAuthEvent && !isPostSignup && finalProfile?.profileComplete && !isFirstStepSubmissionViaWelcomeFlow) {
          toast({ title: 'Welcome Back!' });
          if (streakResult.streakProcessedForToday) {
            setStreakModalContext('login');
            setShowStreakModal(true);
          }
        } else if (isInitialAuthEvent && !isPostSignup && finalProfile && !finalProfile.profileComplete) {
          toast({ title: 'Welcome!', description: "Let's complete your profile setup." });
        } else if (isInitialAuthEvent && !isPostSignup && !finalProfile) {
          toast({ title: 'Welcome!', description: "Please set up your profile to get started." });
        }
      }

      if (finalProfile) {
        let currentEarnedBadges = finalProfile.badgesEarned ? [...finalProfile.badgesEarned] : [];
        let badgesActuallyAwardedInThisCall: BadgeData[] = [];
        let profileBadgesChanged = false;

        const streakValueForBadgeCheck = streakResult.updatedStreakCount;

        const streakBadgesToConsider = ALL_BADGES.filter(badge => badge.type === 'streak');
        for (const streakBadge of streakBadgesToConsider) {
          if (streakValueForBadgeCheck >= streakBadge.milestone && !currentEarnedBadges.includes(streakBadge.id)) {
            currentEarnedBadges.push(streakBadge.id);
            badgesActuallyAwardedInThisCall.push(streakBadge);
            profileBadgesChanged = true;
          }
        }

        const newlyAwardedStepBadges = await checkAndAwardStepBadges(uid, finalProfile.currentSteps, currentEarnedBadges);
        for (const stepBadge of newlyAwardedStepBadges) {
            if (!currentEarnedBadges.includes(stepBadge.id)) {
                currentEarnedBadges.push(stepBadge.id);
                badgesActuallyAwardedInThisCall.push(stepBadge);
                profileBadgesChanged = true;
            }
        }

        if (profileBadgesChanged) {
          await updateUserProfileInFirestore(uid, { badgesEarned: currentEarnedBadges });
          finalProfile.badgesEarned = currentEarnedBadges;
        }

        if (!isFirstTimeSignupExperience && !isFirstStepSubmissionViaWelcomeFlow && badgesActuallyAwardedInThisCall.length > 0 && !newlyEarnedBadgeToShow) {
            setNewlyEarnedBadgeToShow(badgesActuallyAwardedInThisCall[0]);
            for (let i = 1; i < badgesActuallyAwardedInThisCall.length; i++) {
                const badge = badgesActuallyAwardedInThisCall[i];
                 toast({
                    title: `${badge.type.charAt(0).toUpperCase() + badge.type.slice(1)} Badge Unlocked!`,
                    description: `You've also earned the "${badge.name}" badge! View it on your profile.`,
                    duration: 5000,
                 });
            }
        }
        if (finalProfile.profileComplete) {
            const invitations = await getPendingChallengeInvitations(uid);
            if (invitations.length > 0 && !pendingChallengeInvitationToShow) { 
                setPendingChallengeInvitationToShow(invitations[0]);
            }
        }

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
      if (isInitialAuthEvent && !isPostSignup && !isFirstStepSubmissionViaWelcomeFlow) {
        toast({ title: 'Profile Load Issue', description: "There was an issue loading your full profile details." });
      }
    } finally {
        setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast, applyTheme, newlyEarnedBadgeToShow, hasSeenWelcomeMigrationModal, pendingChallengeInvitationToShow ]);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setError(null);
      if (firebaseUser) {
        const isNewAuthUser = user === null || firebaseUser.uid !== user?.uid;
        setLoading(true); // Set loading true when auth state changes to user
        setUser(firebaseUser);
        if (isNewAuthUser) {
            await fetchUserProfile(firebaseUser.uid, true, false, false);
        } else {
            // User is the same, profile might have been updated elsewhere, or just apply theme
            if (userProfile?.activeChrysalisThemeId) {
                applyTheme(userProfile.activeChrysalisThemeId);
            } else {
                applyTheme(null);
            }
            setLoading(false); // No full fetch, so set loading false
        }
      } else { // firebaseUser is null (logged out)
        setUser(null);
        setUserProfile(null);
        setShowStreakModal(false);
        setStreakModalContext('login');
        setShowDailyGoalMetModal(false);
        setNewlyEarnedBadgeToShow(null);
        _setShowLogStepsModal(false);
        setLogStepsFlowOrigin(null);
        setJustCollectedCoin(null);
        setShowWelcomeMigrationModal(false);
        setHasSeenWelcomeMigrationModal(false);
        setPendingChallengeInvitationToShow(null);
        applyTheme(null);
        setLoading(false);
        setIsLoggingOut(false); // Ensure isLoggingOut is false after state is cleared
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
      setShowWelcomeMigrationModal(false);
      setHasSeenWelcomeMigrationModal(false);
      setPendingChallengeInvitationToShow(null);
      applyTheme(null);
      setLoading(false);
      setIsLoggingOut(false);
    });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchUserProfile, user, applyTheme]); // Removed userProfile from here to avoid loops if profile updates trigger refetch unnecessarily

  const setUserProfileState = (profile: UserProfile | null) => {
    setUserProfile(profile);
    if (profile?.activeChrysalisThemeId) {
      applyTheme(profile.activeChrysalisThemeId);
    } else if (profile === null) {
      applyTheme(null);
    }
  };

  const logout = async () => {
    setIsLoggingOut(true);
    try {
      router.push('/'); 
      await firebaseSignOut(auth);
      // `onAuthStateChanged` will handle resetting user state, profile, loading, and isLoggingOut
    } catch (e) {
      setError(e as Error);
      console.error("Logout failed:", e);
      // Attempt to gracefully handle a failed sign-out
      router.push('/'); // Ensure redirect to home
      if (auth.currentUser) { // If sign-out *really* failed, user might still be "logged in"
        // Don't clear local state if Firebase still thinks user is logged in, to avoid inconsistency
      } else {
        // If Firebase auth state is null despite error, manually clear things as a fallback
        setUser(null); setUserProfile(null); setShowStreakModal(false); /* ...etc. */ applyTheme(null);
      }
      setIsLoggingOut(false); // Reset flag on error
      setLoading(false); // Ensure loading is false if onAuthStateChanged doesn't handle it
    }
  };

  const internalSetShowStreakModal = (show: boolean) => {
    setShowStreakModal(show);
    if (!show) {
      setStreakModalContext('login');
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

    const goldenChrysalisVariant = getChrysalisVariantByDay(1);
    if (!goldenChrysalisVariant) {
      toast({ title: 'Theme Error', description: 'Default Chrysalis theme not found.', variant: 'destructive' });
      return;
    }

    await activateThemeFromCollectedCoin(goldenChrysalisVariant, true);
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
      const dayNumber = getChallengeDayNumber(currentDate);
      const variant = getChrysalisVariantByDay(dayNumber);
      if (variant) setJustCollectedCoin(variant);
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
        setJustCollectedCoin(variant);
      } else {
        console.error(`Could not find Chrysalis variant for day ${dayNumber}`);
        internalSetShowStreakModal(false);
      }

    } catch (e) {
      console.error('Failed to collect chrysalis coin:', e);
      toast({ title: 'Collection Failed', description: (e as Error).message, variant: 'destructive' });
      await fetchUserProfile(uid, false, false, false);
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
        photoURL: CHRYSALIS_AVATAR_IDENTIFIER,
      };

      setUser(prevUser => prevUser ? { ...auth.currentUser!, photoURL: CHRYSALIS_AVATAR_IDENTIFIER } : null );
      setUserProfile(prevProfile => {
        if (!prevProfile) return null;
        return { ...prevProfile, photoURL: CHRYSALIS_AVATAR_IDENTIFIER, activeChrysalisThemeId: coinToActivate.id };
      });

      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL: CHRYSALIS_AVATAR_IDENTIFIER });
      }
      await updateUserProfileInFirestore(uid, updates);

      applyTheme(coinToActivate.id);
      toast({ title: 'Theme Activated!', description: `${coinToActivate.name} theme is now active.` });

      setJustCollectedCoin(null);
      internalSetShowStreakModal(false);

      if (!fromProfileActivation) {
         router.push(`/profile/${uid}`);
      }

    } catch (e) {
      console.error('Failed to activate theme:', e);
      toast({ title: 'Theme Activation Failed', description: (e as Error).message, variant: 'destructive' });
      await fetchUserProfile(uid, false, false, false);
      setJustCollectedCoin(null);
      internalSetShowStreakModal(false);
    }
  };

  const clearJustCollectedCoinDetails = () => {
    setJustCollectedCoin(null);
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

  const recordSectionVisit = useCallback(async (sectionKey: ExplorerSectionKey) => {
    if (!user || !userProfile || !userProfile.profileComplete) {
      return;
    }
    const currentVisited = userProfile.visitedSections || [];
    if (currentVisited.includes(sectionKey)) {
      return;
    }

    const newVisitedSections = [...currentVisited, sectionKey];
    setUserProfile(prev => prev ? { ...prev, visitedSections: newVisitedSections } : null);
    try {
      await updateUserProfileInFirestore(user.uid, { visitedSections: newVisitedSections });

      const allRequiredVisited = EXPLORER_SECTIONS.every(key => newVisitedSections.includes(key));
      const hasExplorerBadge = userProfile.badgesEarned?.includes(EXPLORER_BADGE_ID);

      if (allRequiredVisited && !hasExplorerBadge) {
        const awardedBadge = await awardSpecificBadgeIfUnearned(user.uid, EXPLORER_BADGE_ID);
        if (awardedBadge) {
          setShowNewBadgeModal(awardedBadge);
          await fetchUserProfile(user.uid);
        }
      }
    } catch (e) {
      console.error("Failed to record section visit or award explorer badge:", e);
      setUserProfile(prev => prev ? { ...prev, visitedSections: currentVisited } : null);
    }
  }, [user, userProfile, fetchUserProfile, setShowNewBadgeModal]);

  const acceptChallengeInvitation = async (challengeId: string) => {
    if (!user) {
        toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
        return;
    }
    try {
        await acceptChallengeService(challengeId, user.uid);
        toast({ title: "Challenge Accepted!", description: "Let the friendly competition begin!" });
        setPendingChallengeInvitationToShow(null); 
        await fetchUserProfile(user.uid); 
    } catch (e) {
        toast({ title: "Failed to Accept Challenge", description: (e as Error).message, variant: "destructive" });
        console.error("Failed to accept challenge:", e);
    }
  };

  const declineChallengeInvitation = async (challengeId: string) => {
    if (!user) {
        toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
        return;
    }
    try {
        await declineChallengeService(challengeId, user.uid);
        toast({ title: "Challenge Declined", description: "The challenge invitation has been declined." });
        setPendingChallengeInvitationToShow(null);
        await fetchUserProfile(user.uid); 
    } catch (e) {
        toast({ title: "Failed to Decline Challenge", description: (e as Error).message, variant: "destructive" });
        console.error("Failed to decline challenge:", e);
    }
  };

  const internalSetShowChallengeInvitationModal = (challenge: Challenge | null) => {
    setPendingChallengeInvitationToShow(challenge);
  };


  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      loading,
      isLoggingOut, // Pass down new state
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
      showWelcomeMigrationModal,
      setShowWelcomeMigrationModal,
      recordSectionVisit,
      pendingChallengeInvitationToShow,
      setShowChallengeInvitationModal: internalSetShowChallengeInvitationModal,
      acceptChallengeInvitation,
      declineChallengeInvitation,
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
