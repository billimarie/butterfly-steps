
import { db } from './firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  runTransaction,
  collection,
  query,
  where,
  getDocs,
  arrayUnion,
  arrayRemove,
  Timestamp,
  orderBy,
  limit as firestoreLimit,
  type DocumentSnapshot,
  type DocumentReference
} from 'firebase/firestore';
import type { UserProfile, CommunityStats, Team } from '@/types';
import type { User as FirebaseUser } from 'firebase/auth';
import { ALL_BADGES, type BadgeData, type BadgeId, getBadgeDataById } from '@/lib/badges';

const USERS_COLLECTION = 'users';
const TEAMS_COLLECTION = 'teams';
const COMMUNITY_COLLECTION = 'community';
const COMMUNITY_STATS_DOC = 'stats';

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const docRef = doc(db, USERS_COLLECTION, uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    const badgesEarned = Array.isArray(data.badgesEarned) ? data.badgesEarned : [];
    return {
      ...data,
      uid,
      badgesEarned,
      teamId: data.teamId || null,
      teamName: data.teamName || null,
    } as UserProfile;
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
    badgesEarned: [],
    teamId: null,
    teamName: null,
    ...additionalData,
  };
  await setDoc(userProfileRef, profileData);
  return profileData;
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  const userRef = doc(db, USERS_COLLECTION, uid);
  await setDoc(userRef, data, { merge: true });
}

export async function checkAndAwardBadges(
  uid: string,
  currentTotalSteps: number,
  currentUserBadgeIds: BadgeId[]
): Promise<BadgeData[]> {
  const newlyEarnedBadgesData: BadgeData[] = [];
  const newBadgeIdsToSaveSet = new Set<BadgeId>(currentUserBadgeIds);

  for (const badge of ALL_BADGES) {
    if (badge.id === 'team-player') continue;

    if (currentTotalSteps >= badge.milestone && !currentUserBadgeIds.includes(badge.id)) {
      if (!newBadgeIdsToSaveSet.has(badge.id)) {
         newlyEarnedBadgesData.push(badge);
         newBadgeIdsToSaveSet.add(badge.id);
      }
    }
  }

  if (newlyEarnedBadgesData.length > 0) {
    await updateUserProfile(uid, { badgesEarned: Array.from(newBadgeIdsToSaveSet) });
  }
  return newlyEarnedBadgesData;
}

export async function submitSteps(uid: string, steps: number): Promise<BadgeData[]> {
  if (steps <= 0) {
    throw new Error("Steps must be a positive number.");
  }

  const userDocRef = doc(db, USERS_COLLECTION, uid);
  const communityStatsRef = doc(db, COMMUNITY_COLLECTION, COMMUNITY_STATS_DOC);
  
  await runTransaction(db, async (transaction) => {
    // --- All READS first ---
    const userDocSnap = await transaction.get(userDocRef);
    if (!userDocSnap.exists()) {
      throw new Error("User profile does not exist.");
    }
    const userProfileData = userDocSnap.data() as UserProfile;

    const communityStatsSnap = await transaction.get(communityStatsRef);

    let teamDocSnap: DocumentSnapshot | undefined = undefined;
    let teamDocRef: DocumentReference | undefined = undefined;

    if (userProfileData.teamId) {
      teamDocRef = doc(db, TEAMS_COLLECTION, userProfileData.teamId);
      teamDocSnap = await transaction.get(teamDocRef); // Read team doc
    }

    // --- All WRITES next ---
    transaction.update(userDocRef, { currentSteps: increment(steps) });

    if (!communityStatsSnap.exists()) {
      transaction.set(communityStatsRef, { totalSteps: steps, totalParticipants: 1 });
    } else {
      transaction.update(communityStatsRef, { totalSteps: increment(steps) });
    }

    if (teamDocRef && teamDocSnap && teamDocSnap.exists()) {
      transaction.update(teamDocRef, { totalSteps: increment(steps) });
    }
  });

  const updatedUserProfile = await getUserProfile(uid);
  if (!updatedUserProfile || typeof updatedUserProfile.currentSteps !== 'number') {
    console.error("Failed to get updated user profile or currentSteps after step submission.");
    return [];
  }

  const newlyAwardedBadges = await checkAndAwardBadges(uid, updatedUserProfile.currentSteps, updatedUserProfile.badgesEarned || []);
  return newlyAwardedBadges;
}

