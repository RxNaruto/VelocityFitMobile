import type { EntryDraft, WorkoutEntry, WorkoutSet } from '@/types';

export function rid(prefix = 'tmp'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}

function draftSetToWorkoutSet(set: EntryDraft['sets'][number]): WorkoutSet {
  return {
    id: rid('tmp_set'),
    reps: set.reps,
    weight: set.weight,
    isFailure: set.isFailure,
    drops: (set.drops || []).map((d) => ({
      id: rid('tmp_drop'),
      reps: d.reps,
      weight: d.weight,
    })),
  };
}

export function toDraftEntry(entry: EntryDraft): WorkoutEntry {
  return {
    id: rid(),
    exerciseId: entry.exerciseId,
    notes: entry.notes,
    sets: entry.sets.map(draftSetToWorkoutSet),
  };
}

export function toEntryDraft(entry: WorkoutEntry): EntryDraft {
  return {
    exerciseId: entry.exerciseId,
    notes: entry.notes,
    sets: entry.sets.map((s) => ({
      reps: Number(s.reps) || 0,
      weight:
        s.weight === null || (s.weight as unknown as string) === ''
          ? null
          : Number(s.weight),
      isFailure: Boolean(s.isFailure),
      drops: (s.drops || []).map((d) => ({
        reps: Number(d.reps) || 0,
        weight:
          d.weight === null || (d.weight as unknown as string) === ''
            ? null
            : Number(d.weight),
      })),
    })),
  };
}

export function mergeDuplicateEntries(entries: WorkoutEntry[]): WorkoutEntry[] {
  const byExerciseId = new Map<string, WorkoutEntry>();
  for (const e of entries) {
    const existing = byExerciseId.get(e.exerciseId);
    if (!existing) {
      byExerciseId.set(e.exerciseId, { ...e, sets: [...e.sets] });
      continue;
    }
    existing.sets = [...existing.sets, ...e.sets];
    if (e.notes && e.notes !== existing.notes) {
      existing.notes = existing.notes ? `${existing.notes}\n${e.notes}` : e.notes;
    }
  }
  return Array.from(byExerciseId.values());
}

export function appendEntryDraft(
  entries: WorkoutEntry[],
  draft: EntryDraft
): { next: WorkoutEntry[]; merged: boolean } {
  const idx = entries.findIndex((e) => e.exerciseId === draft.exerciseId);
  if (idx === -1) {
    return { next: [...entries, toDraftEntry(draft)], merged: false };
  }

  const next = [...entries];
  const existing = next[idx]!;
  next[idx] = {
    ...existing,
    sets: [...existing.sets, ...draft.sets.map(draftSetToWorkoutSet)],
    notes: draft.notes
      ? existing.notes
        ? `${existing.notes}\n${draft.notes}`
        : draft.notes
      : existing.notes,
  };
  return { next, merged: true };
}
