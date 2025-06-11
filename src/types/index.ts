
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
  teamId?: string | null; // ID of the team the user belongs to
  teamName?: string | null; // Name of the team, denormalized for easy display
  currentStreak: number; // Number of consecutive days logged in
  lastStreakLoginDate: string | null; // YYYY-MM-DD of the last login that counted for streak
  lastLoginTimestamp: Timestamp | null; // Firestore Timestamp of the absolute last login
}

export interface Team {
  id: string;
  name: string;
  creatorUid: string;
  memberUids: string[]; // List of user UIDs who are members
  totalSteps: number;
  createdAt: any; // Firebase Timestamp
}

export interface CommunityStats {
  totalSteps: number;
  totalParticipants: number;
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
  fetchUserProfile: (uid: string, initialLogin?: boolean) => Promise<void>; // Added optional initialLogin
  setUserProfileState: (profile: UserProfile | null) => void;
  showStreakModal: boolean;
  setShowStreakModal: (show: boolean) => void;
}
