
import { db } from './firebase';
import {
  doc,
  documentId,
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
  type DocumentReference,
  writeBatch
} from 'firebase/firestore';
import type { UserProfile, CommunityStats, Team, DailyStep } from '@/types';
import type { User as FirebaseUser } from 'firebase/auth';
import { ALL_BADGES, type BadgeData, type BadgeId, getBadgeDataById } from '@/lib/badges';

const USERS_COLLECTION = 'users';
const TEAMS_COLLECTION = 'teams';
const COMMUNITY_COLLECTION = 'community';
const COMMUNITY_STATS_DOC = 'stats';
const DAILY_STEPS_SUBCOLLECTION = 'dailySteps';

// Helper to get today's date in YYYY-MM-DD format (UTC)
function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

// Helper function to map Firestore document snapshot to UserProfile
function mapDocToUserProfile(docSnap: DocumentSnapshot): UserProfile {
  const data = docSnap.data();
  if (!data) {
    // This case should ideally not be hit if docSnap.exists() is checked before calling
    throw new Error(`Document data not found for user ${docSnap.id}`);
  }
  return {
    uid: docSnap.id, // Use the document ID as the UID
    email: data.email || null,
    displayName: data.displayName || null,
    activityStatus: data.activityStatus || null,
    stepGoal: data.stepGoal || null,
    currentSteps: typeof data.currentSteps === 'number' ? data.currentSteps : 0,
    profileComplete: !!data.profileComplete,
    inviteLink: data.inviteLink,
    badgesEarned: Array.isArray(data.badgesEarned) ? data.badgesEarned : [],
    teamId: data.teamId || null,
    teamName: data.teamName || null,
    currentStreak: typeof data.currentStreak === 'number' ? data.currentStreak : 0,
    lastStreakLoginDate: data.lastStreakLoginDate || null,
    lastLoginTimestamp: data.lastLoginTimestamp instanceof Timestamp ? data.lastLoginTimestamp : null,
  };
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const docRef = doc(db, USERS_COLLECTION, uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return mapDocToUserProfile(docSnap);
  }
  return null;
}

export async function createUserProfile(firebaseUser: FirebaseUser, additionalData: Partial<UserProfile> = {}): Promise<UserProfile> {
  const userProfileRef = doc(db, USERS_COLLECTION, firebaseUser.uid);
  const baseProfileData: UserProfile = {
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
    currentStreak: 0,
    lastStreakLoginDate: null,
    lastLoginTimestamp: null,
  };
  const profileData = { ...baseProfileData, ...additionalData };
  await setDoc(userProfileRef, profileData);
  return profileData; 
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  const userRef = doc(db, USERS_COLLECTION, uid);
  const updatePayload = { ...data, uid: uid }; // Ensure UID is part of the update if using setDoc with merge
  await setDoc(userRef, updatePayload, { merge: true });
}

