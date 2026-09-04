import { StyleSheet, Text, View } from 'react-native';
import { Stat } from '@/components/ui';
import { spacing, typography } from '@/theme';

export interface StatItem {
  label: string;
  value: string | number;
  hint?: string;
}

interface StatGridProps {
  items: StatItem[];
}

export function StatGrid({ items }: StatGridProps) {
  return (
    <View style={styles.grid}>
      {items.map((item) => (
        <Stat key={item.label} label={item.label} value={item.value} hint={item.hint} />
      ))}
    </View>
  );
}

interface RankedListProps {
  title: string;
  rows: Array<{ key: string; label: string; value: string }>;
}

export function RankedList({ title, rows }: RankedListProps) {
  if (rows.length === 0) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {rows.map((row) => (
        <View key={row.key} style={styles.rankRow}>
          <Text style={styles.rankLabel}>{row.label}</Text>
          <Text style={styles.rankValue}>{row.value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  section: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  sectionTitle: { ...typography.subheading, fontSize: 15 },
  rankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(42,42,42,0.6)',
  },
  rankLabel: { ...typography.body, fontSize: 14, flex: 1 },
  rankValue: { ...typography.caption, color: '#a3a3a3' },
});
