import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
    <View style={styles.grid}>
      {muscleGroups.map((g) => (
        <Pressable
          key={g.id}
          onPress={() => onPick(g)}
          style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`Pick ${g.name}`}
        >
          <LinearGradient
            colors={['rgba(220,38,38,0.32)', 'rgba(220,38,38,0.05)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <View style={styles.iconPlate}>
            <MuscleIcon slug={g.slug} name={g.name} size={34} />
          </View>
          <Text style={styles.name} numberOfLines={1}>
            {g.name}
          </Text>
          <Text style={styles.meta}>Choose ›</Text>
        </Pressable>
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
  tile: {
    flexGrow: 1,
    flexBasis: '46%',
    minWidth: 140,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primaryEdge,
    padding: spacing.lg,
    gap: spacing.sm,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.9,
    borderColor: colors.primary,
  },
  iconPlate: {
    width: 56,
    height: 56,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryDeep,
    borderWidth: 1,
    borderColor: colors.primaryEdge,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    ...typography.subheading,
    marginTop: spacing.xs,
  },
  meta: {
    ...typography.caption,
    fontSize: 12,
    color: colors.primaryHover,
    fontWeight: '600',
  },
});