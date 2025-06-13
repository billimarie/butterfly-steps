
import type { User as FirebaseUser } from 'firebase/auth';
import type { BadgeId, BadgeData } from '@/lib/badges'; // Import BadgeData
import type { Timestamp } from 'firebase/firestore';

export const CHALLENGE_DURATION_DAYS = 133; // June 21 to Oct 31

export type ActivityStatus = 'Sedentary' | 'Moderately Active' | 'Very Active';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
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
  newlyAwardedBadges: BadgeData[]; // Now returns full BadgeData
  dailyGoalAchieved: boolean;
}

// For team creation/joining results that might award a badge
export interface TeamActionResult {
  teamId: string;
  teamName: string;
  awardedTeamBadge?: BadgeData | null; // Full BadgeData if awarded
}


export interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  error: Error | null; // Changed AuthError to generic Error for broader compatibility
  logout: () => Promise<void>;
  fetchUserProfile: (uid: string, initialLogin?: boolean) => Promise<void>;
  setUserProfileState: (profile: UserProfile | null) => void;
  showStreakModal: boolean;
  setShowStreakModal: (show: boolean) => void;
  showDailyGoalMetModal: boolean;
  setShowDailyGoalMetModal: (show: boolean) => void;
  newlyEarnedBadgeToShow: BadgeData | null; // Badge to show in the new modal
  setShowNewBadgeModal: (badge: BadgeData | null) => void; // To trigger the new badge modal
}
