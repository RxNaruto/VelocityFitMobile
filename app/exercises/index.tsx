import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { PageToolbar } from '@/components/PageToolbar';
import { useWorkouts } from '@/context/WorkoutContext';
import { confirm, showError, showSuccess } from '@/utils/feedback';
import type { Exercise, MuscleGroup } from '@/types';
import {
  Button,
  Card,
  Chip,
  LoadingState,
  Screen,
  SearchBar,
} from '@/components/ui';
import { colors, radius, spacing, typography } from '@/theme';

export default function ManageExercisesScreen() {
  const router = useRouter();
  const {
    muscleGroups,
    exercisesByGroup,
    getExercises,
    createExercise,
    createMuscleGroup,
    deleteExercise,
  } = useWorkouts();

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [muscleGroupId, setMuscleGroupId] = useState('');
  const [tracksTime, setTracksTime] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupSubmitting, setNewGroupSubmitting] = useState(false);
  const [query, setQuery] = useState('');
  const [groupPickerOpen, setGroupPickerOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await Promise.all(muscleGroups.map((g) => getExercises(g.id)));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [muscleGroups, getExercises]);

  useEffect(() => {
    if (!muscleGroupId && muscleGroups[0]) setMuscleGroupId(muscleGroups[0].id);
  }, [muscleGroups, muscleGroupId]);

  const totalExercises = useMemo(
    () => Object.values(exercisesByGroup).reduce((sum, list) => sum + list.length, 0),
    [exercisesByGroup]
  );

  const filteredGroupsView = useMemo(() => {
    const q = query.trim().toLowerCase();
    return muscleGroups
      .map((group) => {
        const all = exercisesByGroup[group.id] || [];
        const list = q ? all.filter((ex) => ex.name.toLowerCase().includes(q)) : all;
        return { group, list, hiddenByFilter: q !== '' && list.length === 0 };
      })
      .filter((row) => (q ? !row.hiddenByFilter : true));
  }, [muscleGroups, exercisesByGroup, query]);

  const matchCount = useMemo(
    () => filteredGroupsView.reduce((sum, r) => sum + r.list.length, 0),
    [filteredGroupsView]
  );

  const selectedGroup = muscleGroups.find((g) => g.id === muscleGroupId);

  async function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) {
      showError('Give the exercise a name.');
      return;
    }
    if (!muscleGroupId) {
      showError('Pick a muscle group.');
      return;
    }
    setSubmitting(true);
    try {
      const created = await createExercise({
        name: trimmed,
        muscleGroupId,
        tracksTime,
      });
      showSuccess(`Added "${created.name}"`);
      setName('');
      setTracksTime(false);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to add exercise');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateGroup() {
    const trimmed = newGroupName.trim();
    if (!trimmed) {
      showError('Give the muscle group a name.');
      return;
    }
    setNewGroupSubmitting(true);
    try {
      const created = await createMuscleGroup({ name: trimmed });
      showSuccess(`Added muscle group "${created.name}"`);
      setNewGroupName('');
      setShowNewGroup(false);
      setMuscleGroupId(created.id);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to add muscle group');
    } finally {
      setNewGroupSubmitting(false);
    }
  }

  function handleDelete(exercise: Exercise) {
    confirm(
      'Delete exercise',
      `Delete "${exercise.name}"? Only works if unused in workouts.`,
      async () => {
        try {
          await deleteExercise(exercise.id);
          showSuccess(`Deleted "${exercise.name}"`);
        } catch (err) {
          showError(err instanceof Error ? err.message : 'Failed to delete exercise');
        }
      }
    );
  }

  return (
    <Screen scroll padded={false}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <PageToolbar
          left={<Button title="← Back" variant="ghost" size="sm" onPress={() => router.back()} />}
          subtitle={`${muscleGroups.length} groups · ${totalExercises} exercises`}
        />

        <Text style={styles.title}>Manage exercises</Text>
        <Text style={styles.subtitle}>
          Add missing exercises to the catalog. Available immediately for all users.
        </Text>

        <Card style={styles.form}>
          <Text style={styles.formTitle}>Add a new exercise</Text>

          <Text style={styles.label}>Exercise name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Cable Crossover"
            placeholderTextColor={colors.textFaint}
            maxLength={80}
          />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Muscle group</Text>
              <Button
                title={selectedGroup?.name || 'Select group'}
                variant="secondary"
                size="sm"
                onPress={() => setGroupPickerOpen((v) => !v)}
                fullWidth
              />
              {groupPickerOpen ? (
                <View style={styles.pickerList}>
                  {muscleGroups.map((g) => (
                    <Button
                      key={g.id}
                      title={g.name}
                      variant={g.id === muscleGroupId ? 'primary' : 'ghost'}
                      size="sm"
                      onPress={() => {
                        setMuscleGroupId(g.id);
                        setGroupPickerOpen(false);
                      }}
                      fullWidth
                    />
                  ))}
                </View>
              ) : null}
            </View>
            <Button
              title={showNewGroup ? 'Cancel' : '+ Group'}
              variant="ghost"
              size="sm"
              onPress={() => setShowNewGroup((s) => !s)}
            />
          </View>

          {showNewGroup ? (
            <View style={styles.subform}>
              <TextInput
                style={styles.input}
                value={newGroupName}
                onChangeText={setNewGroupName}
                placeholder="New muscle group name"
                placeholderTextColor={colors.textFaint}
              />
              <Button
                title={newGroupSubmitting ? 'Saving…' : 'Add group'}
                onPress={handleCreateGroup}
                disabled={newGroupSubmitting}
              />
            </View>
          ) : null}

          <View style={styles.switchRow}>
            <Switch
              value={tracksTime}
              onValueChange={setTracksTime}
              trackColor={{ true: colors.primary, false: colors.border }}
            />
            <Text style={styles.switchLabel}>
              Time-based (minutes & seconds instead of reps × weight)
            </Text>
          </View>

          <Button
            title={submitting ? 'Adding…' : '+ Add exercise'}
            size="lg"
            onPress={handleCreate}
            disabled={submitting}
            fullWidth
          />
        </Card>

        <Text style={styles.listTitle}>Existing exercises</Text>

        {!loading && muscleGroups.length > 0 ? (
          <SearchBar
            placeholder={`Search ${totalExercises} exercises…`}
            value={query}
            onChangeText={setQuery}
          />
        ) : null}

        {query && !loading ? (
          <Text style={styles.matchHint}>
            {matchCount === 0
              ? `No exercises match "${query}".`
              : `${matchCount} match${matchCount === 1 ? '' : 'es'}.`}
          </Text>
        ) : null}

        {loading ? (
          <LoadingState message="Loading exercises…" />
        ) : (
          filteredGroupsView.map(({ group, list }) => (
            <AdminGroupBlock key={group.id} group={group} exercises={list} onDelete={handleDelete} />
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

function AdminGroupBlock({
  group,
  exercises,
  onDelete,
}: {
  group: MuscleGroup;
  exercises: Exercise[];
  onDelete: (ex: Exercise) => void;
}) {
  return (
    <Card style={styles.groupBlock}>
      <View style={styles.groupHead}>
        <Text style={styles.groupTitle}>{group.name}</Text>
        <Text style={styles.groupCount}>
          {exercises.length} exercise{exercises.length === 1 ? '' : 's'}
        </Text>
      </View>
      {exercises.length === 0 ? (
        <Text style={styles.emptyGroup}>No exercises in this group.</Text>
      ) : (
        exercises.map((ex) => (
          <View key={ex.id} style={styles.exRow}>
            <View style={styles.exNameWrap}>
              <Text style={styles.exName}>{ex.name}</Text>
              {ex.tracksTime ? <Chip label="Time" variant="time" /> : null}
            </View>
            <Button title="Delete" variant="ghost" size="sm" onPress={() => onDelete(ex)} />
          </View>
        ))
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.md },
  title: { ...typography.heading },
  subtitle: { ...typography.bodyMuted, marginBottom: spacing.sm },
  form: { gap: spacing.md },
  formTitle: { ...typography.subheading },
  label: { ...typography.label },
  input: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.md,
    color: colors.text,
    fontSize: 15,
  },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  pickerList: { gap: spacing.xs, marginTop: spacing.sm },
  subform: { gap: spacing.sm },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  switchLabel: { ...typography.bodyMuted, flex: 1, fontSize: 14 },
  listTitle: { ...typography.subheading, marginTop: spacing.lg },
  matchHint: { ...typography.caption },
  groupBlock: { gap: spacing.sm, marginTop: spacing.sm },
  groupHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupTitle: { ...typography.subheading, fontSize: 15 },
  groupCount: { ...typography.caption },
  emptyGroup: { ...typography.caption },
  exRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  exNameWrap: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.xs },
  exName: { ...typography.body, fontSize: 14 },
});
