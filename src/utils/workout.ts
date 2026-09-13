import type { Workout } from '@/types';

/**
 * The server keeps the workout row for a date even after its last entry is
 * removed, so the mere existence of a row is not proof the user trained that
 * day. A day only counts as logged once it holds at least one recorded set.
 */
export function hasLoggedSets(workout: Workout | null | undefined): boolean {
  if (!workout) return false;
  return (workout.entries || []).some((entry) => (entry.sets || []).length > 0);
}