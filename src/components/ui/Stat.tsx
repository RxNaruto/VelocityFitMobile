import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';

interface StatProps {
  label: string;
  value: string | number;
  hint?: string;
}

export function Stat({ label, value, hint }: StatProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.surface2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    minWidth: 96,
  },
  label: {
    ...typography.label,
    marginBottom: spacing.xs,
  },
  value: {
    ...typography.heading,
    fontSize: 22,
    color: colors.primaryHover,
  },
  hint: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
});
