
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
import type { UserProfile, CommunityStats, Team, DailyStep, StreakUpdateResults, StepSubmissionResult } from '@/types';
import { CHALLENGE_DURATION_DAYS } from '@/types'; // Import the constant
import type { User as FirebaseUser } from 'firebase/auth';
import { ALL_BADGES, type BadgeData, type BadgeId, getBadgeDataById } from '@/lib/badges';

const USERS_COLLECTION = 'users';
const TEAMS_COLLECTION = 'teams';
const COMMUNITY_COLLECTION = 'community';
const COMMUNITY_STATS_DOC = 'stats';
const DAILY_STEPS_SUBCOLLECTION = 'dailySteps';

// Helper to get today's date in YYYY-MM-DD format (UTC)
function getTodayDateStringUTC(): string {
  return new Date().toISOString().split('T')[0];
}

// Helper to get today's date in YYYY-MM-DD format (Local to the client)
function getTodaysDateClientLocal(): string {
  const now = new Date(); // Current moment in client's local timezone
  console.log('[getTodaysDateClientLocal] Raw `new Date()`:', now.toString(), 'Timestamp:', now.getTime());
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0'); // JS months are 0-indexed
  const day = now.getDate().toString().padStart(2, '0');
  const localDateString = `${year}-${month}-${day}`;
  console.log('[getTodaysDateClientLocal] Calculated localDateString:', localDateString);
  return localDateString;
}


