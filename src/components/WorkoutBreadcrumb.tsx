import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '@/theme';

const STEP = {
  OVERVIEW: 'overview',
  PICK_GROUP: 'pickGroup',
  PICK_EXERCISE: 'pickExercise',
  LOG_SETS: 'logSets',
} as const;

export type AddWorkoutStep = (typeof STEP)[keyof typeof STEP];
export { STEP };

interface BreadcrumbProps {
  step: AddWorkoutStep;
  groupName: string | null;
  exerciseName: string | null;
  onJump: (target: AddWorkoutStep) => void;
}

export function WorkoutBreadcrumb({ step, groupName, exerciseName, onJump }: BreadcrumbProps) {
  return (
    <View style={styles.wrap}>
      <Crumb label="Overview" onPress={() => onJump(STEP.OVERVIEW)} active={false} />
      <Text style={styles.sep}>›</Text>
      <Crumb
        label="Muscle group"
        onPress={() => onJump(STEP.PICK_GROUP)}
        active={step === STEP.PICK_GROUP}
      />
      {(step === STEP.PICK_EXERCISE || step === STEP.LOG_SETS) && (
        <>
          <Text style={styles.sep}>›</Text>
          <Crumb
            label={groupName || 'Exercise'}
            onPress={() => onJump(STEP.PICK_EXERCISE)}
            active={step === STEP.PICK_EXERCISE}
          />
        </>
      )}
      {step === STEP.LOG_SETS && (
        <>
          <Text style={styles.sep}>›</Text>
          <Text style={styles.current}>{exerciseName || 'Log sets'}</Text>
        </>
      )}
    </View>
  );
}

function Crumb({
  label,
  onPress,
  active,
}: {
  label: string;
  onPress: () => void;
  active: boolean;
}) {
  return (
    <Pressable onPress={onPress}>
      <Text style={[styles.crumb, active && styles.crumbActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  crumb: { ...typography.caption, color: colors.primaryHover },
  crumbActive: { fontWeight: '800', color: colors.text },
  sep: { color: colors.textFaint },
  current: { ...typography.caption, color: colors.text },
});
