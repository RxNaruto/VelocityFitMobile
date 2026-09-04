import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { spacing, typography } from '@/theme';

interface PageToolbarProps {
  left?: ReactNode;
  right?: ReactNode;
  subtitle?: string;
}

export function PageToolbar({ left, right, subtitle }: PageToolbarProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={styles.side}>{left}</View>
        <View style={styles.sideRight}>{right}</View>
      </View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  side: { flexShrink: 1 },
  sideRight: { flexShrink: 0 },
  subtitle: {
    ...typography.caption,
    textAlign: 'right',
  },
});
