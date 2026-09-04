import { useCallback, useEffect, useState } from 'react';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { PageToolbar } from '@/components/PageToolbar';
import { RankedList, StatGrid } from '@/components/ProfileStatsBlocks';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { formatPretty } from '@/utils/dates';
import { showError } from '@/utils/feedback';
import type { PublicProfile } from '@/types';
import { Avatar, Button, Card, EmptyState, LoadingState, Screen } from '@/components/ui';
import { colors, radius, spacing, typography } from '@/theme';

export default function PublicUserScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const usernameKey = username || '';
  const router = useRouter();
  const { user: me } = useAuth();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!usernameKey) return;
    try {
      setProfile(await api.getPublicUser(usernameKey));
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to load profile');
      setProfile(null);
    }
  }, [usernameKey]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    load().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const isSelf = Boolean(me && profile && me.id === profile.id);

  return (
    <Screen scroll refreshing={refreshing} onRefresh={onRefresh}>
      <PageToolbar
        left={
          <Button title="← Back" variant="ghost" size="sm" onPress={() => router.back()} />
        }
        right={
          isSelf ? (
            <Link href="/(tabs)/profile" asChild>
              <Button title="My profile" size="sm" />
            </Link>
          ) : undefined
        }
      />

      {loading && !profile ? (
        <LoadingState message="Loading profile…" />
      ) : !profile ? (
        <EmptyState
          title="Profile not found"
          message={`Could not load @${usernameKey}.`}
        />
      ) : (
        <>
          <Card accent style={styles.headerCard}>
            <View style={styles.headerRow}>
              <Avatar user={profile} size={88} />
              <View style={styles.identity}>
                <Text style={styles.name}>{profile.name}</Text>
                <Text style={styles.username}>@{profile.username}</Text>
                <Text style={styles.joined}>
                  Joined {formatPretty(profile.createdAt?.slice(0, 10))}
                </Text>
              </View>
            </View>
            <View style={styles.rankPill}>
              <Text style={styles.rankLabel}>Rank</Text>
              <Text style={styles.rankValue}>
                #{profile.rank ?? '—'}
                <Text style={styles.rankTotal}> / {profile.totalUsers}</Text>
              </Text>
              <Text style={styles.rankPoints}>{profile.points} pts</Text>
            </View>
          </Card>

          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Workout stats</Text>
            <StatGrid
              items={[
                { label: 'Total workouts', value: profile.stats.totalWorkouts },
                { label: 'Total sets', value: profile.stats.totalSets },
                { label: 'Total reps', value: profile.stats.totalReps },
                {
                  label: 'Volume (reps×kg)',
                  value: Math.round(profile.stats.totalVolume).toLocaleString(),
                },
                {
                  label: 'Current streak',
                  value: `${profile.stats.currentStreakDays} day${profile.stats.currentStreakDays === 1 ? '' : 's'}`,
                },
                {
                  label: 'Last session',
                  value: profile.stats.lastWorkout
                    ? formatPretty(profile.stats.lastWorkout)
                    : '—',
                },
              ]}
            />

            <RankedList
              title="Most-logged exercises"
              rows={profile.stats.topExercises.map((e) => ({
                key: e.exerciseId,
                label: e.name,
                value: `${e.count}×`,
              }))}
            />

            {profile.stats.topGroups.length > 0 ? (
              <RankedList
                title="Muscle group focus"
                rows={profile.stats.topGroups.map((g) => ({
                  key: g.muscleGroupId,
                  label: g.name,
                  value: `${g.count} entries`,
                }))}
              />
            ) : null}
          </Card>

          {profile.recentWorkouts.length > 0 ? (
            <Card style={styles.section}>
              <Text style={styles.sectionTitle}>Recent sessions</Text>
              <View style={styles.recentList}>
                {profile.recentWorkouts.map((w) => (
                  <View key={w.id} style={styles.recentRow}>
                    <Text style={styles.recentDate}>{formatPretty(w.date)}</Text>
                    <Text style={styles.recentMeta}>
                      {w.exerciseCount} exercise{w.exerciseCount === 1 ? '' : 's'} ·{' '}
                      {w.setCount} sets
                    </Text>
                  </View>
                ))}
              </View>
            </Card>
          ) : null}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerCard: { gap: spacing.lg, marginBottom: spacing.lg },
  headerRow: { flexDirection: 'row', gap: spacing.lg, alignItems: 'center' },
  identity: { flex: 1, gap: 4 },
  name: { ...typography.title, fontSize: 22 },
  username: { ...typography.bodyMuted },
  joined: { ...typography.caption },
  rankPill: {
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rankLabel: { ...typography.label },
  rankValue: { ...typography.heading, color: colors.primaryHover },
  rankTotal: { ...typography.caption, color: colors.textMuted },
  rankPoints: { ...typography.subheading },
  section: { gap: spacing.md, marginBottom: spacing.lg },
  sectionTitle: { ...typography.subheading },
  recentList: { gap: spacing.sm },
  recentRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  recentDate: { ...typography.subheading, fontSize: 14 },
  recentMeta: { ...typography.caption, marginTop: 2 },
});
