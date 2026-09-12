import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  addMonths,
  buildMonthMatrix,
  toDateKey,
  todayKey,
} from '@/utils/dates';
import { hasLoggedSets } from '@/utils/workouts';
import type { Workout } from '@/types';
import { colors, radius, spacing, typography } from '@/theme';
import { IconButton } from '@/components/ui';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const COLUMN_WIDTH = `${100 / 7}%` as const;

interface CalendarProps {
  workoutsByDate: Record<string, Workout>;
  onSelectDate?: (key: string) => void;
  joinedDateKey?: string | null;
}

export function Calendar({
  workoutsByDate,
  onSelectDate,
  joinedDateKey,
}: CalendarProps) {
  const [viewDate, setViewDate] = useState<Date>(() => new Date());
  const matrix = useMemo(() => buildMonthMatrix(viewDate), [viewDate]);
  const monthLabel = useMemo(
    () =>
      viewDate.toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric',
      }),
    [viewDate]
  );
  const today = todayKey();

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <IconButton label="‹" onPress={() => setViewDate((d) => addMonths(d, -1))} />
        <Text style={styles.month}>{monthLabel}</Text>
        <IconButton label="›" onPress={() => setViewDate((d) => addMonths(d, 1))} />
      </View>

      <View style={styles.weekdays}>
        {WEEKDAYS.map((w) => (
          <Text key={w} style={styles.weekday}>
            {w.toUpperCase()}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {matrix.flat().map((day) => {
          const key = toDateKey(day);
          const inMonth = day.getMonth() === viewDate.getMonth();
          const isTodayCell = key === today;
          const isFuture = key > today;
          const hasWorkout = hasLoggedSets(workoutsByDate[key]);
          const isBeforeJoin = joinedDateKey ? key < joinedDateKey : false;
          const isMissed =
            inMonth && !hasWorkout && !isTodayCell && !isFuture && !isBeforeJoin;

          return (
            <View key={key} style={styles.cellWrap}>
              <Pressable
                disabled={isFuture}
                onPress={() => onSelectDate?.(key)}
                accessibilityRole="button"
                accessibilityLabel={`${key}${hasWorkout ? ', workout logged' : ''}`}
                style={({ pressed }) => [
                  styles.cell,
                  isMissed && styles.cellMissed,
                  hasWorkout && styles.cellWorkout,
                  isTodayCell && !hasWorkout && styles.cellTodayFill,
                  // Ring goes on last so a logged today keeps its fill.
                  isTodayCell && styles.cellTodayRing,
                  !inMonth && styles.cellOtherMonth,
                  isFuture && styles.cellFuture,
                  pressed && styles.cellPressed,
                ]}
              >
                <Text
                  style={[
                    styles.dayNum,
                    isMissed && styles.dayNumMissed,
                    hasWorkout && styles.dayNumWorkout,
                    isTodayCell && styles.dayNumToday,
                  ]}
                >
                  {day.getDate()}
                </Text>
                {hasWorkout ? <View style={[styles.dot, styles.dotWorkout]} /> : null}
                {isMissed ? <View style={[styles.dot, styles.dotMissed]} /> : null}
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.md },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  month: { ...typography.subheading, flex: 1, textAlign: 'center' },
  weekdays: {
    flexDirection: 'row',
  },
  weekday: {
    ...typography.caption,
    width: COLUMN_WIDTH,
    textAlign: 'center',
    fontSize: 11,
    letterSpacing: 0.8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  // The wrapper owns the column width so the padding reads as a gutter between
  // cells; percentage widths and `gap` together would overflow the row.
  cellWrap: {
    width: COLUMN_WIDTH,
    aspectRatio: 1,
    padding: 3,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: colors.surface2,
  },
  // Days without a workout should recede, not compete with logged days.
  cellMissed: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cellWorkout: {
    backgroundColor: 'rgba(220,38,38,0.30)',
    borderColor: 'rgba(239,68,68,0.55)',
  },
  cellTodayFill: {
    backgroundColor: 'rgba(220,38,38,0.18)',
  },
  cellTodayRing: {
    borderColor: colors.primary,
  },
  cellOtherMonth: { opacity: 0.4 },
  cellFuture: { opacity: 0.35 },
  cellPressed: { opacity: 0.7 },
  dayNum: { ...typography.body, fontSize: 14 },
  dayNumMissed: { color: colors.textFaint },
  dayNumWorkout: { color: colors.white, fontWeight: '700' },
  dayNumToday: { color: colors.white, fontWeight: '700' },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    position: 'absolute',
    bottom: 5,
  },
  dotWorkout: { backgroundColor: colors.primaryHover },
  dotMissed: { backgroundColor: colors.textFaint },
});