export async function updateUserStreakOnLogin(uid: string): Promise<{
  updatedStreakCount: number;
  updatedLastStreakLoginDate: string | null;
  updatedLastLoginTimestamp: Timestamp;
}> {
  const userRef = doc(db, USERS_COLLECTION, uid);
  const now = new Date();
  const todayDateString = getTodayDateString();

  try {
    const result = await runTransaction(db, async (transaction) => {
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists()) {
        console.warn(`User profile ${uid} not found during streak update.`);
         transaction.set(userRef, {
            currentStreak: 1,
            lastStreakLoginDate: todayDateString,
            lastLoginTimestamp: Timestamp.fromDate(now),
            uid: uid
        }, { merge: true });
        return {
            updatedStreakCount: 1,
            updatedLastStreakLoginDate: todayDateString,
            updatedLastLoginTimestamp: Timestamp.fromDate(now),
        };
      }

      const userProfile = userSnap.data() as UserProfile;
      let currentStreak = userProfile.currentStreak || 0;
      const lastStreakLoginDateStr = userProfile.lastStreakLoginDate;
      const lastLoginFirestoreTimestamp = userProfile.lastLoginTimestamp;

      let newStreakCount = currentStreak;
      let newLastStreakLoginDate = lastStreakLoginDateStr;

      if (!lastStreakLoginDateStr) {
        newStreakCount = 1;
        newLastStreakLoginDate = todayDateString;
      } else {
        const lastStreakDate = new Date(lastStreakLoginDateStr + 'T00:00:00Z');
        const todayAtMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

        const diffTime = todayAtMidnight.getTime() - lastStreakDate.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          newStreakCount = currentStreak + 1;
          newLastStreakLoginDate = todayDateString;
        } else if (diffDays === 0) {
          newStreakCount = currentStreak; 
          newLastStreakLoginDate = todayDateString; 
        } else if (diffDays > 1) {
          if (lastLoginFirestoreTimestamp && lastLoginFirestoreTimestamp instanceof Timestamp) {
            const lastLoginActualTime = lastLoginFirestoreTimestamp.toDate().getTime();
            const currentTime = now.getTime();
            const hoursSinceLastLogin = (currentTime - lastLoginActualTime) / (1000 * 60 * 60);

            if (hoursSinceLastLogin < 47.99) { 
              newStreakCount = currentStreak + 1;
              newLastStreakLoginDate = todayDateString;
            } else {
              newStreakCount = 1; 
              newLastStreakLoginDate = todayDateString;
            }
          } else {
             newStreakCount = 1; 
             newLastStreakLoginDate = todayDateString;
          }
        } else { 
          newStreakCount = 1;
          newLastStreakLoginDate = todayDateString;
        }
      }
      
      if (newStreakCount === 0 && newLastStreakLoginDate === todayDateString) {
          newStreakCount = 1;
      }

      const newLastLoginTimestamp = Timestamp.fromDate(now);
      transaction.update(userRef, {
        currentStreak: newStreakCount,
        lastStreakLoginDate: newLastStreakLoginDate,
        lastLoginTimestamp: newLastLoginTimestamp,
      });

      return {
        updatedStreakCount: newStreakCount,
        updatedLastStreakLoginDate: newLastStreakLoginDate,
        updatedLastLoginTimestamp: newLastLoginTimestamp,
      };
    });
    return result;
  } catch (error) {
    console.error("Transaction failed for streak update: ", error);
    const fallbackProfile = await getUserProfile(uid);
    return {
        updatedStreakCount: fallbackProfile?.currentStreak || 0,
        updatedLastStreakLoginDate: fallbackProfile?.lastStreakLoginDate || null,
        updatedLastLoginTimestamp: fallbackProfile?.lastLoginTimestamp instanceof Timestamp ? fallbackProfile.lastLoginTimestamp : Timestamp.fromDate(now),
    };
  }
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

