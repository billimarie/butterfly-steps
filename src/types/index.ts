import type { User as FirebaseUser } from 'firebase/auth';

export type ActivityStatus = 'Sedentary' | 'Moderately Active' | 'Very Active';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  activityStatus: ActivityStatus | null;
  stepGoal: number | null;
  currentSteps: number;
  profileComplete: boolean;
  inviteLink?: string; // e.g., /profile/{uid} or /sponsor/{uid}
}

export interface CommunityStats {
  totalSteps: number;
  totalParticipants: number;
}

// Extends FirebaseUser to include our app-specific profile potentially
export interface AppUser extends FirebaseUser {
  profile?: UserProfile;
}
