import { StyleSheet, Text, View } from 'react-native';
import { useWorkouts } from '@/context/WorkoutContext';
import {
  formatDuration,
  isCardioGroup,
  isTimeBasedExercise,
} from '@/utils/exerciseKind';
import type { WorkoutEntry, WorkoutSet } from '@/types';
import { Card, Chip, IconButton } from '@/components/ui';
import { colors, radius, spacing, typography } from '@/theme';

interface EntryListProps {
  entries: WorkoutEntry[];
  onRemove?: (idx: number) => void;
}

function describeStrengthSet(set: WorkoutSet): string {
  const segs = [formatSegment(set.reps, set.weight)];
  (set.drops || []).forEach((d) => segs.push(formatSegment(d.reps, d.weight)));
  return segs.join(' → ');
}

function formatSegment(reps: number, weight: number | null): string {
  const r = Number(reps) || 0;
  if (weight === null || weight === undefined || (weight as unknown as string) === '') {
    return String(r);
  }
  return `${r}×${weight}`;
}

export function EntryList({ entries, onRemove }: EntryListProps) {
  const { exerciseLookup, muscleGroupLookup } = useWorkouts();

  if (!entries || entries.length === 0) {
    return (
      <Card>
        <Text style={styles.empty}>Tap "Add exercise" to start logging.</Text>
      </Card>
    );
  }

  return (
    <View style={styles.list}>
      {entries.map((entry, idx) => {
        const exercise = exerciseLookup[entry.exerciseId];
        const group = exercise && muscleGroupLookup[exercise.muscleGroupId];
        const timeBased = isTimeBasedExercise(exercise, muscleGroupLookup);
        const pillTone = timeBased
          ? isCardioGroup(group)
            ? 'cardio'
            : 'time'
          : 'strength';

        return (
          <Card key={entry.id || idx} style={styles.entry}>
            <View style={styles.entryHead}>
              <Text style={styles.entryTitle}>{exercise?.name || entry.exerciseId}</Text>
              <View style={styles.entryActions}>
                {group ? <Chip label={group.name} /> : null}
                {onRemove ? (
                  <IconButton label="×" onPress={() => onRemove(idx)} />
                ) : null}
              </View>
            </View>
            <View style={styles.pills}>
              {entry.sets.map((s, i) => {
                const hasDrops = !timeBased && Array.isArray(s.drops) && s.drops.length > 0;
                return (
                  <View
                    key={s.id || i}
                    style={[
                      styles.pill,
                      pillTone === 'cardio' && styles.pillCardio,
                      pillTone === 'time' && styles.pillTime,
                      s.isFailure && styles.pillFailure,
                    ]}
                  >
                    <Text style={styles.pillText}>
                      {timeBased ? formatDuration(s.reps) : describeStrengthSet(s)}
                    </Text>
                    {s.isFailure ? <Text style={styles.badge}>F</Text> : null}
                    {hasDrops ? (
                      <Text style={styles.badgeDrop}>D{s.drops.length}</Text>
                    ) : null}
                  </View>
                );
              })}
            </View>
            {entry.notes ? <Text style={styles.notes}>{entry.notes}</Text> : null}
          </Card>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md },
  empty: { ...typography.bodyMuted, textAlign: 'center' },
  entry: { gap: spacing.sm },
  entryHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  entryTitle: { ...typography.subheading, flex: 1 },
  entryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  pill: {
    backgroundColor: colors.surface3,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
    maxWidth: '100%',
  },
  pillCardio: {
    borderColor: 'rgba(59,130,246,0.35)',
    backgroundColor: 'rgba(59,130,246,0.1)',
  },
  pillTime: {
    borderColor: colors.borderStrong,
  },
  pillFailure: {
    borderColor: colors.primaryEdge,
  },
  pillText: { ...typography.body, fontSize: 14, fontWeight: '600' },
  badge: {
    color: colors.primaryHover,
    fontWeight: '800',
    fontSize: 11,
  },
  badgeDrop: {
    color: colors.warning,
    fontWeight: '800',
    fontSize: 11,
  },
  notes: {
    ...typography.bodyMuted,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
});
