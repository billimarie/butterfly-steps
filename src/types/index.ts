
import type { User as FirebaseUser } from 'firebase/auth';
import type { BadgeId, BadgeData } from '@/lib/badges'; // BadgeData already imported
import type { Timestamp } from 'firebase/firestore';
import type { ChrysalisVariantData } from '@/lib/chrysalisVariants'; // Import ChrysalisVariantData

export const CHALLENGE_DURATION_DAYS = 133; // June 21 to Oct 31

export const CHRYSALIS_AVATAR_IDENTIFIER = 'lucide:shell';

export type ActivityStatus = 'Sedentary' | 'Moderately Active' | 'Very Active';

export type ExplorerSectionKey = 'profile' | 'dashboard' | 'community' | 'donate';


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
  lastStreakLoginDate: string | null; // YYYY-MM-DD
  lastLoginTimestamp: Timestamp | null;
  chrysalisCoinDates?: string[]; // Array of "YYYY-MM-DD" for collected coins
  timezone?: string | null;
  activeChrysalisThemeId?: string | null; // ID of the coin variant used for theming
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

export interface Challenge {
  id: string; // Firestore document ID
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
  date: string; // YYYY-MM-DD
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

export type StreakModalViewContext = 'login' | 'profile_avatar_select';
export type LogStepsModalOrigin = 'chrysalis' | 'direct' | null;

export interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isLoggingOut: boolean; // New property
  error: Error | null;
  logout: () => Promise<void>;
  fetchUserProfile: (
    uid: string,
    isInitialAuthEvent?: boolean,
    isPostSignup?: boolean,
    isFirstStepSubmissionViaWelcomeFlow?: boolean
  ) => Promise<void>;
  setUserProfileState: (profile: UserProfile | null) => void;
  showStreakModal: boolean;
  setShowStreakModal: (show: boolean) => void;
  streakModalContext: StreakModalViewContext;
  setStreakModalContext: (context: StreakModalViewContext) => void;
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
}

export interface ChallengeCreationData {
  goalValue: number;
  startDate: Date; 
  name?: string;
  structuredDescription: string;
  creatorMessage?: string;
  stakes?: string;
}
