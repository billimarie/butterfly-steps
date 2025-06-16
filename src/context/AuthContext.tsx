
'use client';

import type { User as FirebaseUser } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut as firebaseSignOut, updateProfile } from 'firebase/auth';
import type { UserProfile, AuthContextType, StreakUpdateResults, BadgeData, ChrysalisJourneyModalContext, LogStepsModalOrigin, ChrysalisVariantData, ExplorerSectionKey, Challenge } from '@/types';
import { CHRYSALIS_AVATAR_IDENTIFIER, CHALLENGE_DURATION_DAYS } from '@/types';
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
import { ALL_CHRYSALIS_VARIANTS, getChrysalisVariantByDay, getChrysalisVariantById } from '@/lib/chrysalisVariants';
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
  return Math.max(1, Math.min(dayNumber, CHALLENGE_DURATION_DAYS));
}


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const [showChrysalisJourneyModalReactState, setShowChrysalisJourneyModalReactState] = useState(false);
  const [chrysalisJourneyModalContext, setChrysalisJourneyModalContext] = useState<ChrysalisJourneyModalContext>('login');

  const [showDailyGoalMetModal, setShowDailyGoalMetModal] = useState(false);
  const [newlyEarnedBadgeToShow, setNewlyEarnedBadgeToShow] = useState<BadgeData | null>(null);
  const [activeChrysalisThemeId, setActiveChrysalisThemeId] = useState<string | null | undefined>(undefined);
  const [showLogStepsModalReactState, setShowLogStepsModalReactState] = useState(false);
  const [logStepsFlowOrigin, setLogStepsFlowOrigin] = useState<LogStepsModalOrigin>(null);
  const [justCollectedCoin, setJustCollectedCoin] = useState<ChrysalisVariantData | null>(null);
  const [showWelcomeMigrationModal, setShowWelcomeMigrationModal] = useState(false);
  const [hasSeenWelcomeMigrationModal, setHasSeenWelcomeMigrationModal] = useState(false);
  const [pendingChallengeInvitationToShow, setPendingChallengeInvitationToShow] = useState<Challenge | null>(null);
  const [canCollectTodaysChrysalisCoin, setCanCollectTodaysChrysalisCoinState] = useState(false);
  const [showDailyMotivationModal, setShowDailyMotivationModalState] = useState(false);


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
    let streakResult: StreakUpdateResults | null = null;
    try {
      streakResult = await updateUserStreakOnLogin(uid);
      let finalProfile = await getUserProfile(uid);

      const isFirstTimeSignupExperience = isInitialAuthEvent && isPostSignup && !hasSeenWelcomeMigrationModal && finalProfile?.profileComplete;

      if (isFirstTimeSignupExperience) {
        setShowWelcomeMigrationModal(true);
        setHasSeenWelcomeMigrationModal(true);
      } else if (isInitialAuthEvent && !isPostSignup && finalProfile?.profileComplete) {
        toast({ title: 'Welcome Back!' });
        if (finalProfile.photoURL !== CHRYSALIS_AVATAR_IDENTIFIER && streakResult.streakProcessedForToday) {
            setChrysalisJourneyModalContext('login');
            setShowChrysalisJourneyModalReactState(true); // Show avatar activation
        } else if (finalProfile.photoURL === CHRYSALIS_AVATAR_IDENTIFIER && streakResult.streakProcessedForToday && !showDailyGoalMetModal && !justCollectedCoin) {
            // Chrysalis avatar is active, show DailyMotivationModal instead of ChrysalisJourney directly
            setShowDailyMotivationModalState(true);
        }
      } else if (isInitialAuthEvent && !isPostSignup && finalProfile && !finalProfile.profileComplete) {
        toast({ title: 'Welcome!', description: "Let's complete your profile setup." });
      } else if (isInitialAuthEvent && !isPostSignup && !finalProfile) {
        toast({ title: 'Welcome!', description: "Please set up your profile to get started." });
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
  }, [toast, applyTheme, newlyEarnedBadgeToShow, hasSeenWelcomeMigrationModal, pendingChallengeInvitationToShow, showDailyGoalMetModal, justCollectedCoin]);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setError(null);
      if (firebaseUser) {
        const isNewAuthUser = user === null || firebaseUser.uid !== user?.uid;
        setLoading(true);
        setUser(firebaseUser);
        if (isNewAuthUser) {
            await fetchUserProfile(firebaseUser.uid, true, false, false);
        } else {
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
        setShowChrysalisJourneyModalReactState(false);
        setChrysalisJourneyModalContext('login');
        setShowDailyGoalMetModal(false);
        setNewlyEarnedBadgeToShow(null);
        setShowLogStepsModalReactState(false);
        setLogStepsFlowOrigin(null);
        setJustCollectedCoin(null);
        setShowWelcomeMigrationModal(false);
        setHasSeenWelcomeMigrationModal(false);
        setPendingChallengeInvitationToShow(null);
        setCanCollectTodaysChrysalisCoinState(false);
        setShowDailyMotivationModalState(false);
        applyTheme(null);
        setLoading(false);
        setIsLoggingOut(false);
      }
    }, (authError) => {
      setError(authError as Error);
      setUser(null);
      setUserProfile(null);
      setShowChrysalisJourneyModalReactState(false);
      setChrysalisJourneyModalContext('login');
      setShowDailyGoalMetModal(false);
      setNewlyEarnedBadgeToShow(null);
      setShowLogStepsModalReactState(false);
      setLogStepsFlowOrigin(null);
      setJustCollectedCoin(null);
      setShowWelcomeMigrationModal(false);
      setHasSeenWelcomeMigrationModal(false);
      setPendingChallengeInvitationToShow(null);
      setCanCollectTodaysChrysalisCoinState(false);
      setShowDailyMotivationModalState(false);
      applyTheme(null);
      setLoading(false);
      setIsLoggingOut(false);
    });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchUserProfile, user, applyTheme]);

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
    } catch (e) {
      setError(e as Error);
      console.error("Logout failed:", e);
      router.push('/');
      if (auth.currentUser) {
      } else {
        setUser(null); setUserProfile(null); setShowChrysalisJourneyModalReactState(false); applyTheme(null);
      }
      setIsLoggingOut(false); 
      setLoading(false); 
    }
  };


  const controlledSetShowChrysalisJourneyModal = (show: boolean) => {
    setShowChrysalisJourneyModalReactState(show);
    if (!show) {
        if (chrysalisJourneyModalContext === 'login' && justCollectedCoin && !activeChrysalisThemeId?.startsWith('coin_day_')) {
            clearJustCollectedCoinDetails();
        }
        setChrysalisJourneyModalContext('login');
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
      const dayNumber = getChallengeDayNumber(currentDate);
      const variant = getChrysalisVariantByDay(dayNumber);
      if (variant) {
        // Do not setJustCollectedCoin here if it's already collected
        // Instead, ensure the modal shows the "already collected" state or theme activation
        // If modal is opened from profile, this ensures it shows correctly
      }
      setCanCollectTodaysChrysalisCoinState(false);
      setShowChrysalisJourneyModalReactState(true); // Show the modal to display "already collected" or allow theme activation
      setChrysalisJourneyModalContext('login');
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

      const dayNumber = getChallengeDayNumber(currentDate);
      const variant = getChrysalisVariantByDay(dayNumber);
      if (variant) {
        setJustCollectedCoin(variant); // This is the key to show gamified view
        setShowChrysalisJourneyModalReactState(true);
        setChrysalisJourneyModalContext('login');
      } else {
        console.error(`Could not find Chrysalis variant for day ${dayNumber}`);
        toast({ title: 'Coin Collected!', description: "But couldn't display the special coin details." });
      }
      setCanCollectTodaysChrysalisCoinState(false); 

    } catch (e) {
      console.error('Failed to collect chrysalis coin:', e);
      toast({ title: 'Collection Failed', description: (e as Error).message, variant: 'destructive' });
      await fetchUserProfile(uid); 
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
      applyTheme(coinToActivate.id);

      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL: CHRYSALIS_AVATAR_IDENTIFIER });
      }
      await updateUserProfileInFirestore(uid, updates);

      toast({ title: 'Theme Activated!', description: `${coinToActivate.name} theme is now active.` });
      
      setShowChrysalisJourneyModalReactState(false);
      clearJustCollectedCoinDetails(); 

      if (!fromProfileActivation) {
         router.push(`/profile/${uid}`);
      }

    } catch (e) {
      console.error('Failed to activate theme:', e);
      toast({ title: 'Theme Activation Failed', description: (e as Error).message, variant: 'destructive' });
      await fetchUserProfile(uid); 
    }
  };

  const clearJustCollectedCoinDetails = () => {
    setJustCollectedCoin(null);
  };


  const controlledSetShowLogStepsModal = (show: boolean, origin: LogStepsModalOrigin = 'direct') => {
    setShowLogStepsModalReactState(show);
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

  const controlledSetShowChallengeInvitationModal = (challenge: Challenge | null) => {
    setPendingChallengeInvitationToShow(challenge);
  };

  const setCanCollectTodaysChrysalisCoin = (can: boolean) => {
    setCanCollectTodaysChrysalisCoinState(can);
  };

  const controlledSetShowDailyMotivationModal = (show: boolean) => {
    setShowDailyMotivationModalState(show);
  };


  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      loading,
      isLoggingOut,
      error,
      logout,
      fetchUserProfile,
      setUserProfileState,
      showChrysalisJourneyModal: showChrysalisJourneyModalReactState,
      setShowChrysalisJourneyModal: controlledSetShowChrysalisJourneyModal,
      chrysalisJourneyModalContext,
      setChrysalisJourneyModalContext,
      showDailyGoalMetModal,
      setShowDailyGoalMetModal,
      newlyEarnedBadgeToShow,
      setShowNewBadgeModal,
      activateChrysalisAsAvatar,
      collectDailyChrysalisCoin,
      applyTheme,
      activeChrysalisThemeId,
      showLogStepsModal: showLogStepsModalReactState,
      setShowLogStepsModal: controlledSetShowLogStepsModal,
      logStepsFlowOrigin,
      justCollectedCoin,
      activateThemeFromCollectedCoin,
      clearJustCollectedCoinDetails,
      showWelcomeMigrationModal,
      setShowWelcomeMigrationModal,
      recordSectionVisit,
      pendingChallengeInvitationToShow,
      setShowChallengeInvitationModal: controlledSetShowChallengeInvitationModal,
      acceptChallengeInvitation,
      declineChallengeInvitation,
      canCollectTodaysChrysalisCoin,
      setCanCollectTodaysChrysalisCoin,
      showDailyMotivationModal: showDailyMotivationModal,
      setShowDailyMotivationModal: controlledSetShowDailyMotivationModal,
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
