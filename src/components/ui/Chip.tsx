import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';

interface ChipProps {
  label: string;
  variant?: 'default' | 'time';
  style?: ViewStyle;
}

export function Chip({ label, variant = 'default', style }: ChipProps) {
  return (
    <Text style={[styles.base, styles[variant], style]}>{label}</Text>
  );
}

const styles = StyleSheet.create({
  base: {
    ...typography.caption,
    fontSize: 11,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    overflow: 'hidden',
    alignSelf: 'flex-start',
    color: colors.textMuted,
    backgroundColor: colors.surface3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  default: {},
  time: {
    color: '#93c5fd',
    borderColor: 'rgba(59,130,246,0.35)',
    backgroundColor: 'rgba(59,130,246,0.12)',
  },
});
