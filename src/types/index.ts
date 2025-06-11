
import type { User as FirebaseUser } from 'firebase/auth';
import type { BadgeId } from '@/lib/badges';
import type { Timestamp } from 'firebase/firestore';

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
  lastStreakLoginDate: string | null;
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
}

export interface AppUser extends FirebaseUser {
  profile?: UserProfile;
}

export interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  error: AuthError | null;
  logout: () => Promise<void>;
  fetchUserProfile: (uid: string, initialLogin?: boolean) => Promise<void>;
  setUserProfileState: (profile: UserProfile | null) => void;
  showStreakModal: boolean;
  setShowStreakModal: (show: boolean) => void;
}
