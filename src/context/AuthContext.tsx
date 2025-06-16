
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
import { isChallengeActive, getChallengeDayNumberFromDateString } from '@/lib/dateUtils';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { arrayUnion, doc, updateDoc } from 'firebase/firestore';
import { ALL_CHRYSALIS_VARIANTS, getChrysalisVariantByDay, getChrysalisVariantById } from '@/lib/chrysalisVariants';
import { ALL_BADGES, type BadgeId } from '@/lib/badges';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_THEME_VALUES = {
  primary: "39 100% 50%",
  primaryForeground: "0 0% 100%",
  accent: "51 100% 50%",
  accentForeground: "39 60% 30%",
};

const EXPLORER_SECTIONS: readonly ExplorerSectionKey[] = ['profile', 'dashboard', 'community', 'donate'] as const;
const EXPLORER_BADGE_ID: BadgeId = 'explorer-award';


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

      const currentClientDate = getTodaysDateClientLocal();
      const challengeCurrentlyActive = isChallengeActive(new Date(currentClientDate + "T00:00:00")); // Pass date to ensure override is used

      if (isInitialAuthEvent && finalProfile?.profileComplete && challengeCurrentlyActive) {
        // Logic for first login during an active challenge day
        if (!hasSeenWelcomeMigrationModal) {
          setShowDailyMotivationModalState(true);
          setHasSeenWelcomeMigrationModal(true); // Mark as seen for this session
        } else if (streakResult.streakProcessedForToday && !showDailyGoalMetModal && !justCollectedCoin) {
          // Subsequent logins on an active day if they haven't collected the coin yet via DailyGoalMetModal
          setShowDailyMotivationModalState(true);
        }
      } else if (isInitialAuthEvent && !isPostSignup && finalProfile && !finalProfile.profileComplete) {
        // Existing user, profile incomplete
        toast({ title: 'Welcome!', description: "Let's complete your profile setup." });
      } else if (isInitialAuthEvent && !isPostSignup && !finalProfile) {
        // New user, no profile yet
        toast({ title: 'Welcome!', description: "Please set up your profile to get started." });
      } else if (isInitialAuthEvent && !isPostSignup && finalProfile?.profileComplete && !challengeCurrentlyActive){
        // Existing user, profile complete, but challenge NOT active
        toast({ title: 'Welcome Back!'}); // Simple welcome
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

        if (badgesActuallyAwardedInThisCall.length > 0 && !newlyEarnedBadgeToShow) {
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
      // console.error("Failed to fetch/update user profile:", e);
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
            setHasSeenWelcomeMigrationModal(false); // Reset for new user/session
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
      // console.error("Logout failed:", e);
      router.push('/');
      if (auth.currentUser) {
        // Still logged in, unusual state, perhaps try to force clear local state
      } else {
        // Cleared in onAuthStateChanged
      }
      setIsLoggingOut(false); // Ensure this is reset even on error
      setLoading(false); // And this
    }
  };


  const controlledSetShowChrysalisJourneyModal = (show: boolean) => {
    setShowChrysalisJourneyModalReactState(show);
    if (!show) {
        if (chrysalisJourneyModalContext === 'login' && justCollectedCoin && !activeChrysalisThemeId?.startsWith('coin_day_')) {
            // console.log("[AuthContext] Closing ChrysalisJourneyModal after gamified view, clearing justCollectedCoin.");
            clearJustCollectedCoinDetails();
        }
        // console.log("[AuthContext] Closing ChrysalisJourneyModal, resetting context to 'login'.");
        setChrysalisJourneyModalContext('login');
    }
  };

  const setShowNewBadgeModal = (badge: BadgeData | null) => {
    if (badge) {
      // console.log("[AuthContext] Showing new badge modal for:", badge.name);
      setNewlyEarnedBadgeToShow(badge);
    } else {
      // console.log("[AuthContext] Hiding new badge modal.");
      // Delay slightly to allow fade-out animations
      setTimeout(() => setNewlyEarnedBadgeToShow(null), 300);
    }
  };


 const collectDailyChrysalisCoin = async () => {
    if (!user || !userProfile) {
      toast({ title: 'Error', description: 'You must be logged in to collect a coin.', variant: 'destructive' });
      return;
    }
    const currentClientDate = getTodaysDateClientLocal();
    if (!isChallengeActive(new Date(currentClientDate + "T00:00:00"))) {
      toast({ title: 'Challenge Not Active', description: 'Coins can only be collected during the challenge period.', variant: 'default' });
      setCanCollectTodaysChrysalisCoinState(false);
      setShowChrysalisJourneyModalReactState(false);
      return;
    }
    const uid = user.uid;

    if (userProfile.chrysalisCoinDates?.includes(currentClientDate)) {
      // console.log(`[AuthContext.collectDailyChrysalisCoin] Coin for ${currentClientDate} already collected.`);
      const dayNumber = getChallengeDayNumberFromDateString(currentClientDate);
      const variant = getChrysalisVariantByDay(dayNumber); // This now always returns a variant or a robust fallback
      setJustCollectedCoin(variant); // Set it to re-show the collected view if modal is opened
      setCanCollectTodaysChrysalisCoinState(false);
      setShowChrysalisJourneyModalReactState(true); // Show the gamified view
      setChrysalisJourneyModalContext('login');
      return;
    }

    try {
      const userDocRef = doc(db, "users", uid);
      await updateDoc(userDocRef, {
        chrysalisCoinDates: arrayUnion(currentClientDate)
      });
      // console.log(`[AuthContext.collectDailyChrysalisCoin] User ${uid} collected coin for ${currentClientDate}. Firestore updated.`);

      setUserProfile(prevProfile => {
        if (!prevProfile) return null;
        const existingDates = prevProfile.chrysalisCoinDates || [];
        const newCoinDates = existingDates.includes(currentClientDate) ? existingDates : [...existingDates, currentClientDate];
        return { ...prevProfile, chrysalisCoinDates: newCoinDates };
      });

      const dayNumber = getChallengeDayNumberFromDateString(currentClientDate);
      const variant = getChrysalisVariantByDay(dayNumber); // Should always return a valid object
      // console.log(`[AuthContext.collectDailyChrysalisCoin] Variant for day ${dayNumber} (${currentClientDate}):`, variant);

      setJustCollectedCoin(variant); // Set the specific coin that was just collected
      setShowChrysalisJourneyModalReactState(true); // Trigger the modal
      setChrysalisJourneyModalContext('login'); // Ensure it uses the 'gamified' view logic
      setCanCollectTodaysChrysalisCoinState(false); // Reset the flag

    } catch (e) {
      // console.error('Failed to collect chrysalis coin:', e);
      toast({ title: 'Collection Failed', description: (e as Error).message, variant: 'destructive' });
      await fetchUserProfile(uid); // Refetch profile to ensure consistency
    }
  };


  const activateThemeFromCollectedCoin = async (coinToActivate: ChrysalisVariantData, fromProfileActivation: boolean = false) => {
    if (!user || !userProfile) {
      toast({ title: 'Error', description: 'User not found.', variant: 'destructive' });
      return;
    }
    const currentClientDate = getTodaysDateClientLocal();
    if (!isChallengeActive(new Date(currentClientDate + "T00:00:00")) && !fromProfileActivation) {
      toast({ title: 'Challenge Not Active', description: 'Themes can primarily be activated during the challenge.', variant: 'default' });
      return;
    }
    const uid = user.uid;
    try {
      const updates: Partial<UserProfile> = {
        activeChrysalisThemeId: coinToActivate.id,
        photoURL: CHRYSALIS_AVATAR_IDENTIFIER, // Ensure avatar is set to Chrysalis mode
      };

      // Optimistically update local state for immediate UI feedback
      setUser(prevUser => prevUser ? { ...auth.currentUser!, photoURL: CHRYSALIS_AVATAR_IDENTIFIER } : null ); // This updates the FirebaseUser object in context
      setUserProfile(prevProfile => {
        if (!prevProfile) return null;
        return { ...prevProfile, photoURL: CHRYSALIS_AVATAR_IDENTIFIER, activeChrysalisThemeId: coinToActivate.id };
      });
      applyTheme(coinToActivate.id); // Apply visual theme

      // Persist to Firebase Auth profile (if user wants their Firebase Auth photo updated)
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL: CHRYSALIS_AVATAR_IDENTIFIER });
      }
      // Persist to Firestore
      await updateUserProfileInFirestore(uid, updates);
      // console.log(`[AuthContext.activateTheme] Theme "${coinToActivate.name}" activated for user ${uid}. Firestore and Auth updated.`);

      toast({ title: 'Theme Activated!', description: `${coinToActivate.name} theme is now active.` });

      setShowChrysalisJourneyModalReactState(false); // Close the journey modal if it was open
      clearJustCollectedCoinDetails(); // Clear the 'just collected' state

      if (!fromProfileActivation) { // Don't navigate if activated from profile (CoinThemeActivationModal)
         router.push(`/profile/${uid}`); // Navigate to profile to see changes
      }

    } catch (e) {
      // console.error('Failed to activate theme:', e);
      toast({ title: 'Theme Activation Failed', description: (e as Error).message, variant: 'destructive' });
      await fetchUserProfile(uid); // Re-fetch to revert optimistic updates if needed
    }
  };

  const clearJustCollectedCoinDetails = () => {
    // console.log("[AuthContext] Clearing justCollectedCoin details.");
    setJustCollectedCoin(null);
  };


  const controlledSetShowLogStepsModal = (show: boolean, origin: LogStepsModalOrigin = 'direct') => {
    // console.log(`[AuthContext] setShowLogStepsModal called. Show: ${show}, Origin: ${origin}`);
    setShowLogStepsModalReactState(show);
    if (show) {
      setLogStepsFlowOrigin(origin);
    } else {
      // Reset origin only if closing from a 'direct' call or if explicitly told to hide
      if (origin === 'direct' || !show) {
         // console.log("[AuthContext] Resetting logStepsFlowOrigin to null.");
         setLogStepsFlowOrigin(null);
      }
    }
  };

  const recordSectionVisit = useCallback(async (sectionKey: ExplorerSectionKey) => {
    if (!user || !userProfile || !userProfile.profileComplete) {
      // console.log("[AuthContext.recordSectionVisit] User or profile not available/complete. Skipping.");
      return;
    }
    const currentVisited = userProfile.visitedSections || [];
    if (currentVisited.includes(sectionKey)) {
      // console.log(`[AuthContext.recordSectionVisit] Section ${sectionKey} already visited. Skipping.`);
      return;
    }

    // console.log(`[AuthContext.recordSectionVisit] Recording visit to section: ${sectionKey}`);
    const newVisitedSections = [...currentVisited, sectionKey];
    setUserProfile(prev => prev ? { ...prev, visitedSections: newVisitedSections } : null); // Optimistic update
    try {
      await updateUserProfileInFirestore(user.uid, { visitedSections: newVisitedSections });

      // Check for Explorer Badge
      const allRequiredVisited = EXPLORER_SECTIONS.every(key => newVisitedSections.includes(key));
      const hasExplorerBadge = userProfile.badgesEarned?.includes(EXPLORER_BADGE_ID);

      if (allRequiredVisited && !hasExplorerBadge) {
        // console.log("[AuthContext.recordSectionVisit] All explorer sections visited. Attempting to award explorer badge.");
        const awardedBadge = await awardSpecificBadgeIfUnearned(user.uid, EXPLORER_BADGE_ID);
        if (awardedBadge) {
          setShowNewBadgeModal(awardedBadge);
          await fetchUserProfile(user.uid); // Refresh profile to include the new badge
        }
      }
    } catch (e) {
      // console.error("Failed to record section visit or award explorer badge:", e);
      // Revert optimistic update if Firestore fails
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
        setPendingChallengeInvitationToShow(null); // Clear the shown invitation
        await fetchUserProfile(user.uid); // Refresh profile, might have badge implications or challenge list updates
    } catch (e) {
        toast({ title: "Failed to Accept Challenge", description: (e as Error).message, variant: "destructive" });
        // console.error("Failed to accept challenge:", e);
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
        setPendingChallengeInvitationToShow(null); // Clear the shown invitation
        await fetchUserProfile(user.uid);
    } catch (e) {
        toast({ title: "Failed to Decline Challenge", description: (e as Error).message, variant: "destructive" });
        // console.error("Failed to decline challenge:", e);
    }
  };

  const controlledSetShowChallengeInvitationModal = (challenge: Challenge | null) => {
    setPendingChallengeInvitationToShow(challenge);
  };

  const setCanCollectTodaysChrysalisCoin = (can: boolean) => {
    // console.log(`[AuthContext] setCanCollectTodaysChrysalisCoin called with: ${can}`);
    setCanCollectTodaysChrysalisCoinState(can);
  };

  const controlledSetShowDailyMotivationModal = (show: boolean) => {
    // console.log(`[AuthContext] setShowDailyMotivationModalState called with: ${show}`);
    setShowDailyMotivationModalState(show);
  };

  const TEST_ONLY_triggerDailyMotivationModal = () => {
    if (process.env.NODE_ENV === 'development') {
      // console.log("[AuthContext TEST_ONLY] Attempting to trigger DailyMotivationModal.");
      if (userProfile?.profileComplete) {
        const currentClientDate = getTodaysDateClientLocal();
        if (isChallengeActive(new Date(currentClientDate + "T00:00:00"))) {
          setShowDailyMotivationModalState(true);
          // console.log("[AuthContext TEST_ONLY] DailyMotivationModal triggered.");
        } else {
          // console.log("[AuthContext TEST_ONLY] Challenge is not active for the current (or overridden) date. Modal not shown.");
          alert("TEST_ONLY: Challenge is not active for the current (or overridden) date. DailyMotivationModal cannot be shown.");
        }
      } else {
        // console.log("[AuthContext TEST_ONLY] Profile not complete. Modal not shown.");
        alert("TEST_ONLY: User profile is not complete. DailyMotivationModal cannot be shown.");
      }
    } else {
      // console.warn("TEST_ONLY_triggerDailyMotivationModal called in non-development environment. Action skipped.");
    }
  };

  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && user) {
      (window as any).triggerDM = TEST_ONLY_triggerDailyMotivationModal;
      // console.log("[AuthContext TEST_ONLY] window.triggerDM() is now available for testing.");
    }
    return () => {
      if (process.env.NODE_ENV === 'development') {
        delete (window as any).triggerDM;
        // console.log("[AuthContext TEST_ONLY] window.triggerDM() removed.");
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userProfile]);


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
      // activateChrysalisAsAvatar removed
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
