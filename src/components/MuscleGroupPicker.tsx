import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useWorkouts } from '@/context/WorkoutContext';
import { MuscleIcon } from '@/components/MuscleIcon';
import type { MuscleGroup } from '@/types';
import { colors, radius, spacing, typography } from '@/theme';

interface MuscleGroupPickerProps {
  onPick: (group: MuscleGroup) => void;
}

export function MuscleGroupPicker({ onPick }: MuscleGroupPickerProps) {
  const { muscleGroups } = useWorkouts();

  return (
    <View style={styles.list}>
      {muscleGroups.map((g) => (
        <Pressable
          key={g.id}
          onPress={() => onPick(g)}
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`Pick ${g.name}`}
        >
          <MuscleIcon slug={g.slug} name={g.name} size={30} plated />
          <Text style={styles.name}>{g.name}</Text>
          <Text style={styles.chev}>›</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  pressed: { opacity: 0.9, backgroundColor: colors.surface2 },
  name: { ...typography.subheading, flex: 1 },
  chev: { color: colors.textFaint, fontSize: 20 },
});
