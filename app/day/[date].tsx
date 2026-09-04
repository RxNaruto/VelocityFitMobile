import { Fragment } from 'react';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useWorkouts } from '@/context/WorkoutContext';
import { formatPretty, isToday } from '@/utils/dates';
import { formatDuration, isTimeBasedExercise } from '@/utils/exerciseKind';
import { PageToolbar } from '@/components/PageToolbar';
import { Button, Card, Chip, LoadingState, Screen } from '@/components/ui';
import { colors, spacing, typography } from '@/theme';

export default function WorkoutDayScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const dateKey = date || '';
  const router = useRouter();
  const {
    workoutsByDate,
    exerciseLookup,
    muscleGroupLookup,
    exercisesReady,
  } = useWorkouts();

  const workout = workoutsByDate[dateKey] || null;
  const editable = isToday(dateKey);

  return (
    <Screen scroll>
      <PageToolbar
        left={<Button title="← Back" variant="ghost" size="sm" onPress={() => router.back()} />}
        right={
          editable ? (
            <Link href="/add" asChild>
              <Button
                title={workout ? 'Edit' : '+ Add'}
                size="sm"
              />
            </Link>
          ) : undefined
        }
      />

      <Text style={styles.title}>{formatPretty(dateKey)}</Text>
      {!editable ? (
        <Text style={styles.muted}>
          Past sessions are read-only. You can only edit today's workout.
        </Text>
      ) : null}

      {!workout ? (
        <Card>
          <Text style={styles.muted}>No workout logged for this day.</Text>
        </Card>
      ) : !exercisesReady ? (
        <LoadingState message="Loading exercise names…" />
      ) : (
        <View style={styles.entries}>
          {workout.entries.map((entry) => {
            const exercise = exerciseLookup[entry.exerciseId];
            const group = exercise && muscleGroupLookup[exercise.muscleGroupId];
            const timeBased = isTimeBasedExercise(exercise, muscleGroupLookup);

            return (
              <Card key={entry.id} style={styles.entry}>
                <View style={styles.entryHead}>
                  <Text style={styles.entryTitle}>{exercise?.name || entry.exerciseId}</Text>
                  {group ? <Chip label={group.name} /> : null}
                </View>
                {entry.sets.map((s, i) => {
                  const drops = Array.isArray(s.drops) ? s.drops : [];
                  const hasDrops = !timeBased && drops.length > 0;
                  return (
                    <Fragment key={s.id}>
                      <View style={styles.setRow}>
                        <Text style={styles.setNum}>
                          Set {i + 1}
                          {s.isFailure ? ' · F' : ''}
                          {hasDrops ? ` · D${drops.length}` : ''}
                        </Text>
                        <Text style={styles.setVal}>
                          {timeBased
                            ? `${formatDuration(s.reps)} min`
                            : `${s.reps} × ${s.weight ?? '—'}`}
                        </Text>
                      </View>
                      {hasDrops
                        ? drops.map((d, j) => (
                            <View key={d.id} style={styles.dropRow}>
                              <Text style={styles.dropLabel}>› drop {j + 1}</Text>
                              <Text style={styles.setVal}>
                                {d.reps} × {d.weight ?? '—'}
                              </Text>
                            </View>
                          ))
                        : null}
                    </Fragment>
                  );
                })}
                {entry.notes ? <Text style={styles.notes}>{entry.notes}</Text> : null}
              </Card>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.title, marginBottom: spacing.sm },
  muted: { ...typography.bodyMuted, marginBottom: spacing.lg },
  entries: { gap: spacing.md },
  entry: { gap: spacing.sm },
  entryHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  entryTitle: { ...typography.subheading, flex: 1 },
  setRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  setNum: { ...typography.caption },
  setVal: { ...typography.body, fontWeight: '600' },
  dropRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: spacing.lg,
    paddingVertical: spacing.xs,
  },
  dropLabel: { ...typography.caption, color: colors.warning },
  notes: { ...typography.bodyMuted, fontStyle: 'italic', marginTop: spacing.sm },
});
