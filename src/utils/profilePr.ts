import type { Exercise, MuscleGroup, Workout } from '@/types';
import {
  findAllTimePRFor,
  formatDuration,
  isTimeBasedExercise,
  type PRRecord,
} from '@/utils/exerciseKind';

export interface PRItem {
  exerciseId: string;
  name: string;
  muscleGroupName: string | null;
  timeBased: boolean;
  pr: PRRecord | null;
  lastLoggedDate: string;
}

export function buildPRList(
  workoutsByDate: Record<string, Workout>,
  exerciseLookup: Record<string, Exercise>,
  muscleGroupLookup: Record<string, MuscleGroup>
): PRItem[] {
  const lastLogged = new Map<string, string>();
  for (const [date, w] of Object.entries(workoutsByDate)) {
    if (!w || !Array.isArray(w.entries)) continue;
    for (const entry of w.entries) {
      if (!entry.exerciseId) continue;
      const existing = lastLogged.get(entry.exerciseId);
      if (!existing || date > existing) {
        lastLogged.set(entry.exerciseId, date);
      }
    }
  }

  const rows: PRItem[] = [];
  for (const [exerciseId, lastLoggedDate] of lastLogged.entries()) {
    const exercise = exerciseLookup[exerciseId];
    const timeBased = exercise
      ? isTimeBasedExercise(exercise, muscleGroupLookup)
      : false;
    const pr = findAllTimePRFor(workoutsByDate, exerciseId, timeBased);
    const muscleGroupName = exercise
      ? muscleGroupLookup[exercise.muscleGroupId]?.name || null
      : null;
    rows.push({
      exerciseId,
      name: exercise?.name || exerciseId,
      muscleGroupName,
      timeBased,
      pr,
      lastLoggedDate,
    });
  }

  rows.sort((a, b) => {
    const aDate = a.pr?.date || '';
    const bDate = b.pr?.date || '';
    if (aDate && !bDate) return -1;
    if (!aDate && bDate) return 1;
    if (aDate && bDate && aDate !== bDate) return bDate.localeCompare(aDate);
    if (a.lastLoggedDate !== b.lastLoggedDate) {
      return b.lastLoggedDate.localeCompare(a.lastLoggedDate);
    }
    return a.name.localeCompare(b.name);
  });

  return rows;
}

export function formatPRValue(pr: PRRecord): string {
  if (pr.timeBased) {
    return `${formatDuration(pr.reps)} min`;
  }
  if (pr.weight !== null) {
    return `${pr.weight} kg × ${pr.reps} rep${pr.reps === 1 ? '' : 's'}`;
  }
  return `${pr.reps} rep${pr.reps === 1 ? '' : 's'} (bodyweight)`;
}
