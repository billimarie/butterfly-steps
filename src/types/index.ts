
import type { User as FirebaseUser } from 'firebase/auth';
import type { BadgeId, BadgeData } from '@/lib/badges'; 
import type { Timestamp } from 'firebase/firestore';
import type { ChrysalisVariantData } from '@/lib/chrysalisVariants'; 

export const CHALLENGE_DURATION_DAYS = 133; 

export const CHRYSALIS_AVATAR_IDENTIFIER = 'lucide:shell';

export type ActivityStatus = 'Sedentary' | 'Moderately Active' | 'Very Active';

export type ExplorerSectionKey = 'profile' | 'dashboard' | 'community' | 'donate';

export type ChrysalisJourneyModalContext = 'login' | 'profile_avatar_select';
export type LogStepsModalOrigin = 'chrysalis' | 'direct' | null;


export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  activityStatus: ActivityStatus | null;
  stepGoal: number | null;
  currentSteps: number;
  profileComplete: boolean;
  inviteLink?: string;
  badgesEarned?: BadgeId[];
  teamId?: string | null;
  teamName?: string | null;
  currentStreak: number;
  lastStreakLoginDate: string | null; 
  lastLoginTimestamp: Timestamp | null;
  chrysalisCoinDates?: string[]; 
  timezone?: string | null;
  activeChrysalisThemeId?: string | null; 
  dashboardLayout?: {
    dashboardOrder?: string[];
    communityOrder?: string[];
  };
  visitedSections?: ExplorerSectionKey[];
}

export interface Team {
  id: string;
  name: string;
  creatorUid: string;
  memberUids: string[];
  totalSteps: number;
  createdAt: any;
}

export interface ChallengeCreationData {
  startDate: Date;
  goalValue: number;
  // creatorMessage removed
  stakes?: string;
}

export interface Challenge {
  id: string; 
  name: string;
  structuredDescription: string; 
  creatorMessage?: string; 
  challengeType: 'directUser' | 'teamChallenge' | 'openChallenge';
  creatorUid: string; 
  creatorName?: string; 

  opponentUid?: string; 
  opponentName?: string; 
  opponentStatus?: 'pending' | 'accepted' | 'declined'; 

  participantUids: string[]; 
  
  goalType: 'steps' | 'activeDays'; 
  goalValue: number; 

  startDate: Timestamp;
  endDate: Timestamp;

  status: 'invitation' | 'accepted' | 'active' | 'complete' | 'cancelled';

  participantProgress?: {
    [uid: string]: {
      currentValue: number; 
      lastUpdated: Timestamp;
    };
  };
  
  winnerUids?: string[]; 
  badgeToAwardOnCompletion?: BadgeId; 
  badgeToAwardOnWin?: BadgeId; 

  stakes?: string; 

  repetition?: {
    type: 'daily' | 'weekly' | 'monthly' | 'yearly';
    nextInstanceStartDate?: Timestamp;
  };

  createdAt: Timestamp;
  updatedAt: Timestamp;
}


export interface CommunityStats {
  totalSteps: number;
  totalParticipants: number;
}

export interface DailyStep {
  date: string; 
  steps: number;
  dailyGoalMetOnThisDate?: boolean;
}

export interface AppUser extends FirebaseUser {
  profile?: UserProfile;
}

export interface StreakUpdateResults {
  updatedStreakCount: number;
  updatedLastStreakLoginDate: string | null;
  updatedLastLoginTimestamp: Timestamp;
  streakProcessedForToday: boolean;
}

export interface StepSubmissionResult {
  newlyAwardedBadges: BadgeData[];
  dailyGoalAchieved: boolean;
}

export interface TeamActionResult {
  teamId: string;
  teamName: string;
  awardedTeamBadge?: BadgeData | null;
}


export interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isLoggingOut: boolean; 
  error: Error | null;
  logout: () => Promise<void>;
  fetchUserProfile: (
    uid: string,
    isInitialAuthEvent?: boolean,
    isPostSignup?: boolean,
    isFirstStepSubmissionViaWelcomeFlow?: boolean
  ) => Promise<void>;
  setUserProfileState: (profile: UserProfile | null) => void;
  showChrysalisJourneyModal: boolean;
  setShowChrysalisJourneyModal: (show: boolean) => void;
  chrysalisJourneyModalContext: ChrysalisJourneyModalContext;
  setChrysalisJourneyModalContext: (context: ChrysalisJourneyModalContext) => void;
  showDailyGoalMetModal: boolean;
  setShowDailyGoalMetModal: (show: boolean) => void;
  newlyEarnedBadgeToShow: BadgeData | null;
  setShowNewBadgeModal: (badge: BadgeData | null) => void;
  activateChrysalisAsAvatar: () => Promise<void>;
  collectDailyChrysalisCoin: () => Promise<void>;
  applyTheme: (themeId: string | null) => void;
  activeChrysalisThemeId: string | null | undefined;
  showLogStepsModal: boolean;
  setShowLogStepsModal: (show: boolean, origin?: LogStepsModalOrigin) => void;
  logStepsFlowOrigin: LogStepsModalOrigin;
  justCollectedCoin: ChrysalisVariantData | null;
  activateThemeFromCollectedCoin: (coinToActivate: ChrysalisVariantData, fromProfileActivation?: boolean) => Promise<void>;
  clearJustCollectedCoinDetails: () => void;
  showWelcomeMigrationModal: boolean;
  setShowWelcomeMigrationModal: (show: boolean) => void;
  recordSectionVisit: (sectionKey: ExplorerSectionKey) => Promise<void>;
  pendingChallengeInvitationToShow: Challenge | null;
  setShowChallengeInvitationModal: (challenge: Challenge | null) => void;
  acceptChallengeInvitation: (challengeId: string) => Promise<void>;
  declineChallengeInvitation: (challengeId: string) => Promise<void>;
  canCollectTodaysChrysalisCoin: boolean;
  setCanCollectTodaysChrysalisCoin: (can: boolean) => void;
  showDailyMotivationModal: boolean;
  setShowDailyMotivationModal: (show: boolean) => void;
}
