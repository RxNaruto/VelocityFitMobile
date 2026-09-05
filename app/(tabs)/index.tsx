import { useCallback, useEffect, useState } from 'react';
import { Link, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BrandMark } from '@/components/BrandMark';
import { Calendar } from '@/components/Calendar';
import { useAuth } from '@/context/AuthContext';
import { useWorkouts } from '@/context/WorkoutContext';
import { useExitConfirm } from '@/hooks/useExitConfirm';
import { api } from '@/services/api';
import { todayKey } from '@/utils/dates';
import type { LeaderboardRow, RankInfo } from '@/types';
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  LoadingState,
  Screen,
} from '@/components/ui';
import { colors, spacing, typography } from '@/theme';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { workoutsByDate } = useWorkouts();

  useExitConfirm();

  const today = todayKey();
  const todayWorkout = workoutsByDate[today];
  const joinedDateKey = user?.createdAt?.slice(0, 10) || null;

  const [rank, setRank] = useState<RankInfo | null>(null);
  const [topRows, setTopRows] = useState<LeaderboardRow[]>([]);
  const [boardLoading, setBoardLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = useCallback(async () => {
    const [r, lb] = await Promise.all([api.getMyRank(), api.getLeaderboard(5)]);
    setRank(r);
    setTopRows(lb.top);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setBoardLoading(true);
    loadDashboard()
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setBoardLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loadDashboard]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadDashboard();
    } catch {
      /* silent */
    } finally {
      setRefreshing(false);
    }
  }, [loadDashboard]);

  return (
    <Screen scroll padded={false} refreshing={refreshing} onRefresh={onRefresh}>
      <View style={styles.scroll}>
        <Card accent style={styles.brandCard}>
          <View style={styles.brandHead}>
            <BrandMark size="lg" />
            <View>
              <Text style={styles.brandTitle}>VELOCITY FIT</Text>
              <Text style={styles.brandTag}>TRAIN HARD. STAY CONSISTENT.</Text>
            </View>
          </View>
          <Text style={styles.status}>
            {todayWorkout
              ? `You've logged ${todayWorkout.entries.length} exercise${todayWorkout.entries.length === 1 ? '' : 's'} today. Keep going!`
              : "You haven't logged today's workout yet."}
          </Text>
          <View style={styles.ctaRow}>
            <Link href="/add" asChild>
              <Button
                title={todayWorkout ? "+ Edit today's workout" : "+ Log today's workout"}
                size="lg"
                fullWidth
              />
            </Link>
            <Link href="/exercises" asChild>
              <Button title="+ Add new exercise" variant="ghost" size="lg" fullWidth />
            </Link>
          </View>
        </Card>

        {user ? (
          <Card style={styles.profileCard}>
            <View style={styles.profileHead}>
              <Avatar user={user} size={64} />
              <View>
                <Text style={styles.profileName}>{user.name}</Text>
                <Text style={styles.profileUser}>@{user.username}</Text>
              </View>
            </View>
            <View style={styles.profileStats}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>#{rank?.rank ?? '—'}</Text>
                <Text style={styles.statLabel}>
                  Rank{rank?.totalUsers ? ` / ${rank.totalUsers}` : ''}
                </Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{rank?.points ?? user.points}</Text>
                <Text style={styles.statLabel}>Points</Text>
              </View>
            </View>
            <Link href="/(tabs)/profile" asChild>
              <Button title="View full profile →" variant="ghost" size="sm" />
            </Link>
          </Card>
        ) : null}

        <Card style={styles.calendarCard}>
          <Calendar
            workoutsByDate={workoutsByDate}
            onSelectDate={(key) => router.push(`/day/${key}`)}
            joinedDateKey={joinedDateKey}
          />
          <View style={styles.legend}>
            <LegendItem color={colors.primary} label="Logged" />
            <LegendItem color={colors.danger} label="Missed" />
            <Text style={styles.legendText}>◉ Today</Text>
          </View>
        </Card>

        <Card style={styles.boardCard}>
          <View style={styles.boardHead}>
            <Text style={styles.boardTitle}>Leaderboard</Text>
            <Link href="/(tabs)/leaderboard" asChild>
              <Button title="View all →" variant="ghost" size="sm" />
            </Link>
          </View>
          {boardLoading ? (
            <LoadingState message="Loading rankings…" />
          ) : topRows.length === 0 ? (
            <EmptyState
              title="No rankings yet"
              message="Log a workout to get on the board!"
            />
          ) : (
            <View style={styles.boardList}>
              {topRows.map((r) => (
                <Pressable
                  key={r.userId}
                  onPress={() => router.push(`/user/${r.username}`)}
                  style={({ pressed }) => [
                    styles.boardRow,
                    r.userId === user?.id && styles.boardRowMe,
                    pressed && styles.boardRowPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`View ${r.name} profile`}
                >
                  <Text style={styles.rankBadge}>#{r.rank}</Text>
                  <Avatar user={r} size={32} />
                  <View style={styles.boardIdent}>
                    <Text style={styles.boardName}>
                      {r.name}
                      {r.userId === user?.id ? ' (you)' : ''}
                    </Text>
                  </View>
                  <Text style={styles.points}>{r.points} pts</Text>
                </Pressable>
              ))}
            </View>
          )}
        </Card>
      </View>
    </Screen>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  brandCard: { gap: spacing.md },
  brandHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  brandTitle: { ...typography.brand, fontSize: 18 },
  brandTag: { ...typography.caption, letterSpacing: 1.2, marginTop: 4 },
  status: { ...typography.bodyMuted },
  ctaRow: { gap: spacing.sm },
  profileCard: { gap: spacing.md },
  profileHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  profileName: { ...typography.heading },
  profileUser: { ...typography.caption },
  profileStats: { flexDirection: 'row', gap: spacing.md },
  statBox: {
    flex: 1,
    backgroundColor: colors.surface2,
    borderRadius: 10,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: { ...typography.heading, color: colors.primaryHover },
  statLabel: { ...typography.caption, marginTop: 2 },
  calendarCard: { gap: spacing.md },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { ...typography.caption },
  boardCard: { gap: spacing.md },
  boardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  boardTitle: { ...typography.subheading },
  boardList: { gap: spacing.sm },
  boardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: 10,
  },
  boardRowMe: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryEdge,
  },
  boardRowPressed: { opacity: 0.88 },
  rankBadge: { ...typography.caption, width: 32, fontWeight: '800' },
  boardIdent: { flex: 1 },
  boardName: { ...typography.body, fontSize: 14 },
  points: { ...typography.caption, color: colors.primaryHover, fontWeight: '700' },
});