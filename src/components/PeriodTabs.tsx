import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';

export const STATS_PERIODS = [
  { id: 'week', label: 'This week' },
  { id: 'month', label: 'This month' },
  { id: 'all', label: 'All time' },
] as const;

export type StatsPeriod = (typeof STATS_PERIODS)[number]['id'];

interface PeriodTabsProps {
  value: StatsPeriod;
  onChange: (period: StatsPeriod) => void;
}

export function PeriodTabs({ value, onChange }: PeriodTabsProps) {
  return (
    <View style={styles.wrap}>
      {STATS_PERIODS.map((p) => (
        <Pressable
          key={p.id}
          onPress={() => onChange(p.id)}
          style={[styles.tab, value === p.id && styles.tabActive]}
          accessibilityRole="tab"
          accessibilityState={{ selected: value === p.id }}
        >
          <Text style={[styles.tabText, value === p.id && styles.tabTextActive]}>
            {p.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
  },
  tabActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  tabText: { ...typography.caption, color: colors.textMuted },
  tabTextActive: { color: colors.primaryHover, fontWeight: '700' },
});
