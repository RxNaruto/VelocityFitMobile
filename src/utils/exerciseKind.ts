import type {
  Exercise,
  MuscleGroup,
  Workout,
  WorkoutEntry,
  WorkoutSet,
} from '@/types';

export const CARDIO_SLUG = 'cardio';

export function isTimeBasedExercise(
  exercise: Exercise | undefined | null,
  muscleGroupLookup: Record<string, MuscleGroup>
): boolean {
  if (!exercise) return false;
  if (exercise.tracksTime === true) return true;
  const g = muscleGroupLookup[exercise.muscleGroupId];
  return !!g && g.slug === CARDIO_SLUG;
}

export function isTimeBasedEntry(
  exerciseId: string,
  exerciseLookup: Record<string, Exercise>,
  muscleGroupLookup: Record<string, MuscleGroup>
): boolean {
  return isTimeBasedExercise(exerciseLookup[exerciseId], muscleGroupLookup);
}

export function isCardioGroup(group: { slug?: string } | null | undefined): boolean {
  return !!group && group.slug === CARDIO_SLUG;
}

export function toSeconds(minutes: number | string, seconds: number | string): number {
  const m = Number(minutes) || 0;
  const s = Number(seconds) || 0;
  return Math.max(0, Math.floor(m * 60 + s));
}

export function fromSeconds(total: number): { minutes: number; seconds: number } {
  const safe = Math.max(0, Math.floor(Number(total) || 0));
  return { minutes: Math.floor(safe / 60), seconds: safe % 60 };
}

export function formatDuration(total: number): string {
  const safe = Math.max(0, Math.floor(Number(total) || 0));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

export function describeSet(set: WorkoutSet, timeBased: boolean): string {
  if (timeBased) return formatDuration(set.reps);
  const weight = set.weight;
  const hasWeight =
    weight !== null && weight !== undefined && (weight as unknown as string) !== '';
  return hasWeight ? `${set.reps} x ${weight}` : String(set.reps);
}

export function findLastSessionFor(
  workoutsByDate: Record<string, Workout>,
  exerciseId: string,
  today: string
): { date: string; entry: WorkoutEntry } | null {
  if (!exerciseId) return null;
  const dates = Object.keys(workoutsByDate)
    .filter((d) => d < today)
    .sort()
    .reverse();
  for (const d of dates) {
    const w = workoutsByDate[d];
    if (!w || !Array.isArray(w.entries)) continue;
    const entry = w.entries.find(
      (e) => e.exerciseId === exerciseId && Array.isArray(e.sets) && e.sets.length > 0
    );
    if (entry) return { date: d, entry };
  }
  return null;
}

export interface PRRecord {
  date: string;
  reps: number;
  weight: number | null;
  timeBased: boolean;
}

export function findAllTimePRFor(
  workoutsByDate: Record<string, Workout>,
  exerciseId: string,
  timeBased: boolean
): PRRecord | null {
  if (!exerciseId) return null;
  let best: PRRecord | null = null;
  for (const d of Object.keys(workoutsByDate)) {
    const w = workoutsByDate[d];
    if (!w || !Array.isArray(w.entries)) continue;
    for (const entry of w.entries) {
      if (entry.exerciseId !== exerciseId) continue;
      for (const s of entry.sets || []) {
        if (timeBased) {
          const seconds = Number(s.reps) || 0;
          if (seconds <= 0) continue;
          if (!best || seconds > best.reps) {
            best = { date: d, reps: seconds, weight: null, timeBased: true };
          }
          continue;
        }
        const weight =
          s.weight === null || s.weight === undefined ? null : Number(s.weight);
        if (weight === null || !Number.isFinite(weight) || weight <= 0) continue;
        const reps = Number(s.reps) || 0;
        if (
          !best ||
          (best.weight ?? 0) < weight ||
          ((best.weight ?? 0) === weight && reps > best.reps)
        ) {
          best = { date: d, reps, weight, timeBased: false };
        }
      }
    }
  }
  return best;
}