export async function getCommunityStats(): Promise<CommunityStats> {
  const docRef = doc(db, COMMUNITY_COLLECTION, COMMUNITY_STATS_DOC);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data() as CommunityStats;
  }
  return { totalSteps: 0, totalParticipants: 0 };
}

export async function incrementParticipantCount(): Promise<void> {
    const communityStatsRef = doc(db, COMMUNITY_COLLECTION, COMMUNITY_STATS_DOC);
    
    await runTransaction(db, async (transaction) => {
        const communityStatsDoc = await transaction.get(communityStatsRef);
        if (!communityStatsDoc.exists()) {
            transaction.set(communityStatsRef, { totalSteps: 0, totalParticipants: 1 });
        } else {
            transaction.update(communityStatsRef, { totalParticipants: increment(1) });
        }
    });
}

export async function createTeam(creatorUserId: string, teamName: string, creatorCurrentSteps: number): Promise<{ teamId: string; teamName: string; awardedTeamBadge?: BadgeData }> {
  const userProfileDocRef = doc(db, USERS_COLLECTION, creatorUserId);
  const newTeamDocRef = doc(collection(db, TEAMS_COLLECTION));
  let awardedTeamBadge: BadgeData | undefined = undefined;

  return runTransaction(db, async (transaction) => {
    const userProfileSnap = await transaction.get(userProfileDocRef);
    if (!userProfileSnap.exists()) {
      throw new Error("User profile not found for createTeam operation.");
    }
    const userProfileData = userProfileSnap.data() as UserProfile;

    if (userProfileData?.teamId) {
      throw new Error("User is already in a team. Please leave the current team before creating a new one.");
    }

    transaction.set(newTeamDocRef, {
      name: teamName,
      creatorUid: creatorUserId,
      memberUids: [creatorUserId],
      totalSteps: creatorCurrentSteps,
      createdAt: Timestamp.now(),
    });

    const currentBadges = userProfileData.badgesEarned || [];
    const userProfileUpdates: Partial<UserProfile> = { teamId: newTeamDocRef.id, teamName: teamName };

    if (!currentBadges.includes('team-player')) {
      userProfileUpdates.badgesEarned = [...currentBadges, 'team-player'];
      awardedTeamBadge = getBadgeDataById('team-player');
    }
    transaction.update(userProfileDocRef, userProfileUpdates);
    
    return { teamId: newTeamDocRef.id, teamName: teamName, awardedTeamBadge };
  });
}

