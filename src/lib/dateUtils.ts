
// src/lib/dateUtils.ts

import { CHALLENGE_DURATION_DAYS } from '@/types';

// Challenge Date Configuration
export const CHALLENGE_START_YEAR = 2025;
export const CHALLENGE_START_MONTH_JS = 5; // 0-indexed for June
export const CHALLENGE_START_DAY_JS = 21;
export const CHALLENGE_END_MONTH_JS = 9;   // 0-indexed for October
export const CHALLENGE_END_DAY_JS = 31;

export function isChallengeActive(currentDate: Date = new Date()): boolean {
  const startDate = new Date(CHALLENGE_START_YEAR, CHALLENGE_START_MONTH_JS, CHALLENGE_START_DAY_JS, 0, 0, 0, 0);
  const endDate = new Date(CHALLENGE_START_YEAR, CHALLENGE_END_MONTH_JS, CHALLENGE_END_DAY_JS, 23, 59, 59, 999);
  return currentDate >= startDate && currentDate <= endDate;
}

// Helper function to get the challenge start date for a given year (UTC)
export function getChallengeStartDateForYear(year: number): Date {
  return new Date(Date.UTC(year, CHALLENGE_START_MONTH_JS, CHALLENGE_START_DAY_JS)); // June 21st, UTC (Month is 0-indexed, so 5 is June)
}

// Helper function to get the date string for a specific challenge day number
export function getChallengeDateStringByDayNumber(dayNumber: number): string {
  const startDate = getChallengeStartDateForYear(CHALLENGE_START_YEAR);
  const targetDate = new Date(startDate.getTime());
  targetDate.setUTCDate(startDate.getUTCDate() + dayNumber - 1);

  const y = targetDate.getUTCFullYear();
  const m = (targetDate.getUTCMonth() + 1).toString().padStart(2, '0');
  const d = targetDate.getUTCDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getChallengeDayNumberFromDateString(dateString: string): number {
  const [year, month, day] = dateString.split('-').map(Number);
  if (year !== CHALLENGE_START_YEAR) return 0;

  const currentDate = new Date(Date.UTC(year, month - 1, day));
  const challengeStartDate = getChallengeStartDateForYear(CHALLENGE_START_YEAR);

  if (currentDate < challengeStartDate) return 0;

  const diffTime = currentDate.getTime() - challengeStartDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  const dayNumber = diffDays + 1;
  return Math.max(1, Math.min(dayNumber, CHALLENGE_DURATION_DAYS));
}
