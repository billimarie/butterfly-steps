
'use client';

import type { User as FirebaseUser } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut as firebaseSignOut, updateProfile } from 'firebase/auth';
import type { UserProfile, AuthContextType, StreakUpdateResults, BadgeData, ChrysalisJourneyModalContext, LogStepsModalOrigin, ChrysalisVariantData, ExplorerSectionKey, Challenge } from '@/types';
import { CHRYSALIS_AVATAR_IDENTIFIER } from '@/types';
import {
  getUserProfile,
  updateUserStreakOnLogin,
  updateUserProfile as updateUserProfileInFirestore,
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

      const challengeCurrentlyActive = isChallengeActive(new Date(getTodaysDateClientLocal()));


      if (isInitialAuthEvent && finalProfile?.profileComplete && challengeCurrentlyActive) {
          if (!hasSeenWelcomeMigrationModal) {
            setShowDailyMotivationModalState(true);
            setHasSeenWelcomeMigrationModal(true);
          } else if (streakResult.streakProcessedForToday && !showDailyGoalMetModal && !justCollectedCoin) {
             setShowDailyMotivationModalState(true);
          }
      } else if (isInitialAuthEvent && finalProfile && !finalProfile.profileComplete && challengeCurrentlyActive) {
        // No longer show ChrysalisJourneyModal for avatar activation here.
        // Avatar activation is tied to first theme activation.
        // ProfileSetupForm will handle incomplete profiles.
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

 const collectDailyChrysalisCoin = async () => {
    if (!user || !userProfile) {
      toast({ title: 'Error', description: 'You must be logged in to collect a coin.', variant: 'destructive' });
      return;
    }
    if (!isChallengeActive(new Date(getTodaysDateClientLocal()))) {
      toast({ title: 'Challenge Not Active', description: 'Coins can only be collected during the challenge period.', variant: 'default' });
      setCanCollectTodaysChrysalisCoinState(false);
      setShowChrysalisJourneyModalReactState(false);
      return;
    }
    const uid = user.uid;
    const currentDate = getTodaysDateClientLocal();

    if (userProfile.chrysalisCoinDates?.includes(currentDate)) {
      const dayNumber = getChallengeDayNumberFromDateString(currentDate);
      const variant = getChrysalisVariantByDay(dayNumber);
      if (variant) {
      }
      setCanCollectTodaysChrysalisCoinState(false);
      setShowChrysalisJourneyModalReactState(true);
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

      const dayNumber = getChallengeDayNumberFromDateString(currentDate);
      const variant = getChrysalisVariantByDay(dayNumber);
      if (variant) {
        setJustCollectedCoin(variant);
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
    
    const challengeCurrentlyActive = isChallengeActive(new Date(getTodaysDateClientLocal()));
    if (!challengeCurrentlyActive && !fromProfileActivation) {
      toast({ title: 'Challenge Not Active', description: 'Themes can primarily be activated during the challenge.', variant: 'default' });
      return;
    }
    const uid = user.uid;
    try {
      const updates: Partial<UserProfile> = {
        activeChrysalisThemeId: coinToActivate.id,
      };
      
      // Set avatar to chrysalis if it's not already, upon first theme activation
      if (userProfile.photoURL !== CHRYSALIS_AVATAR_IDENTIFIER) {
        updates.photoURL = CHRYSALIS_AVATAR_IDENTIFIER;
      }

      setUserProfile(prevProfile => {
        if (!prevProfile) return null;
        return { 
          ...prevProfile, 
          photoURL: updates.photoURL !== undefined ? updates.photoURL : prevProfile.photoURL, 
          activeChrysalisThemeId: coinToActivate.id 
        };
      });
      applyTheme(coinToActivate.id);

      if (updates.photoURL === CHRYSALIS_AVATAR_IDENTIFIER && auth.currentUser && auth.currentUser.photoURL !== CHRYSALIS_AVATAR_IDENTIFIER) {
        await updateProfile(auth.currentUser, { photoURL: CHRYSALIS_AVATAR_IDENTIFIER });
      }
      await updateUserProfileInFirestore(uid, updates);

      let toastDescription = `${coinToActivate.name} theme is now active.`;
      if (updates.photoURL === CHRYSALIS_AVATAR_IDENTIFIER && userProfile.photoURL !== CHRYSALIS_AVATAR_IDENTIFIER) {
        toastDescription += " Your avatar is now a Chrysalis!";
      }
      toast({ title: 'Theme Activated!', description: toastDescription });


      setShowChrysalisJourneyModalReactState(false);
      clearJustCollectedCoinDetails();

      if (!fromProfileActivation && updates.photoURL === CHRYSALIS_AVATAR_IDENTIFIER) {
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

  const TEST_ONLY_triggerDailyMotivationModal = useCallback(() => {
    if (process.env.NODE_ENV === 'development') {
      console.warn("TEST_ONLY_triggerDailyMotivationModal called!");
      const todayForTest = new Date(getTodaysDateClientLocal());
      const challengeIsActiveForTest = isChallengeActive(todayForTest);

      if (userProfile?.profileComplete && challengeIsActiveForTest) {
        setShowDailyMotivationModalState(true);
      } else {
        console.warn("Cannot trigger DailyMotivationModal via test function:", {
          profileComplete: userProfile?.profileComplete,
          challengeActive: challengeIsActiveForTest,
          testDate: getTodaysDateClientLocal()
        });
        toast({
          title: "Test Trigger Info",
          description: `Cannot trigger DailyMotivationModal. Profile complete: ${userProfile?.profileComplete}, Challenge active for ${getTodaysDateClientLocal()}: ${challengeIsActiveForTest}`,
          variant: "default",
          duration: 5000,
        });
      }
    }
  }, [userProfile, toast]); // Removed setShowDailyMotivationModalState from deps, it's stable

  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && user && TEST_ONLY_triggerDailyMotivationModal) {
      (window as any).triggerDM = TEST_ONLY_triggerDailyMotivationModal;
      console.log("AuthContext: Test function 'window.triggerDM()' is now available to show DailyMotivationModal.");
    } else if ((window as any).triggerDM) {
      delete (window as any).triggerDM;
    }
    return () => {
      if ((window as any).triggerDM) {
        delete (window as any).triggerDM;
      }
    };
  }, [user, TEST_ONLY_triggerDailyMotivationModal]);


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
      TEST_ONLY_triggerDailyMotivationModal,
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
