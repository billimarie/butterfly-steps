
import type { User as FirebaseUser } from 'firebase/auth';
import type { BadgeId, BadgeData } from '@/lib/badges'; // Import BadgeData
import type { Timestamp } from 'firebase/firestore';
import type { ChrysalisVariantData } from '@/lib/chrysalisVariants'; // Import ChrysalisVariantData

export const CHALLENGE_DURATION_DAYS = 133; // June 21 to Oct 31

export const CHRYSALIS_AVATAR_IDENTIFIER = 'lucide:shell';

export type ActivityStatus = 'Sedentary' | 'Moderately Active' | 'Very Active';

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
}

export interface Team {
  id: string;
  name: string;
  creatorUid: string;
  memberUids: string[];
  totalSteps: number;
  createdAt: any;
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
  fetchUserProfile: (uid: string, initialLogin?: boolean) => Promise<void>;
  setUserProfileState: (profile: UserProfile | null) => void;
  showStreakModal: boolean;
  setShowStreakModal: (show: boolean) => void;
  streakModalContext: StreakModalViewContext;
  setStreakModalContext: (context: StreakModalViewContext) => void;
  showDailyGoalMetModal: boolean;
  setShowDailyGoalMetModal: (show: boolean) => void;
  newlyEarnedBadgeToShow: BadgeData | null;
  setShowNewBadgeModal: (badge: BadgeData | null) => void;
  activateChrysalisAsAvatar: () => Promise<void>; // For default Golden Chrysalis avatar/theme activation
  collectDailyChrysalisCoin: () => Promise<void>;
  applyTheme: (themeId: string | null) => void;
  activeChrysalisThemeId: string | null | undefined;
  showLogStepsModal: boolean;
  setShowLogStepsModal: (show: boolean, origin?: LogStepsModalOrigin) => void;
  logStepsFlowOrigin: LogStepsModalOrigin;
  justCollectedCoin: ChrysalisVariantData | null; // Details of the coin just collected
  activateThemeFromCollectedCoin: (coinToActivate: ChrysalisVariantData) => Promise<void>; // Activates theme of any specific coin
  clearJustCollectedCoinDetails: () => void; // Clears the justCollectedCoin state
}
    
