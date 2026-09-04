import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { PeriodTabs, type StatsPeriod } from '@/components/PeriodTabs';
import { RankedList, StatGrid } from '@/components/ProfileStatsBlocks';
import { useAuth } from '@/context/AuthContext';
import { useWorkouts } from '@/context/WorkoutContext';
import { api } from '@/services/api';
import { formatPretty } from '@/utils/dates';
import { showError, showSuccess } from '@/utils/feedback';
import { buildPRList, formatPRValue } from '@/utils/profilePr';
import type { ProfileStats, RankInfo } from '@/types';
import {
  Avatar,
  Button,
  Card,
  Chip,
  Input,
  LoadingState,
  Screen,
  SearchBar,
} from '@/components/ui';
import { colors, radius, spacing, typography } from '@/theme';

interface ProfileForm {
  name: string;
  profilePhotoUrl: string;
}

export default function ProfileScreen() {
  const { user, updateUser, signOut } = useAuth();
  const { workoutsByDate, exerciseLookup, muscleGroupLookup } = useWorkouts();

  const [period, setPeriod] = useState<StatsPeriod>('week');
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [rank, setRank] = useState<RankInfo | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ProfileForm>({
    name: user?.name || '',
    profilePhotoUrl: user?.profilePhotoUrl || '',
  });
  const [saving, setSaving] = useState(false);

  const [showPRs, setShowPRs] = useState(false);
  const [prQuery, setPrQuery] = useState('');

  const prRecords = useMemo(() => {
    if (!showPRs) return [];
    return buildPRList(workoutsByDate, exerciseLookup, muscleGroupLookup);
  }, [showPRs, workoutsByDate, exerciseLookup, muscleGroupLookup]);

  const visiblePRRecords = useMemo(() => {
    const q = prQuery.trim().toLowerCase();
    if (!q) return prRecords;
    return prRecords.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        (item.muscleGroupName?.toLowerCase().includes(q) ?? false)
    );
  }, [prRecords, prQuery]);

  const loadRank = useCallback(async () => {
    try {
      setRank(await api.getMyRank());
    } catch {
      /* silent */
    }
  }, []);

  const loadStats = useCallback(async (p: StatsPeriod) => {
    setStatsLoading(true);
    try {
      setStats(await api.getStats(p));
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRank();
  }, [loadRank]);

  useEffect(() => {
    loadStats(period);
  }, [period, loadStats]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadRank(), loadStats(period)]);
    setRefreshing(false);
  }, [loadRank, loadStats, period]);

  function startEdit() {
    setForm({
      name: user?.name || '',
      profilePhotoUrl: user?.profilePhotoUrl || '',
    });
    setEditing(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await api.updateProfile({
        name: form.name.trim(),
        profilePhotoUrl: form.profilePhotoUrl.trim(),
      });
      updateUser(updated);
      showSuccess('Profile updated');
      setEditing(false);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  }

  if (!user) return null;

  const periodLabel =
    period === 'week' ? 'This week' : period === 'month' ? 'This month' : 'All time';

  return (
    <Screen scroll refreshing={refreshing} onRefresh={onRefresh}>
      <View style={styles.toolbar}>
        <Button
          title={showPRs ? 'Hide PR records' : 'Check PR records'}
          variant={showPRs ? 'primary' : 'ghost'}
          size="sm"
          onPress={() => {
            setShowPRs((s) => {
              if (s) setPrQuery('');
              return !s;
            });
          }}
        />
        {!editing ? (
          <Button title="Edit profile" size="sm" onPress={startEdit} />
        ) : null}
      </View>

      <Card accent style={styles.headerCard}>
        <View style={styles.headerRow}>
          <Avatar user={user} size={88} />
          <View style={styles.identity}>
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.username}>@{user.username}</Text>
            <Text style={styles.joined}>
              Joined {formatPretty(user.createdAt?.slice(0, 10))}
            </Text>
          </View>
        </View>
        {rank ? (
          <View style={styles.rankPill}>
            <Text style={styles.rankLabel}>Rank</Text>
            <Text style={styles.rankValue}>
              #{rank.rank ?? '—'}
              <Text style={styles.rankTotal}> / {rank.totalUsers}</Text>
            </Text>
            <Text style={styles.rankPoints}>{rank.points} pts</Text>
            <Link href="/(tabs)/leaderboard" asChild>
              <Button title="View leaderboard →" variant="ghost" size="sm" />
            </Link>
          </View>
        ) : null}
      </Card>

      {editing ? (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Edit profile</Text>
          <Input
            label="Display name"
            value={form.name}
            onChangeText={(name) => setForm((p) => ({ ...p, name }))}
            maxLength={60}
          />
          <Input
            label="Profile photo URL (optional)"
            value={form.profilePhotoUrl}
            onChangeText={(profilePhotoUrl) => setForm((p) => ({ ...p, profilePhotoUrl }))}
            placeholder="https://..."
            autoCapitalize="none"
            keyboardType="url"
          />
          <Text style={styles.hint}>
            Leave empty to use the auto-generated initials avatar.
          </Text>
          {form.profilePhotoUrl ? (
            <View style={styles.preview}>
              <Avatar
                user={{ ...user, name: form.name }}
                photoUrl={form.profilePhotoUrl}
                size={56}
              />
              <Text style={styles.hint}>Preview</Text>
            </View>
          ) : null}
          <View style={styles.editActions}>
            <Button title="Cancel" variant="ghost" onPress={() => setEditing(false)} />
            <Button title={saving ? 'Saving…' : 'Save changes'} onPress={handleSave} disabled={saving} />
          </View>
        </Card>
      ) : null}

      {showPRs ? (
        <Card style={styles.section}>
          <View style={styles.prHead}>
            <View>
              <Text style={styles.sectionTitle}>Your PR records</Text>
              <Text style={styles.hint}>Every exercise logged, with its all-time best.</Text>
            </View>
            <Text style={styles.hint}>
              {prQuery.trim()
                ? `${visiblePRRecords.length} of ${prRecords.length}`
                : `${prRecords.length} exercise${prRecords.length === 1 ? '' : 's'}`}
            </Text>
          </View>
          {prRecords.length > 0 ? (
            <SearchBar
              placeholder="Search exercise or muscle group…"
              value={prQuery}
              onChangeText={setPrQuery}
            />
          ) : null}
          {prRecords.length === 0 ? (
            <Text style={styles.muted}>No PRs yet — log a workout first.</Text>
          ) : visiblePRRecords.length === 0 ? (
            <Text style={styles.muted}>No exercises match "{prQuery.trim()}".</Text>
          ) : (
            <View style={styles.prList}>
              {visiblePRRecords.map((item) => (
                <View key={item.exerciseId} style={styles.prRow}>
                  <View style={styles.prNameCol}>
                    <Text style={styles.prExercise}>{item.name}</Text>
                    <View style={styles.prChips}>
                      {item.muscleGroupName ? <Chip label={item.muscleGroupName} /> : null}
                      {item.timeBased ? <Chip label="Time" variant="time" /> : null}
                    </View>
                  </View>
                  <View style={styles.prValueCol}>
                    {item.pr ? (
                      <>
                        <Text style={styles.prValue}>{formatPRValue(item.pr)}</Text>
                        <Text style={styles.hint}>{formatPretty(item.pr.date)}</Text>
                      </>
                    ) : (
                      <Text style={styles.hint}>
                        {item.timeBased ? 'No timed sets yet' : 'No weighted PR yet'}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </Card>
      ) : null}

      {stats?.favoriteExercise ? (
        <Card accent style={styles.section}>
          <Text style={styles.favLabel}>Favorite exercise</Text>
          <Text style={styles.favName}>{stats.favoriteExercise.name}</Text>
          {stats.favoriteExercise.muscleGroupName ? (
            <Chip label={stats.favoriteExercise.muscleGroupName} />
          ) : null}
          <View style={styles.favStats}>
            <View style={styles.favStat}>
              <Text style={styles.favStatValue}>{stats.favoriteExercise.totalSets}</Text>
              <Text style={styles.favStatLabel}>sets</Text>
            </View>
            <View style={styles.favStat}>
              <Text style={styles.favStatValue}>{stats.favoriteExercise.totalReps}</Text>
              <Text style={styles.favStatLabel}>reps</Text>
            </View>
            <View style={styles.favStat}>
              <Text style={styles.favStatValue}>{stats.favoriteExercise.sessions}</Text>
              <Text style={styles.favStatLabel}>sessions</Text>
            </View>
          </View>
          <Text style={styles.hint}>Most sets & reps logged, all time.</Text>
        </Card>
      ) : null}

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Workout stats</Text>
        <PeriodTabs value={period} onChange={setPeriod} />

        {statsLoading ? (
          <LoadingState message={`Loading ${periodLabel.toLowerCase()}…`} />
        ) : stats ? (
          <>
            <StatGrid
              items={[
                { label: `Workouts (${periodLabel})`, value: stats.totalWorkouts },
                { label: 'Total sets', value: stats.totalSets },
                { label: 'Total reps', value: stats.totalReps },
                {
                  label: 'Volume (reps×kg)',
                  value: Math.round(stats.totalVolume).toLocaleString(),
                },
                { label: 'Failure sets', value: stats.failureSets || 0 },
                {
                  label: 'Current streak',
                  value: `${stats.currentStreakDays} day${stats.currentStreakDays === 1 ? '' : 's'}`,
                },
                {
                  label: 'Last session',
                  value: stats.lastWorkout ? formatPretty(stats.lastWorkout) : '—',
                },
              ]}
            />

            {period === 'week' ? (
              <View style={styles.subSection}>
                <Text style={styles.subTitle}>Muscles hit this week</Text>
                <Text style={styles.hint}>
                  Week starting {stats.weekStartDate ? formatPretty(stats.weekStartDate) : '—'}.
                </Text>
                {stats.weeklyMuscleGroups.length === 0 ? (
                  <Text style={styles.muted}>No muscle groups trained yet this week.</Text>
                ) : (
                  <View style={styles.muscleRow}>
                    {stats.weeklyMuscleGroups.map((g) => (
                      <View key={g.muscleGroupId} style={styles.muscleChip}>
                        <Text style={styles.muscleName}>{g.name}</Text>
                        <Text style={styles.muscleCount}>{g.count}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ) : null}

            <RankedList
              title={`Most-logged exercises (${periodLabel})`}
              rows={stats.topExercises.map((e) => ({
                key: e.exerciseId,
                label: e.name,
                value: `${e.count}×`,
              }))}
            />

            <RankedList
              title={`Muscle group focus (${periodLabel})`}
              rows={stats.topGroups.map((g) => ({
                key: g.muscleGroupId,
                label: g.name,
                value: `${g.count} entries`,
              }))}
            />

            {stats.totalWorkouts === 0 ? (
              <Text style={styles.muted}>
                {period === 'all'
                  ? 'No workouts yet — log your first session!'
                  : `No workouts in the selected ${period}. Try "All time".`}
              </Text>
            ) : null}
          </>
        ) : null}
      </Card>

      <Button title="Sign out" variant="ghost" onPress={() => signOut()} fullWidth />
    </Screen>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    justifyContent: 'flex-end',
  },
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
  subSection: { marginTop: spacing.lg, gap: spacing.sm },
  subTitle: { ...typography.subheading, fontSize: 15 },
  hint: { ...typography.caption },
  muted: { ...typography.bodyMuted },
  preview: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  prHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  prList: { gap: spacing.md, marginTop: spacing.sm },
  prRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  prNameCol: { flex: 1, gap: spacing.xs },
  prExercise: { ...typography.subheading, fontSize: 14 },
  prChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  prValueCol: { alignItems: 'flex-end', maxWidth: '45%' },
  prValue: { ...typography.body, fontWeight: '700', color: colors.primaryHover, textAlign: 'right' },
  favLabel: { ...typography.label },
  favName: { ...typography.heading, fontSize: 20 },
  favStats: { flexDirection: 'row', gap: spacing.lg },
  favStat: { alignItems: 'center' },
  favStatValue: { ...typography.heading, color: colors.primaryHover },
  favStatLabel: { ...typography.caption },
  muscleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  muscleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface2,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  muscleName: { ...typography.body, fontSize: 13 },
  muscleCount: { ...typography.caption, fontWeight: '800', color: colors.primaryHover },
});