export async function joinTeam(userId: string, teamIdToJoin: string, userCurrentSteps: number): Promise<{ teamId: string; teamName: string; awardedTeamBadge?: BadgeData } | null> {
  const userDocRef = doc(db, USERS_COLLECTION, userId);
  const newTeamDocRef = doc(db, TEAMS_COLLECTION, teamIdToJoin);
  let awardedTeamBadge: BadgeData | undefined = undefined;

  return runTransaction(db, async (transaction) => {
    const userProfileSnap = await transaction.get(userDocRef);
    if (!userProfileSnap.exists()) {
      throw new Error("User profile not found for joinTeam operation.");
    }
    const userProfileData = userProfileSnap.data() as UserProfile;

    const newTeamSnap = await transaction.get(newTeamDocRef);
    if (!newTeamSnap.exists()) {
      throw new Error("Team to join not found.");
    }
    const newTeamData = newTeamSnap.data() as Team;

    if (userProfileData.teamId === teamIdToJoin) {
      return { teamId: userProfileData.teamId, teamName: userProfileData.teamName! }; 
    }

    if (userProfileData.teamId) {
      const oldTeamDocRef = doc(db, TEAMS_COLLECTION, userProfileData.teamId);
      const oldTeamSnap = await transaction.get(oldTeamDocRef);
      if (oldTeamSnap.exists()) {
        transaction.update(oldTeamDocRef, {
          memberUids: arrayRemove(userId),
          totalSteps: increment(-userProfileData.currentSteps),
        });
      }
    }
    
    transaction.update(newTeamDocRef, {
      memberUids: arrayUnion(userId),
      totalSteps: increment(userProfileData.currentSteps),
    });
    
    const currentBadges = userProfileData.badgesEarned || [];
    const userProfileUpdates: Partial<UserProfile> = { teamId: teamIdToJoin, teamName: newTeamData.name };

    if (!currentBadges.includes('team-player')) {
       userProfileUpdates.badgesEarned = [...currentBadges, 'team-player'];
       awardedTeamBadge = getBadgeDataById('team-player');
    }
    transaction.update(userDocRef, userProfileUpdates);

    return { teamId: teamIdToJoin, teamName: newTeamData.name, awardedTeamBadge };
  });
}

export async function leaveTeam(userId: string, teamId: string, userCurrentSteps: number): Promise<void> {
  const userDocRef = doc(db, USERS_COLLECTION, userId);
  const teamDocRef = doc(db, TEAMS_COLLECTION, teamId);

  await runTransaction(db, async (transaction) => {
    const userSnap = await transaction.get(userDocRef);
    if (!userSnap.exists()) throw new Error("User not found for leaveTeam.");
    const userData = userSnap.data() as UserProfile;

    const teamSnap = await transaction.get(teamDocRef);
    if (!teamSnap.exists()) {
        transaction.update(userDocRef, { teamId: null, teamName: null });
        console.warn(`User ${userId} tried to leave team ${teamId} which was not found. Clearing user's team info.`);
        return;
    }
    
    const stepsToDecrement = typeof userData.currentSteps === 'number' ? userData.currentSteps : userCurrentSteps;

    transaction.update(teamDocRef, {
      memberUids: arrayRemove(userId),
      totalSteps: increment(-stepsToDecrement),
    });
    transaction.update(userDocRef, { teamId: null, teamName: null });
  });
}


export async function getTeam(teamId: string): Promise<Team | null> {
  const teamRef = doc(db, TEAMS_COLLECTION, teamId);
  const teamSnap = await getDoc(teamRef);
  if (teamSnap.exists()) {
    return { id: teamSnap.id, ...teamSnap.data() } as Team;
  }
  return null;
}

export async function getAllTeams(): Promise<Team[]> {
  const teamsCollectionRef = collection(db, TEAMS_COLLECTION);
  const q = query(teamsCollectionRef, orderBy("totalSteps", "desc"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team));
}

export async function getTeamMembersProfiles(memberUids: string[]): Promise<UserProfile[]> {
  if (!memberUids || memberUids.length === 0) return [];
  
  const profiles: UserProfile[] = [];
  const CHUNK_SIZE = 30; 
  for (let i = 0; i < memberUids.length; i += CHUNK_SIZE) {
      const chunk = memberUids.slice(i, i + CHUNK_SIZE);
      if (chunk.length > 0) {
        const usersRef = collection(db, USERS_COLLECTION);
        const q = query(usersRef, where('uid', 'in', chunk));
        const querySnapshot = await getDocs(q);
        querySnapshot.docs.forEach(doc => profiles.push(doc.data() as UserProfile));
      }
  }
  return profiles;
}

export async function getTopUsers(count: number): Promise<UserProfile[]> {
  const usersRef = collection(db, USERS_COLLECTION);
  const q = query(usersRef, orderBy('currentSteps', 'desc'), firestoreLimit(count));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as UserProfile);
}
