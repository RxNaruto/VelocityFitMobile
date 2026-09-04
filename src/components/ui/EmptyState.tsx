import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '@/theme';

interface EmptyStateProps {
  title: string;
  message?: string;
  icon?: string;
}

export function EmptyState({ title, message, icon = '◎' }: EmptyStateProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.icon} accessibilityElementsHidden>
        {icon}
      </Text>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.xxl,
  },
  icon: {
    fontSize: 36,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.subheading,
    textAlign: 'center',
  },
  message: {
    ...typography.bodyMuted,
    textAlign: 'center',
    maxWidth: 280,
  },
});
