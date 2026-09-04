import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { EntryList } from '@/components/EntryList';
import { ExercisePicker } from '@/components/ExercisePicker';
import { MuscleGroupPicker } from '@/components/MuscleGroupPicker';
import { PageToolbar } from '@/components/PageToolbar';
import { SetLogger } from '@/components/SetLogger';
import { AddWorkoutStep, STEP, WorkoutBreadcrumb } from '@/components/WorkoutBreadcrumb';
import { useWorkouts } from '@/context/WorkoutContext';
import {
  appendEntryDraft,
  mergeDuplicateEntries,
  toEntryDraft,
} from '@/utils/workoutDraft';
import { formatPretty, todayKey } from '@/utils/dates';
import { showError, showSuccess } from '@/utils/feedback';
import type { EntryDraft, Exercise, MuscleGroup, WorkoutEntry } from '@/types';
import { Button, Screen } from '@/components/ui';
import { colors, spacing, typography } from '@/theme';

const VALID_STEPS = new Set<AddWorkoutStep>(Object.values(STEP));

function readStep(value: string | undefined): AddWorkoutStep {
  if (value && VALID_STEPS.has(value as AddWorkoutStep)) return value as AddWorkoutStep;
  return STEP.OVERVIEW;
}

type DraftEntry = WorkoutEntry;

