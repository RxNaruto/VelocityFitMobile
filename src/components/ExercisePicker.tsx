import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { useWorkouts } from '@/context/WorkoutContext';
import { showError } from '@/utils/feedback';
import type { Exercise } from '@/types';
import { Button, LoadingState, SearchBar } from '@/components/ui';
import { colors, radius, spacing, typography } from '@/theme';

interface ExercisePickerProps {
  muscleGroupId: string;
  onPick: (exercise: Exercise) => void;
}

export function ExercisePicker({ muscleGroupId, onPick }: ExercisePickerProps) {
  const { getExercises, muscleGroupLookup } = useWorkouts();
  const [exercises, setExercises] = useState<Exercise[] | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    setExercises(null);
    setQuery('');
    getExercises(muscleGroupId)
      .then((list) => {
        if (!cancelled) setExercises(list);
      })
      .catch((err: Error) => {
        if (!cancelled) showError(err.message || 'Failed to load exercises');
      });
    return () => {
      cancelled = true;
    };
  }, [muscleGroupId, getExercises]);

  const filtered = useMemo(() => {
    if (!exercises) return [];
    const q = query.trim().toLowerCase();
    if (!q) return exercises;
    return exercises.filter((ex) => ex.name.toLowerCase().includes(q));
  }, [exercises, query]);

  if (!exercises) return <LoadingState message="Loading exercises…" />;

  const groupName = muscleGroupLookup[muscleGroupId]?.name || 'this group';

  if (exercises.length === 0) {
    return <ManageCatalogHint groupName={groupName} />;
  }

  return (
    <View style={styles.wrap}>
      <SearchBar
        placeholder={`Search ${exercises.length} exercise${exercises.length === 1 ? '' : 's'}…`}
        value={query}
        onChangeText={setQuery}
        autoFocus
      />

      {filtered.length === 0 ? (
        <ManageCatalogHint groupName={groupName} query={query.trim()} />
      ) : (
        <View style={styles.list}>
          {filtered.map((ex) => (
            <Pressable
              key={ex.id}
              onPress={() => onPick(ex)}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            >
              <Text style={styles.name}>{ex.name}</Text>
              <Text style={styles.chev}>›</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

function ManageCatalogHint({ groupName, query }: { groupName: string; query?: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>
        {query
          ? `No exercises match "${query}".`
          : `No exercises in ${groupName} yet.`}
      </Text>
      <Text style={styles.hint}>Can't find an exercise? Add new ones from Manage exercises.</Text>
      <Link href="/exercises" asChild>
        <Button title="Manage exercises" variant="ghost" size="sm" />
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  list: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  pressed: { backgroundColor: colors.surface2 },
  name: { ...typography.body, flex: 1 },
  chev: { color: colors.textFaint, fontSize: 20 },
  empty: { gap: spacing.md, paddingVertical: spacing.lg, alignItems: 'center' },
  emptyText: { ...typography.bodyMuted, textAlign: 'center' },
  hint: { ...typography.caption, textAlign: 'center' },
});
