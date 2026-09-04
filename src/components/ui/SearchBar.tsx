import { StyleSheet, TextInput, TextInputProps, View, Pressable, Text } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';

interface SearchBarProps extends Omit<TextInputProps, 'style'> {
  value: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
}

export function SearchBar({ value, onChangeText, onClear, ...props }: SearchBarProps) {
  return (
    <View style={styles.wrap}>
      <TextInput
        style={styles.input}
        placeholderTextColor={colors.textFaint}
        value={value}
        onChangeText={onChangeText}
        {...props}
      />
      {value.length > 0 ? (
        <Pressable
          onPress={() => (onClear ? onClear() : onChangeText(''))}
          style={styles.clear}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
        >
          <Text style={styles.clearText}>×</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
  },
  input: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingRight: 40,
    color: colors.text,
    fontSize: 15,
    minHeight: 46,
  },
  clear: {
    position: 'absolute',
    right: spacing.sm,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  clearText: {
    color: colors.textMuted,
    fontSize: 22,
    lineHeight: 24,
  },
});
