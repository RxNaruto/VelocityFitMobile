import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { showError } from '@/utils/feedback';
import type { LeaderboardRow } from '@/types';
import {
  Avatar,
  Card,
  EmptyState,
  LoadingState,
  Screen,
} from '@/components/ui';
import { colors, spacing, typography } from '@/theme';

export default function LeaderboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.getLeaderboard(50);
      setRows(res.top);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to load leaderboard');
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const myRow = rows.find((r) => r.userId === user?.id);

  return (
    <Screen scroll refreshing={refreshing} onRefresh={onRefresh}>
      <View style={styles.header}>
        <Text style={styles.title}>Leaderboard</Text>
        <Text style={styles.subtitle}>
          Earn points every time you log a workout. Tap a row to view their profile.
        </Text>
      </View>

      {myRow ? (
        <Pressable
          onPress={() => router.push(`/user/${myRow.username}`)}
          style={({ pressed }) => [pressed && styles.pressed]}
        >
          <Card accent style={styles.myRank}>
            <Text style={styles.myRankLabel}>Your position</Text>
            <View style={styles.myRankBody}>
              <Text style={styles.rankBadge}>#{myRow.rank}</Text>
              <Avatar user={myRow} size={40} />
              <View style={styles.myRankMeta}>
                <Text style={styles.myRankName}>{myRow.name}</Text>
                <Text style={styles.myRankUser}>@{myRow.username}</Text>
              </View>
              <Text style={styles.points}>{myRow.points} pts</Text>
            </View>
          </Card>
        </Pressable>
      ) : null}

      <Card>
        {loading ? (
          <LoadingState message="Loading rankings…" />
        ) : rows.length === 0 ? (
          <EmptyState title="No rankings yet" message="Log a workout to appear here." />
        ) : (
          <View style={styles.list}>
            {rows.map((r) => (
              <Pressable
                key={r.userId}
                onPress={() => router.push(`/user/${r.username}`)}
                style={({ pressed }) => [
                  styles.row,
                  r.userId === user?.id && styles.rowMe,
                  pressed && styles.rowPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`View ${r.name} profile`}
              >
                <Text style={styles.rank}>#{r.rank}</Text>
                <Avatar user={r} size={32} />
                <View style={styles.ident}>
                  <Text style={styles.name}>{r.name}</Text>
                  <Text style={styles.user}>@{r.username}</Text>
                </View>
                <Text style={styles.points}>{r.points}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.sm, marginBottom: spacing.lg },
  title: { ...typography.title },
  subtitle: { ...typography.bodyMuted },
  pressed: { opacity: 0.92 },
  myRank: { marginBottom: spacing.lg, gap: spacing.sm },
  myRankLabel: { ...typography.caption },
  myRankBody: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rankBadge: {
    ...typography.subheading,
    color: colors.primaryHover,
    fontWeight: '800',
  },
  myRankMeta: { flex: 1 },
  myRankName: { ...typography.subheading, fontSize: 15 },
  myRankUser: { ...typography.caption },
  list: { gap: spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    borderRadius: 8,
  },
  rowMe: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryEdge,
    borderBottomWidth: 1,
  },
  rowPressed: { opacity: 0.85 },
  rank: { width: 36, ...typography.caption, fontWeight: '800' },
  ident: { flex: 1 },
  name: { ...typography.body, fontSize: 14 },
  user: { ...typography.caption },
  points: { ...typography.subheading, fontSize: 14, color: colors.primaryHover },
});
