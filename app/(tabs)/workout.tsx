import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useWorkouts } from '@/context/WorkoutContext';
import { formatPretty, todayKey } from '@/utils/dates';
import { Button, Card, Screen, Stat } from '@/components/ui';
import { spacing, typography } from '@/theme';

export default function WorkoutHubScreen() {
  const { workoutsByDate, muscleGroups, exercisesByGroup } = useWorkouts();
  const today = todayKey();
  const todayWorkout = workoutsByDate[today];
  const exerciseCount = muscleGroups.reduce(
    (sum, g) => sum + (exercisesByGroup[g.id]?.length ?? 0),
    0
  );
  const recentDates = Object.keys(workoutsByDate)
    .filter((d) => d <= today)
    .sort()
    .reverse()
    .slice(0, 5);

  return (
    <Screen scroll>
      <Text style={styles.title}>Workout</Text>
      <Text style={styles.subtitle}>{formatPretty(today)}</Text>

      <View style={styles.stats}>
        <Stat label="Today" value={todayWorkout?.entries.length ?? 0} hint="exercises" />
        <Stat label="Catalog" value={exerciseCount} hint="exercises" />
        <Stat label="Logged days" value={Object.keys(workoutsByDate).length} />
      </View>

      <Card accent style={styles.section}>
        <Text style={styles.sectionTitle}>Today</Text>
        <View style={styles.links}>
          <Link href="/add" asChild>
            <Button
              title={todayWorkout ? "Edit today's workout" : "Log today's workout"}
              fullWidth
            />
          </Link>
          <Link href="/exercises" asChild>
            <Button title="Manage exercises" variant="ghost" fullWidth />
          </Link>
        </View>
      </Card>

      {recentDates.length > 0 ? (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Recent sessions</Text>
          <View style={styles.recent}>
            {recentDates.map((d) => {
              const w = workoutsByDate[d];
              const sets = w?.entries.reduce((s, e) => s + e.sets.length, 0) ?? 0;
              return (
                <Link key={d} href={`/day/${d}`} asChild>
                  <Button
                    title={`${d} — ${w?.entries.length ?? 0} ex · ${sets} sets`}
                    variant="ghost"
                    size="sm"
                    fullWidth
                  />
                </Link>
              );
            })}
          </View>
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.title, marginBottom: spacing.xs },
  subtitle: { ...typography.bodyMuted, marginBottom: spacing.xl },
  stats: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  section: { gap: spacing.md, marginBottom: spacing.lg },
  sectionTitle: { ...typography.subheading },
  links: { gap: spacing.sm },
  recent: { gap: spacing.xs },
});
