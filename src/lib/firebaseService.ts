
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


// Helper function to get the challenge start date for a given year (UTC)
export function getChallengeStartDate(year: number): Date {
  return new Date(Date.UTC(year, 5, 21)); // June 21st, UTC (Month is 0-indexed, so 5 is June)
}

// Helper function to get the date string for a specific challenge day number
export function getChallengeDateStringByDayNumber(dayNumber: number, challengeYear?: number): string {
  const year = challengeYear || new Date().getUTCFullYear();
  const startDate = getChallengeStartDate(year);
  // Create a new Date object from startDate to avoid modifying it directly
  const targetDate = new Date(startDate.getTime());
  targetDate.setUTCDate(startDate.getUTCDate() + dayNumber - 1);

  const y = targetDate.getUTCFullYear();
  const m = (targetDate.getUTCMonth() + 1).toString().padStart(2, '0');
  const d = targetDate.getUTCDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Helper function to calculate the challenge day number (1-133) from a date string
export function getChallengeDayNumberFromDateString(dateString: string): number {
  const [year, month, day] = dateString.split('-').map(Number);
  const currentDate = new Date(Date.UTC(year, month - 1, day)); // Month is 0-indexed for Date constructor

  const challengeStartDate = getChallengeStartDate(currentDate.getUTCFullYear());

  if (currentDate < challengeStartDate) return 0; // Before challenge start

  const diffTime = currentDate.getTime() - challengeStartDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  const dayNumber = diffDays + 1;
  return Math.max(1, Math.min(dayNumber, CHALLENGE_DURATION_DAYS)); // Clamp between 1 and 133
}


// Helper to get today's date in YYYY-MM-DD format (Local to the client)
export function getTodaysDateClientLocal(): string {
  // FOR TESTING CHRYSALIS VARIANTS:
  // To test a specific day's Chrysalis variant:
  // 1. Determine the target day number (1-133).
  // 2. Calculate the date (June 21st is Day 1, Oct 31st is Day 133 for current year).
  // 3. Uncomment the line below and update the string to "YYYY-MM-DD" for that date.
  //    Example: For Day 1 (June 21st, 2024), use "2024-06-21".
  //             For Day 5 (June 25th, 2024), use "2024-06-25".
  // return "2024-06-21"; // << EDIT THIS LINE FOR TESTING SPECIFIC DAYS

  // ORIGINAL IMPLEMENTATION (Revert to this after testing):
  const now = new Date(); // Current moment in client's local timezone
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0'); // JS months are 0-indexed
  const day = now.getDate().toString().padStart(2, '0');
  const localDateString = `${year}-${month}-${day}`;
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
    photoURL: data.photoURL || null,
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
    chrysalisCoinDates: Array.isArray(data.chrysalisCoinDates) ? data.chrysalisCoinDates : [],
    timezone: data.timezone || null,
    activeChrysalisThemeId: data.activeChrysalisThemeId || null,
    dashboardLayout: data.dashboardLayout || { dashboardOrder: [], communityOrder: [] },
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
  let browserTimezone: string | null = null;
  try {
    browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (e) {
    console.warn("Could not determine browser timezone for new user profile.", e);
  }

  const baseProfileData: UserProfile = {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Anonymous User',
    photoURL: firebaseUser.photoURL || null,
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
    chrysalisCoinDates: [],
    timezone: additionalData.timezone !== undefined ? additionalData.timezone : browserTimezone,
    activeChrysalisThemeId: null,
    dashboardLayout: { dashboardOrder: [], communityOrder: [] },
  };

  const profileData = { ...baseProfileData, ...additionalData };
  profileData.email = firebaseUser.email;
  profileData.uid = firebaseUser.uid;

  await setDoc(userProfileRef, profileData);
  return profileData;
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  const userRef = doc(db, USERS_COLLECTION, uid);
  const updatePayload: Partial<UserProfile> = { ...data };

  delete updatePayload.uid;
  delete updatePayload.email;

  if (updatePayload.inviteLink === undefined && data.inviteLink !== null) {
    updatePayload.inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || ''}/profile/${uid}`;
  }

  if (data.hasOwnProperty('activeChrysalisThemeId')) {
    updatePayload.activeChrysalisThemeId = data.activeChrysalisThemeId;
  }
  await setDoc(userRef, updatePayload, { merge: true });
}


export async function updateUserStreakOnLogin(uid: string): Promise<StreakUpdateResults> {
  const userRef = doc(db, USERS_COLLECTION, uid);
  const newLastLoginTimestamp = Timestamp.fromDate(new Date());
  const todayDateStringLocal = getTodaysDateClientLocal();

  try {
    const result = await runTransaction(db, async (transaction) => {
      const userSnap = await transaction.get(userRef);

      if (!userSnap.exists()) {
        console.warn(`User profile ${uid} not found during streak update. Streak update skipped.`);
        return {
            updatedStreakCount: 0,
            updatedLastStreakLoginDate: null,
            updatedLastLoginTimestamp: newLastLoginTimestamp,
            streakProcessedForToday: false,
        };
      }

      const userProfile = mapDocToUserProfile(userSnap);
      let currentStreak = userProfile.currentStreak;
      let lastStreakLoginDateStr = userProfile.lastStreakLoginDate;
      let streakProcessedForToday = false;
      let newStreakCount = currentStreak;
      let newLastStreakLoginDate = lastStreakLoginDateStr;

      if (!lastStreakLoginDateStr) {
        newStreakCount = 1;
        newLastStreakLoginDate = todayDateStringLocal;
        streakProcessedForToday = true;
      } else if (lastStreakLoginDateStr !== todayDateStringLocal) {
        streakProcessedForToday = true;
        const lastLoginDateParts = lastStreakLoginDateStr.split('-').map(Number);
        const lastLoginDate = new Date(lastLoginDateParts[0], lastLoginDateParts[1] - 1, lastLoginDateParts[2]);
        const todayLocalParts = todayDateStringLocal.split('-').map(Number);
        const todayStartLocal = new Date(todayLocalParts[0], todayLocalParts[1] - 1, todayLocalParts[2]);
        const yesterdayStartLocal = new Date(todayStartLocal);
        yesterdayStartLocal.setDate(todayStartLocal.getDate() - 1);

        if (lastLoginDate.getTime() === yesterdayStartLocal.getTime()) {
          newStreakCount = currentStreak + 1;
        } else {
          newStreakCount = 1;
        }
        newLastStreakLoginDate = todayDateStringLocal;
      } else {
         streakProcessedForToday = false;
      }

      if (streakProcessedForToday && newStreakCount === 0) {
        newStreakCount = 1;
      }

      transaction.update(userRef, {
        currentStreak: newStreakCount,
        lastStreakLoginDate: newLastStreakLoginDate,
        lastLoginTimestamp: newLastLoginTimestamp,
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


/**
 * Checks and awards step-based badges to a user.
 * This function ONLY processes badges of type: 'step'.
 * Streak badges are handled separately in AuthContext.
 * Event badges (like 'team-player', 'social-butterfly') are awarded at the time of the event.
 */
export async function checkAndAwardBadges(
  uid: string,
  currentTotalSteps: number,
  currentUserBadgeIds: BadgeId[]
): Promise<BadgeData[]> {
  const newlyEarnedBadgesData: BadgeData[] = [];
  const newBadgeIdsToSaveSet = new Set<BadgeId>(currentUserBadgeIds);

  // Only process badges of type 'step'
  for (const badge of ALL_BADGES.filter(b => b.type === 'step')) {
    // 'first-step' has milestone 1 (step), others have step counts
    if (currentTotalSteps >= badge.milestone && !currentUserBadgeIds.includes(badge.id)) {
      if (!newBadgeIdsToSaveSet.has(badge.id)) {
         newlyEarnedBadgesData.push(badge);
         newBadgeIdsToSaveSet.add(badge.id);
      }
    }
  }

  if (newlyEarnedBadgesData.length > 0) {
    // The actual update to Firestore should happen in AuthContext after all badge processing
    // to ensure a single write with all new badges (step and streak).
    // For now, this function returns the badges that *would* be awarded.
    // If AuthContext is changed to not update, then this line would be reinstated:
    // await updateUserProfile(uid, { badgesEarned: Array.from(newBadgeIdsToSaveSet) });
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
        return null;
      }

      const badgeDefinition = getBadgeDataById(badgeIdToAward);
      if (!badgeDefinition) {
        console.warn(`Badge definition for ${badgeIdToAward} not found.`);
        return null;
      }

      const newBadgesArray = [...currentBadges, badgeIdToAward];
      transaction.update(userRef, { badgesEarned: newBadgesArray });
      return badgeDefinition;
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

  const userDocRef = doc(db, USERS_COLLECTION, uid);
  const communityStatsRef = doc(db, COMMUNITY_COLLECTION, COMMUNITY_STATS_DOC);
  const userDailyStepDocRef = doc(db, USERS_COLLECTION, uid, DAILY_STEPS_SUBCOLLECTION, clientLocalDateString);
  const communityDailyStepDocRef = doc(db, COMMUNITY_COLLECTION, COMMUNITY_STATS_DOC, DAILY_STEPS_SUBCOLLECTION, clientLocalDateString);


  let teamDocRef: DocumentReference | undefined;
  let userProfileDataBeforeUpdate: UserProfile | null = null;
  let dailyGoalAchieved = false;
  let updatedCurrentTotalSteps = 0;

  await runTransaction(db, async (transaction) => {
    const userDocSnap = await transaction.get(userDocRef);
    const communityStatsDoc = await transaction.get(communityStatsRef);

    if (!userDocSnap.exists()) {
      throw new Error("User profile does not exist for step submission.");
    }
    userProfileDataBeforeUpdate = mapDocToUserProfile(userDocSnap);
    updatedCurrentTotalSteps = (userProfileDataBeforeUpdate.currentSteps || 0) + stepsToAdd;

    const userDailyStepSnap = await transaction.get(userDailyStepDocRef);
    const userDailyStepDataBeforeUpdate = userDailyStepSnap.data() as DailyStep | undefined;

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
            userDailyStepUpdatePayload.dailyGoalMetOnThisDate = true;
        }
    }
    transaction.set(userDailyStepDocRef, userDailyStepUpdatePayload, { merge: true });

    transaction.set(communityDailyStepDocRef, { date: clientLocalDateString, steps: increment(stepsToAdd) }, { merge: true });


    if (userProfileDataBeforeUpdate?.teamId && teamDocRef && teamDocSnap?.exists()) {
      transaction.update(teamDocRef, { totalSteps: increment(stepsToAdd) });
    }
  });

  // Badge awarding logic is now primarily handled in AuthContext after profile refresh.
  // This function returns dailyGoalAchieved, and AuthContext will call checkAndAwardBadges.
  return { newlyAwardedBadges: [], dailyGoalAchieved: dailyGoalAchieved };
}

export async function getUserDailySteps(uid: string, limitDays: number = 30): Promise<DailyStep[]> {
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
  return dailySteps.reverse();
}

export async function getDailyStepForDate(uid: string, dateString: string): Promise<DailyStep | null> {
  const dailyStepDocRef = doc(db, USERS_COLLECTION, uid, DAILY_STEPS_SUBCOLLECTION, dateString);
  const docSnap = await getDoc(dailyStepDocRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      date: data.date,
      steps: data.steps,
      dailyGoalMetOnThisDate: data.dailyGoalMetOnThisDate || false,
    };
  }
  return null;
}


export async function getCommunityDailySteps(limitDays: number = 30): Promise<DailyStep[]> {
  const dailyStepsRef = collection(db, COMMUNITY_COLLECTION, COMMUNITY_STATS_DOC, DAILY_STEPS_SUBCOLLECTION);
  const q = query(dailyStepsRef, orderBy('date', 'desc'), firestoreLimit(limitDays));
  const querySnapshot = await getDocs(q);

  const dailySteps: DailyStep[] = [];
  querySnapshot.forEach((docSnap) => {
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
  const CHUNK_SIZE = 30;
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

