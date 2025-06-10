
import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc, increment, runTransaction } from 'firebase/firestore';
import type { UserProfile, ActivityStatus, CommunityStats } from '@/types';
import type { User as FirebaseUser } from 'firebase/auth';

const USERS_COLLECTION = 'users';
const COMMUNITY_COLLECTION = 'community';
const COMMUNITY_STATS_DOC = 'stats';

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const docRef = doc(db, USERS_COLLECTION, uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data() as UserProfile;
  }
  return null;
}

export async function createUserProfile(firebaseUser: FirebaseUser, additionalData: Partial<UserProfile> = {}): Promise<UserProfile> {
  const userProfileRef = doc(db, USERS_COLLECTION, firebaseUser.uid);
  const profileData: UserProfile = {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Anonymous User',
    activityStatus: null,
    stepGoal: null,
    currentSteps: 0,
    profileComplete: false,
    inviteLink: `${process.env.NEXT_PUBLIC_APP_URL || ''}/profile/${firebaseUser.uid}`,
    ...additionalData,
  };
  await setDoc(userProfileRef, profileData);
  return profileData;
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  const userRef = doc(db, USERS_COLLECTION, uid);
  // Use setDoc with merge: true to create the document if it doesn't exist, or update it if it does.
  await setDoc(userRef, data, { merge: true });
}

export async function submitSteps(uid: string, steps: number): Promise<void> {
  if (steps <= 0) {
    throw new Error("Steps must be a positive number.");
  }

  const userDocRef = doc(db, USERS_COLLECTION, uid);
  const communityStatsRef = doc(db, COMMUNITY_COLLECTION, COMMUNITY_STATS_DOC);

  await runTransaction(db, async (transaction) => {
    const userDoc = await transaction.get(userDocRef);
    if (!userDoc.exists()) {
      throw new Error("User profile does not exist.");
    }

    // Update user's current steps
    transaction.update(userDocRef, { currentSteps: increment(steps) });

    // Update community total steps
    const communityStatsDoc = await transaction.get(communityStatsRef);
    if (!communityStatsDoc.exists()) {
      // Initialize community stats if it doesn't exist
      transaction.set(communityStatsRef, { totalSteps: steps, totalParticipants: 1 });
    } else {
      transaction.update(communityStatsRef, { totalSteps: increment(steps) });
    }
  });
}

export async function getCommunityStats(): Promise<CommunityStats> {
  const docRef = doc(db, COMMUNITY_COLLECTION, COMMUNITY_STATS_DOC);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data() as CommunityStats;
  }
  // Default if not exists
  return { totalSteps: 0, totalParticipants: 0 };
}

export async function incrementParticipantCount(): Promise<void> {
    const communityStatsRef = doc(db, COMMUNITY_COLLECTION, COMMUNITY_STATS_DOC);
    const docSnap = await getDoc(communityStatsRef);
    if (!docSnap.exists()) {
        await setDoc(communityStatsRef, { totalSteps: 0, totalParticipants: 1 });
    } else {
        await updateDoc(communityStatsRef, { totalParticipants: increment(1) });
    }
}

