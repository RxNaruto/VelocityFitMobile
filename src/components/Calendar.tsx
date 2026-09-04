import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  addMonths,
  buildMonthMatrix,
  toDateKey,
  todayKey,
} from '@/utils/dates';
import type { Workout } from '@/types';
import { colors, radius, spacing, typography } from '@/theme';
import { IconButton } from '@/components/ui';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
            {w}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {matrix.flat().map((day) => {
          const key = toDateKey(day);
          const inMonth = day.getMonth() === viewDate.getMonth();
          const isTodayCell = key === today;
          const isFuture = key > today;
          const hasWorkout = Boolean(workoutsByDate[key]);
          const isBeforeJoin = joinedDateKey ? key < joinedDateKey : false;
          const isMissed =
            inMonth && !hasWorkout && !isTodayCell && !isFuture && !isBeforeJoin;

          return (
            <Pressable
              key={key}
              disabled={isFuture}
              onPress={() => onSelectDate?.(key)}
              style={[
                styles.cell,
                !inMonth && styles.otherMonth,
                isTodayCell && styles.today,
                isFuture && styles.future,
                hasWorkout && styles.hasWorkout,
                isMissed && styles.isMissed,
              ]}
            >
              <Text
                style={[
                  styles.dayNum,
                  !inMonth && styles.dayNumMuted,
                  isTodayCell && styles.dayNumToday,
                ]}
              >
                {day.getDate()}
              </Text>
              {hasWorkout ? <View style={[styles.dot, styles.dotWorkout]} /> : null}
              {isMissed ? <View style={[styles.dot, styles.dotMissed]} /> : null}
            </Pressable>
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
    flex: 1,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    padding: 2,
  },
  otherMonth: { opacity: 0.35 },
  today: {
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  future: { opacity: 0.45 },
  hasWorkout: { backgroundColor: 'rgba(220,38,38,0.08)' },
  isMissed: { backgroundColor: 'rgba(239,68,68,0.06)' },
  dayNum: { ...typography.body, fontSize: 14 },
  dayNumMuted: { color: colors.textFaint },
  dayNumToday: { color: colors.primaryHover, fontWeight: '700' },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 2,
  },
  dotWorkout: { backgroundColor: colors.primary },
  dotMissed: { backgroundColor: colors.danger, opacity: 0.7 },
});