export default function AddWorkoutScreen() {
  const router = useRouter();
  const { step: stepParam } = useLocalSearchParams<{ step?: string }>();
  const { workoutsByDate, saveToday, exerciseLookup, muscleGroupLookup } = useWorkouts();
  const today = todayKey();
  const existing = workoutsByDate[today];

  const [step, setStep] = useState<AddWorkoutStep>(() => readStep(stepParam));
  const [entries, setEntries] = useState<DraftEntry[]>(() =>
    mergeDuplicateEntries(existing?.entries || [])
  );
  const [selectedGroup, setSelectedGroup] = useState<MuscleGroup | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [persisting, setPersisting] = useState(false);
  const saveSeqRef = useRef(0);

  useEffect(() => {
    if (!stepParam) return;
    const queryStep = readStep(stepParam);
    if (queryStep === STEP.PICK_GROUP) {
      setSelectedGroup(null);
      setSelectedExercise(null);
    } else if (queryStep === STEP.PICK_EXERCISE) {
      setSelectedExercise(null);
    } else if (queryStep === STEP.OVERVIEW) {
      setSelectedGroup(null);
      setSelectedExercise(null);
    }
    setStep(queryStep);
  }, [stepParam]);

  const totalSets = useMemo(
    () => entries.reduce((sum, e) => sum + e.sets.length, 0),
    [entries]
  );

  async function persistEntries(
    next: DraftEntry[],
    previous: DraftEntry[],
    successMessage: string
  ) {
    const seq = ++saveSeqRef.current;
    setPersisting(true);
    try {
      const saved = await saveToday(next.map(toEntryDraft));
      if (seq !== saveSeqRef.current) return;
      setEntries(saved.entries);
      showSuccess(successMessage);
    } catch (err) {
      if (seq !== saveSeqRef.current) return;
      setEntries(previous);
      showError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      if (seq === saveSeqRef.current) setPersisting(false);
    }
  }

  function handlePickGroup(group: MuscleGroup) {
    setSelectedGroup(group);
    setStep(STEP.PICK_EXERCISE);
  }

  function handlePickExercise(exercise: Exercise) {
    setSelectedExercise(exercise);
    setStep(STEP.LOG_SETS);
  }

  function handleAddEntry(entry: EntryDraft) {
    const previous = entries;
    const { next, merged } = appendEntryDraft(previous, entry);
    setEntries(next);
    const exerciseName = exerciseLookup[entry.exerciseId]?.name || 'exercise';
    const successMsg = merged
      ? `Added ${entry.sets.length} more set(s) to ${exerciseName}`
      : `Added ${exerciseName}`;
    void persistEntries(next, previous, successMsg);
    setSelectedExercise(null);
    setStep(STEP.PICK_EXERCISE);
  }

  function handleRemoveEntry(idx: number) {
    const previous = entries;
    const removed = previous[idx];
    if (!removed) return;
    const next = previous.filter((_, i) => i !== idx);
    setEntries(next);
    const name = exerciseLookup[removed.exerciseId]?.name || 'exercise';
    void persistEntries(next, previous, `Removed ${name}`);
  }

  function handleBack() {
    if (step === STEP.LOG_SETS) {
      setSelectedExercise(null);
      setStep(STEP.PICK_EXERCISE);
    } else if (step === STEP.PICK_EXERCISE) {
      setSelectedGroup(null);
      setStep(STEP.PICK_GROUP);
    } else if (step === STEP.PICK_GROUP) {
      setStep(STEP.OVERVIEW);
    } else {
      router.back();
    }
  }

  function jumpTo(target: AddWorkoutStep) {
    if (target === STEP.OVERVIEW || target === STEP.PICK_GROUP) {
      setSelectedExercise(null);
      setSelectedGroup(null);
    } else if (target === STEP.PICK_EXERCISE) {
      setSelectedExercise(null);
    }
    setStep(target);
  }

  const groupName =
    selectedGroup?.name ||
    (selectedExercise &&
      muscleGroupLookup[exerciseLookup[selectedExercise.id]?.muscleGroupId || '']?.name) ||
    null;
  const exerciseName = selectedExercise?.name || null;

  return (
    <Screen scroll>
      <PageToolbar
        left={<Button title="← Back" variant="ghost" size="sm" onPress={handleBack} />}
        right={
          <View style={styles.savePill}>
            {persisting ? (
              <>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.saveText}>Saving…</Text>
              </>
            ) : (
              <Text style={styles.saveText}>{formatPretty(today)} · auto-saving</Text>
            )}
          </View>
        }
      />

      {step !== STEP.OVERVIEW ? (
        <WorkoutBreadcrumb
          step={step}
          groupName={groupName}
          exerciseName={exerciseName}
          onJump={jumpTo}
        />
      ) : null}

      {step === STEP.OVERVIEW ? (
        <>
          <Text style={styles.title}>
            {existing ? "Edit today's workout" : "Log today's workout"}
          </Text>
          <Text style={styles.subtitle}>
            {entries.length === 0
              ? 'No exercises yet — each one saves instantly.'
              : `${entries.length} exercises · ${totalSets} sets · saved automatically`}
          </Text>
          <EntryList entries={entries} onRemove={handleRemoveEntry} />
          <View style={styles.actions}>
            <Button title="+ Add exercise" size="lg" onPress={() => setStep(STEP.PICK_GROUP)} />
            <Button
              title="Done"
              variant="ghost"
              size="lg"
              disabled={entries.length === 0}
              onPress={() => router.push(`/day/${today}`)}
            />
          </View>
        </>
      ) : null}

      {step === STEP.PICK_GROUP ? (
        <>
          <Text style={styles.title}>Pick a muscle group</Text>
          <MuscleGroupPicker onPick={handlePickGroup} />
        </>
      ) : null}

      {step === STEP.PICK_EXERCISE && selectedGroup ? (
        <>
          <View style={styles.stepHead}>
            <Text style={styles.title}>{selectedGroup.name} exercises</Text>
            <Button title="Done" variant="ghost" size="sm" onPress={() => jumpTo(STEP.OVERVIEW)} />
          </View>
          <ExercisePicker muscleGroupId={selectedGroup.id} onPick={handlePickExercise} />
        </>
      ) : null}

      {step === STEP.LOG_SETS && selectedExercise ? (
        <>
          <Text style={styles.title}>{selectedExercise.name}</Text>
          <SetLogger
            exercise={selectedExercise}
            onAdd={handleAddEntry}
            onCancel={handleBack}
          />
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  savePill: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  saveText: { ...typography.caption },
  title: { ...typography.heading, marginBottom: spacing.sm },
  subtitle: { ...typography.bodyMuted, marginBottom: spacing.lg },
  actions: { gap: spacing.sm, marginTop: spacing.lg },
  stepHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
});
