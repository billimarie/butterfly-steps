
import type { User as FirebaseUser } from 'firebase/auth';
import type { BadgeId } from '@/lib/badges';

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
}

export interface Team {
  id: string;
  name: string;
  creatorUid: string;
  memberUids: string[]; // List of user UIDs who are members
  totalSteps: number;
  // teamInviteCode?: string; // Optional: for a more user-friendly way to join teams later
  createdAt: Date;
}

export interface CommunityStats {
  totalSteps: number;
  totalParticipants: number;
}

export interface AppUser extends FirebaseUser {
  profile?: UserProfile;
}
