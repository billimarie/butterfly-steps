
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
  description?: string;
  challengeType: 'directUser' | 'teamChallenge' | 'openChallenge';
  creatorUid: string; // User who initiated the challenge
  creatorName?: string; // Display name of the creator, denormalized for easier display in lists

  opponentUid?: string; // The UID of the user being challenged (for directUser type)
  opponentName?: string; // Display name of the opponent, denormalized
  opponentStatus?: 'pending' | 'accepted' | 'declined'; // Opponent's response (for directUser type)

  participantUids: string[]; // UIDs of all accepted/active participants
  
  goalType: 'steps' | 'activeDays'; // What is being measured
  goalValue: number; // The target value for the goalType

  startDate: Timestamp;
  endDate: Timestamp; // For daily challenges, this will be the end of the startDate.

  status: 'invitation' | 'accepted' | 'active' | 'complete' | 'cancelled';

  participantProgress?: {
    [uid: string]: {
      currentValue: number; // e.g., steps taken since challenge startDate for this specific challenge
      lastUpdated: Timestamp;
    };
  };
  
  winnerUids?: string[]; // UIDs of users who won the challenge
  badgeToAwardOnCompletion?: BadgeId; // Optional: Badge for all who complete/meet criteria
  badgeToAwardOnWin?: BadgeId; // Optional: Badge for winners

  stakes?: string; // Optional: User-defined fun stakes for the challenge

  repetition?: { // Optional: For recurring challenges
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
}

export interface ChallengeCreationData {
  goalValue: number;
  startDate: Date; // User selects the start date for the daily challenge
  // Optional fields for future expansion
  name?: string;
  description?: string;
  stakes?: string;
}