// Helper function to map Firestore document snapshot to UserProfile
function mapDocToUserProfile(docSnap: DocumentSnapshot): UserProfile {
  const data = docSnap.data();
  if (!data) {
    throw new Error(`Document data not found for user ${docSnap.id}`);
  }
  return {
    uid: docSnap.id,
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
    lastStreakLoginDate: data.lastStreakLoginDate || null, // Should be YYYY-MM-DD
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
  const updatePayload = { ...data, uid: uid };
  // Ensure inviteLink is not undefined
  if (updatePayload.inviteLink === undefined) {
    updatePayload.inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || ''}/profile/${uid}`;
  }
  await setDoc(userRef, updatePayload, { merge: true });
}

export async function updateUserStreakOnLogin(uid: string): Promise<StreakUpdateResults> {
  const userRef = doc(db, USERS_COLLECTION, uid);
  const newLastLoginTimestamp = Timestamp.fromDate(new Date());
  const todayDateStringUTC = getTodayDateStringUTC(); // Streaks remain UTC based

  try {
    const result = await runTransaction(db, async (transaction) => {
      const userSnap = await transaction.get(userRef);

      if (!userSnap.exists()) {
        console.warn(`User profile ${uid} not found during streak update. Streak update skipped. Profile should be created via signup flow.`);
        return {
            updatedStreakCount: 0,
            updatedLastStreakLoginDate: null,
            updatedLastLoginTimestamp: newLastLoginTimestamp,
            streakProcessedForToday: false,
        };
      }

      const userProfile = mapDocToUserProfile(userSnap);
      let currentStreak = userProfile.currentStreak;
      let lastStreakLoginDateStr = userProfile.lastStreakLoginDate; // This is a UTC date string
      let streakProcessedForToday = false;
      let newStreakCount = currentStreak;
      let newLastStreakLoginDate = lastStreakLoginDateStr;

      if (!lastStreakLoginDateStr) { // First login or streak reset
        newStreakCount = 1;
        newLastStreakLoginDate = todayDateStringUTC;
        streakProcessedForToday = true;
      } else if (lastStreakLoginDateStr !== todayDateStringUTC) { // Logged in on a new UTC day
        streakProcessedForToday = true;
        const lastLoginDate = new Date(lastStreakLoginDateStr + 'T00:00:00Z'); // Treat as start of UTC day
        const todayStart = new Date(todayDateStringUTC + 'T00:00:00Z'); // Treat as start of UTC day

        const yesterdayStart = new Date(todayStart);
        yesterdayStart.setUTCDate(todayStart.getUTCDate() - 1);

        if (lastLoginDate.getTime() === yesterdayStart.getTime()) { // Check if last login was "yesterday" UTC
          newStreakCount = currentStreak + 1;
        } else {
          newStreakCount = 1; // Streak broken, reset
        }
        newLastStreakLoginDate = todayDateStringUTC;
      } else {
         // Already logged in today (UTC), no change to streak count or last streak date from this login
         streakProcessedForToday = false;
      }

      // Safety: if streak processed and result is 0, make it 1 (first day of new streak)
      if (streakProcessedForToday && newStreakCount === 0) {
        newStreakCount = 1;
      }

      transaction.update(userRef, {
        currentStreak: newStreakCount,
        lastStreakLoginDate: newLastStreakLoginDate, // Store UTC date for streak
        lastLoginTimestamp: newLastLoginTimestamp, // Always update to current login time
      });

      return {
        updatedStreakCount: newStreakCount,
        updatedLastStreakLoginDate: newLastStreakLoginDate,
        updatedLastLoginTimestamp: newLastLoginTimestamp,
        streakProcessedForToday: streakProcessedForToday,
      };
    });
    return result;
  } catch (error) {
    console.error("Transaction failed for streak update: ", error);
    const fallbackProfile = await getUserProfile(uid);
    return {
        updatedStreakCount: fallbackProfile?.currentStreak || 0,
        updatedLastStreakLoginDate: fallbackProfile?.lastStreakLoginDate || null,
        updatedLastLoginTimestamp: fallbackProfile?.lastLoginTimestamp || newLastLoginTimestamp,
        streakProcessedForToday: false,
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
    if (badge.id === 'team-player' || badge.id === 'social-butterfly') continue; // Event-based badges handled elsewhere

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

export async function awardSpecificBadgeIfUnearned(userId: string, badgeIdToAward: BadgeId): Promise<BadgeData | null> {
  const userRef = doc(db, USERS_COLLECTION, userId);
  try {
    const awardedBadgeData = await runTransaction(db, async (transaction) => {
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists()) {
        console.warn(`User profile ${userId} not found. Cannot award badge ${badgeIdToAward}.`);
        return null;
      }

      const userProfile = mapDocToUserProfile(userSnap);
      const currentBadges = userProfile.badgesEarned || [];

      if (currentBadges.includes(badgeIdToAward)) {
        return null; // Already has the badge
      }

      const badgeDefinition = getBadgeDataById(badgeIdToAward);
      if (!badgeDefinition) {
        console.warn(`Badge definition for ${badgeIdToAward} not found.`);
        return null;
      }

      const newBadgesArray = [...currentBadges, badgeIdToAward];
      transaction.update(userRef, { badgesEarned: newBadgesArray });
      return badgeDefinition; // Return the full BadgeData object
    });
    return awardedBadgeData;
  } catch (error) {
    console.error(`Error awarding badge ${badgeIdToAward} to user ${userId}:`, error);
    return null;
  }
}


export async function submitSteps(uid: string, stepsToAdd: number): Promise<StepSubmissionResult> {
  if (stepsToAdd <= 0) {
    throw new Error("Steps must be a positive number.");
  }

  const clientLocalDateString = getTodaysDateClientLocal();
  console.log('[firebaseService.submitSteps] Logging steps for date:', clientLocalDateString, 'Steps:', stepsToAdd);

  const userDocRef = doc(db, USERS_COLLECTION, uid);
  const communityStatsRef = doc(db, COMMUNITY_COLLECTION, COMMUNITY_STATS_DOC);
  const userDailyStepDocRef = doc(db, USERS_COLLECTION, uid, DAILY_STEPS_SUBCOLLECTION, clientLocalDateString);
  const communityDailyStepDocRef = doc(db, COMMUNITY_COLLECTION, COMMUNITY_STATS_DOC, DAILY_STEPS_SUBCOLLECTION, clientLocalDateString);


  let teamDocRef: DocumentReference | undefined;
  let userProfileDataBeforeUpdate: UserProfile | null = null;
  let dailyGoalAchieved = false;

  await runTransaction(db, async (transaction) => {
    const userDocSnap = await transaction.get(userDocRef);
    const communityStatsDoc = await transaction.get(communityStatsRef);

    if (!userDocSnap.exists()) {
      throw new Error("User profile does not exist for step submission.");
    }
    userProfileDataBeforeUpdate = mapDocToUserProfile(userDocSnap);

    const userDailyStepSnap = await transaction.get(userDailyStepDocRef);
    const userDailyStepDataBeforeUpdate = userDailyStepSnap.data() as DailyStep | undefined;

    let teamDocSnap: DocumentSnapshot | undefined;
    if (userProfileDataBeforeUpdate.teamId) {
      teamDocRef = doc(db, TEAMS_COLLECTION, userProfileDataBeforeUpdate.teamId);
      teamDocSnap = await transaction.get(teamDocRef);
    }

    // Update user's total steps
    transaction.update(userDocRef, { currentSteps: increment(stepsToAdd) });

    // Update community's overall total steps
    if (!communityStatsDoc.exists()) {
      transaction.set(communityStatsRef, { totalSteps: stepsToAdd, totalParticipants: 1 });
    } else {
      transaction.update(communityStatsRef, { totalSteps: increment(stepsToAdd) });
    }
    
    // Update user's daily steps for client's local date
    const newUserDailyStepsValue = (userDailyStepDataBeforeUpdate?.steps || 0) + stepsToAdd;
    const userDailyStepUpdatePayload: DailyStep = {
        date: clientLocalDateString, 
        steps: newUserDailyStepsValue,
    };

    if (userProfileDataBeforeUpdate?.stepGoal && userProfileDataBeforeUpdate.stepGoal > 0) {
        const dailyCalculatedGoal = Math.round(userProfileDataBeforeUpdate.stepGoal / CHALLENGE_DURATION_DAYS);
        if (newUserDailyStepsValue >= dailyCalculatedGoal && !userDailyStepDataBeforeUpdate?.dailyGoalMetOnThisDate) {
            userDailyStepUpdatePayload.dailyGoalMetOnThisDate = true;
            dailyGoalAchieved = true;
        } else if (userDailyStepDataBeforeUpdate?.dailyGoalMetOnThisDate) {
            userDailyStepUpdatePayload.dailyGoalMetOnThisDate = true; // Preserve if already met
        }
    }
    transaction.set(userDailyStepDocRef, userDailyStepUpdatePayload, { merge: true });

    // Update community's daily steps for client's local date
    transaction.set(communityDailyStepDocRef, { date: clientLocalDateString, steps: increment(stepsToAdd) }, { merge: true });


    if (userProfileDataBeforeUpdate?.teamId && teamDocRef && teamDocSnap?.exists()) {
      transaction.update(teamDocRef, { totalSteps: increment(stepsToAdd) });
    }
  });

  const updatedUserProfile = await getUserProfile(uid);
  if (!updatedUserProfile || typeof updatedUserProfile.currentSteps !== 'number') {
    console.error("Failed to get updated user profile or currentSteps after step submission.");
    return { newlyAwardedBadges: [], dailyGoalAchieved: dailyGoalAchieved };
  }

  const newlyAwardedBadges = await checkAndAwardBadges(uid, updatedUserProfile.currentSteps, updatedUserProfile.badgesEarned || []);
  return { newlyAwardedBadges, dailyGoalAchieved };
}

export async function getUserDailySteps(uid: string, limitDays: number = 30): Promise<DailyStep[]> {
  console.log(`[firebaseService] getUserDailySteps called for UID: ${uid}, limit: ${limitDays}`);
  const dailyStepsRef = collection(db, USERS_COLLECTION, uid, DAILY_STEPS_SUBCOLLECTION);
  const q = query(dailyStepsRef, orderBy('date', 'desc'), firestoreLimit(limitDays));
  const querySnapshot = await getDocs(q);

  const dailySteps: DailyStep[] = [];
  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    dailySteps.push({
      date: data.date, 
      steps: data.steps,
      dailyGoalMetOnThisDate: data.dailyGoalMetOnThisDate || false,
    });
  });
  console.log(`[firebaseService] getUserDailySteps for UID ${uid} returning:`, JSON.stringify(dailySteps.slice().reverse(), null, 2));
  return dailySteps.reverse();
}

export async function getCommunityDailySteps(limitDays: number = 30): Promise<DailyStep[]> {
  console.log(`[firebaseService] getCommunityDailySteps called, limit: ${limitDays}`);
  const dailyStepsRef = collection(db, COMMUNITY_COLLECTION, COMMUNITY_STATS_DOC, DAILY_STEPS_SUBCOLLECTION);
  const q = query(dailyStepsRef, orderBy('date', 'desc'), firestoreLimit(limitDays));
  const querySnapshot = await getDocs(q);

  const dailySteps: DailyStep[] = [];
  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    // For community, dailyGoalMetOnThisDate is not applicable
    dailySteps.push({
      date: data.date,
      steps: data.steps,
    });
  });
   console.log(`[firebaseService] getCommunityDailySteps returning:`, JSON.stringify(dailySteps.slice().reverse(), null, 2));
  return dailySteps.reverse(); 
}


export async function getCommunityStats(): Promise<CommunityStats> {
  const docRef = doc(db, COMMUNITY_COLLECTION, COMMUNITY_STATS_DOC);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
        totalSteps: data.totalSteps || 0,
        totalParticipants: data.totalParticipants || 0,
    }
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

export interface TeamActionResult {
  teamId: string;
  teamName: string;
  awardedTeamBadge?: BadgeData | null;
}

export async function createTeam(creatorUserId: string, teamName: string, creatorCurrentSteps: number): Promise<TeamActionResult> {
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

export async function joinTeam(userId: string, teamIdToJoin: string, userCurrentSteps: number): Promise<TeamActionResult | null> {
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

    const stepsToDecrement = typeof userData.currentSteps === 'number' ? userData.currentSteps : 0;

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
  return querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Team));
}

export async function getTeamMembersProfiles(memberUids: string[]): Promise<UserProfile[]> {
  if (!memberUids || memberUids.length === 0) return [];

  const profiles: UserProfile[] = [];
  const CHUNK_SIZE = 30; // Firestore 'in' query limit
  for (let i = 0; i < memberUids.length; i += CHUNK_SIZE) {
      const chunk = memberUids.slice(i, i + CHUNK_SIZE);
      if (chunk.length > 0) {
        const usersRef = collection(db, USERS_COLLECTION);
        const q = query(usersRef, where(documentId(), 'in', chunk));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(docSnap => {
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
  const q = query(usersRef, where("profileComplete", "==", true), orderBy('currentSteps', 'desc'), firestoreLimit(count));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(docSnap => mapDocToUserProfile(docSnap));
}
