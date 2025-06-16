
import { CHALLENGE_DURATION_DAYS } from '@/types';

// Fixed year for the challenge
export const CHALLENGE_START_YEAR = 2025;

// JS months are 0-indexed (0=Jan, 5=June, 9=Oct)
export const CHALLENGE_START_MONTH_JS = 5; // June
export const CHALLENGE_START_DAY_JS = 21;
export const CHALLENGE_END_MONTH_JS = 9;   // October
export const CHALLENGE_END_DAY_JS = 31;

export function getChallengeStartDateForYear(year: number): Date {
  return new Date(Date.UTC(year, CHALLENGE_START_MONTH_JS, CHALLENGE_START_DAY_JS, 0, 0, 0, 0));
}

export function isChallengeActive(currentDateOverride?: Date): boolean {
  const today = currentDateOverride || new Date(); // Use override if provided, else current date
  const currentYear = today.getUTCFullYear(); // Use UTC year from the effective "today"

  // If testing with an override, and the override year is different from CHALLENGE_START_YEAR,
  // then the challenge should be considered inactive unless the override year IS the CHALLENGE_START_YEAR.
  // This ensures tests for specific days in 2025 work, but dates outside 2025 are inactive.
  if (currentYear !== CHALLENGE_START_YEAR) {
    return false;
  }

  // Use CHALLENGE_START_YEAR for start and end date comparisons
  const challengeStartDate = new Date(Date.UTC(CHALLENGE_START_YEAR, CHALLENGE_START_MONTH_JS, CHALLENGE_START_DAY_JS, 0, 0, 0, 0));
  const challengeEndDate = new Date(Date.UTC(CHALLENGE_START_YEAR, CHALLENGE_END_MONTH_JS, CHALLENGE_END_DAY_JS, 23, 59, 59, 999));

  const todayAtStartOfDayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

  // // console.log(`[isChallengeActive] Effective Today (UTC start): ${todayAtStartOfDayUTC.toISOString()}`);
  // // console.log(`[isChallengeActive] Challenge Start (UTC): ${challengeStartDate.toISOString()}`);
  // // console.log(`[isChallengeActive] Challenge End (UTC): ${challengeEndDate.toISOString()}`);
  // // console.log(`[isChallengeActive] Is Active: ${todayAtStartOfDayUTC >= challengeStartDate && todayAtStartOfDayUTC <= challengeEndDate}`);

  return todayAtStartOfDayUTC >= challengeStartDate && todayAtStartOfDayUTC <= challengeEndDate;
}


export function getChallengeDayNumberFromDateString(dateString: string): number {
  const targetDateParts = dateString.split('-').map(Number);
  // Ensure date is parsed in UTC to align with challenge start date definition
  const targetDate = new Date(Date.UTC(targetDateParts[0], targetDateParts[1] - 1, targetDateParts[2]));

  // Ensure challenge start date is also in UTC for correct comparison
  const challengeStartDate = getChallengeStartDateForYear(targetDateParts[0]); // Use year from dateString

  if (targetDate < challengeStartDate) {
    return 0; // Date is before challenge start
  }
  const diffTime = Math.abs(targetDate.getTime() - challengeStartDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1; // Day 1 is the start day itself
}

export function getChallengeDateStringByDayNumber(dayNumber: number): string {
  if (dayNumber < 1 || dayNumber > CHALLENGE_DURATION_DAYS) {
    // // console.warn(`[getChallengeDateStringByDayNumber] Invalid dayNumber: ${dayNumber}. Returning placeholder.`);
    // Fallback to day 1 if out of range, though this indicates an issue.
    const fallbackDate = getChallengeStartDateForYear(CHALLENGE_START_YEAR);
    return `${fallbackDate.getUTCFullYear()}-${String(fallbackDate.getUTCMonth() + 1).padStart(2, '0')}-${String(fallbackDate.getUTCDate()).padStart(2, '0')}`;
  }

  const challengeStartDate = getChallengeStartDateForYear(CHALLENGE_START_YEAR);
  const targetDate = new Date(challengeStartDate);
  targetDate.setUTCDate(challengeStartDate.getUTCDate() + dayNumber - 1);

  return `${targetDate.getUTCFullYear()}-${String(targetDate.getUTCMonth() + 1).padStart(2, '0')}-${String(targetDate.getUTCDate()).padStart(2, '0')}`;
}