export async function submitSteps(uid: string, stepsToAdd: number): Promise<BadgeData[]> {
  if (stepsToAdd <= 0) {
    throw new Error("Steps must be a positive number.");
  }

  const userDocRef = doc(db, USERS_COLLECTION, uid);
  const communityStatsRef = doc(db, COMMUNITY_COLLECTION, COMMUNITY_STATS_DOC);
  const todayDateStr = getTodayDateString();
  const dailyStepDocRef = doc(db, USERS_COLLECTION, uid, DAILY_STEPS_SUBCOLLECTION, todayDateStr);

  let teamDocRef: DocumentReference | undefined;
  let userProfileDataBeforeUpdate: UserProfile | null = null;

  await runTransaction(db, async (transaction) => {
    const userDocSnap = await transaction.get(userDocRef);
    const communityStatsDoc = await transaction.get(communityStatsRef);

    if (!userDocSnap.exists()) {
      throw new Error("User profile does not exist.");
    }
    userProfileDataBeforeUpdate = mapDocToUserProfile(userDocSnap);

    const dailyStepSnap = await transaction.get(dailyStepDocRef);

    let teamDocSnap: DocumentSnapshot | undefined;
    if (userProfileDataBeforeUpdate.teamId) {
      teamDocRef = doc(db, TEAMS_COLLECTION, userProfileDataBeforeUpdate.teamId);
      teamDocSnap = await transaction.get(teamDocRef);
    }

    transaction.update(userDocRef, { currentSteps: increment(stepsToAdd) });

    if (!communityStatsDoc.exists()) {
      transaction.set(communityStatsRef, { totalSteps: stepsToAdd, totalParticipants: 1 });
    } else {
      transaction.update(communityStatsRef, { totalSteps: increment(stepsToAdd) });
    }
    
    if (dailyStepSnap.exists()) {
        transaction.update(dailyStepDocRef, { steps: increment(stepsToAdd) });
    } else {
        transaction.set(dailyStepDocRef, { date: todayDateStr, steps: stepsToAdd });
    }

    if (userProfileDataBeforeUpdate?.teamId && teamDocRef && teamDocSnap?.exists()) {
      transaction.update(teamDocRef, { totalSteps: increment(stepsToAdd) });
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

export async function getUserDailySteps(uid: string, limitDays: number = 30): Promise<DailyStep[]> {
  const dailyStepsRef = collection(db, USERS_COLLECTION, uid, DAILY_STEPS_SUBCOLLECTION);
  const q = query(dailyStepsRef, orderBy('date', 'desc'), firestoreLimit(limitDays));
  const querySnapshot = await getDocs(q);
  
  const dailySteps: DailyStep[] = [];
  querySnapshot.forEach((docSnap) => { // Changed doc to docSnap for clarity
    const data = docSnap.data();
    dailySteps.push({
      date: data.date, 
      steps: data.steps,
    });
  });
  return dailySteps.reverse(); 
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
    const userProfileData = mapDocToUserProfile(userProfileSnap);

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
    const userProfileData = mapDocToUserProfile(userProfileSnap);

    const newTeamSnap = await transaction.get(newTeamDocRef);
    if (!newTeamSnap.exists()) {
      throw new Error("Team to join not found.");
    }
    const newTeamData = newTeamSnap.data() as Team;

    if (userProfileData.teamId === teamIdToJoin) {
      return { teamId: userProfileData.teamId, teamName: userProfileData.teamName!, awardedTeamBadge: undefined };
    }
    
    if (userProfileData.teamId) {
      throw new Error("User is already in another team. Please leave the current team before joining a new one.");
    }

    transaction.update(newTeamDocRef, {
      memberUids: arrayUnion(userId),
      totalSteps: increment(userCurrentSteps),
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
    const userData = mapDocToUserProfile(userSnap);

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
  return querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Team)); // Changed doc to docSnap
}

export async function getTeamMembersProfiles(memberUids: string[]): Promise<UserProfile[]> {
  if (!memberUids || memberUids.length === 0) return [];

  const profiles: UserProfile[] = [];
  const CHUNK_SIZE = 30; 
  for (let i = 0; i < memberUids.length; i += CHUNK_SIZE) {
      const chunk = memberUids.slice(i, i + CHUNK_SIZE);
      if (chunk.length > 0) { 
        const usersRef = collection(db, USERS_COLLECTION);
        const q = query(usersRef, where(documentId(), 'in', chunk));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(docSnap => { // Changed docSnap from forEach doc to docSnap
            if (docSnap.exists()){
                 profiles.push(mapDocToUserProfile(docSnap));
            }
        });
      }
  }
  return profiles;
}

export async function getTopUsers(count: number): Promise<UserProfile[]> {
  const usersRef = collection(db, USERS_COLLECTION);
  const q = query(usersRef, orderBy('currentSteps', 'desc'), firestoreLimit(count));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(docSnap => mapDocToUserProfile(docSnap)); // Changed doc to docSnap
}
