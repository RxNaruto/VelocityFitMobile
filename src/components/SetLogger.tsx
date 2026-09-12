import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useWorkouts } from '@/context/WorkoutContext';
import {
  findAllTimePRFor,
  findLastSessionFor,
  formatDuration,
  fromSeconds,
  isTimeBasedExercise,
  toSeconds,
  type PRRecord,
} from '@/utils/exerciseKind';
import { formatPretty, todayKey } from '@/utils/dates';
import { showError } from '@/utils/feedback';
import type { EntryDraft, Exercise, WorkoutEntry, WorkoutSet } from '@/types';
import { Button, Card, TextArea } from '@/components/ui';
import { colors, radius, spacing, typography } from '@/theme';

interface SetLoggerProps {
  exercise: Exercise;
  onAdd: (entry: EntryDraft) => void;
  onCancel: () => void;
}

interface DropRow {
  id: string;
  reps: number | string;
  weight: number | string;
}

interface Row {
  id: string;
  a: number | string;
  b: number | string;
  isFailure: boolean;
  drops: DropRow[];
}

function rid(prefix = 'tmp'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}

function makeRow(
  a: number | string = '',
  b: number | string = '',
  isFailure = false
): Row {
  return { id: rid(), a, b, isFailure, drops: [] };
}

function makeDrop(reps: number | string = '', weight: number | string = ''): DropRow {
  return { id: rid('drop'), reps, weight };
}

function setToRow(set: WorkoutSet, timeBased: boolean): Row {
  if (timeBased) {
    const { minutes, seconds } = fromSeconds(set.reps);
    return {
      id: rid(),
      a: minutes || '',
      b: seconds || '',
      isFailure: Boolean(set.isFailure),
      drops: [],
    };
  }
  return {
    id: rid(),
    a: set.reps,
    b: set.weight ?? '',
    isFailure: Boolean(set.isFailure),
    drops: (set.drops || []).map((d) => makeDrop(d.reps, d.weight ?? '')),
  };
}

function entryToRows(entry: WorkoutEntry, timeBased: boolean): Row[] {
  if (!entry.sets || entry.sets.length === 0) return [makeRow()];
  return entry.sets.map((s) => setToRow(s, timeBased));
}

export function SetLogger({ exercise, onAdd, onCancel }: SetLoggerProps) {
  const { muscleGroupLookup, workoutsByDate } = useWorkouts();
  const timeBased = useMemo(
    () => isTimeBasedExercise(exercise, muscleGroupLookup),
    [exercise, muscleGroupLookup]
  );

  const lastSession = useMemo(
    () => findLastSessionFor(workoutsByDate, exercise.id, todayKey()),
    [workoutsByDate, exercise.id]
  );

  const personalRecord = useMemo(
    () => findAllTimePRFor(workoutsByDate, exercise.id, timeBased),
    [workoutsByDate, exercise.id, timeBased]
  );

  const [rows, setRows] = useState<Row[]>(() =>
    lastSession ? entryToRows(lastSession.entry, timeBased) : [makeRow()]
  );
  const [notes, setNotes] = useState('');
  const [prefilled, setPrefilled] = useState(Boolean(lastSession));

  function markDirty() {
    if (prefilled) setPrefilled(false);
  }

  function updateRow<K extends keyof Row>(idx: number, field: K, value: Row[K]) {
    markDirty();
    setRows((prev) => prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
  }

  function addRow() {
    markDirty();
    setRows((prev) => {
      const last = prev[prev.length - 1];
      return [...prev, makeRow(last?.a || '', last?.b || '', false)];
    });
  }

  function toggleFailure(idx: number) {
    markDirty();
    setRows((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, isFailure: !s.isFailure } : s))
    );
  }

  function removeRow(idx: number) {
    markDirty();
    setRows((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== idx)));
  }

  function resetRows() {
    setRows([makeRow()]);
    setPrefilled(false);
  }

  function reapplyLastSession() {
    if (!lastSession) return;
    setRows(entryToRows(lastSession.entry, timeBased));
    setPrefilled(true);
  }

  function addDrop(rowIdx: number) {
    markDirty();
    setRows((prev) =>
      prev.map((r, i) => {
        if (i !== rowIdx) return r;
        const last = r.drops[r.drops.length - 1];
        const seedWeight =
          r.drops.length === 0 ? suggestDropWeight(r.b) : last?.weight || '';
        // Adding a drop must not touch `isFailure` — the F flag stays whatever
        // the user set, otherwise turning it off looks like it never sticks.
        return {
          ...r,
          drops: [...r.drops, makeDrop(last?.reps || '', seedWeight)],
        };
      })
    );
  }

  function updateDrop(rowIdx: number, dropIdx: number, field: 'reps' | 'weight', value: string) {
    markDirty();
    setRows((prev) =>
      prev.map((r, i) => {
        if (i !== rowIdx) return r;
        return {
          ...r,
          drops: r.drops.map((d, j) => (j === dropIdx ? { ...d, [field]: value } : d)),
        };
      })
    );
  }

  function removeDrop(rowIdx: number, dropIdx: number) {
    markDirty();
    setRows((prev) =>
      prev.map((r, i) =>
        i === rowIdx ? { ...r, drops: r.drops.filter((_, j) => j !== dropIdx) } : r
      )
    );
  }

  function handleSubmit() {
    const cleaned = rows
      .map((r) => {
        if (timeBased) {
          const totalSeconds = toSeconds(r.a, r.b);
          return {
            reps: totalSeconds,
            weight: null as number | null,
            isFailure: Boolean(r.isFailure),
          };
        }
        const drops = r.drops
          .map((d) => ({
            reps: Number(d.reps) || 0,
            weight: d.weight === '' ? null : Number(d.weight),
          }))
          .filter((d) => Number.isFinite(d.reps) && d.reps > 0);
        return {
          reps: Number(r.a) || 0,
          weight: r.b === '' ? null : Number(r.b),
          isFailure: Boolean(r.isFailure),
          drops,
        };
      })
      .filter((s) => Number.isFinite(s.reps) && s.reps > 0);

    if (cleaned.length === 0) {
      showError(
        timeBased
          ? 'Add at least one set with a duration > 0.'
          : 'Add at least one set with reps > 0.'
      );
      return;
    }
    onAdd({
      exerciseId: exercise.id,
      sets: cleaned,
      notes: notes.trim(),
    });
  }

  const aLabel = timeBased ? 'Min' : 'Reps';
  const bLabel = timeBased ? 'Sec' : 'Weight';

  return (
    <Card accent style={styles.card}>
      {personalRecord ? <PRBadge record={personalRecord} timeBased={timeBased} /> : null}

      {lastSession ? (
        <LastSessionPanel
          date={lastSession.date}
          entry={lastSession.entry}
          timeBased={timeBased}
          prefilled={prefilled}
          onReset={resetRows}
          onReapply={reapplyLastSession}
        />
      ) : null}

      <Text style={styles.hint}>
        {timeBased
          ? 'Duration is split into minutes + seconds.'
          : 'Tap F to mark failure. Use + Drop for no-rest drops.'}
      </Text>

      <View style={styles.table}>
        <View style={styles.tableHead}>
          <Text style={[styles.th, styles.colNum]}>#</Text>
          <Text style={[styles.th, styles.colInput]}>{aLabel}</Text>
          <Text style={[styles.th, styles.colInput]}>{bLabel}</Text>
          <Text style={[styles.th, styles.colFail]}>F</Text>
          <View style={styles.colDel} />
        </View>

        {rows.map((r, i) => (
          <View key={r.id} style={[styles.setGroup, i > 0 && styles.setGroupDivided]}>
            <View style={styles.setRow}>
              <Text style={[styles.setNum, styles.colNum]}>{i + 1}</Text>
              <TextInput
                style={[styles.input, styles.colInput]}
                keyboardType="numeric"
                value={String(r.a)}
                onChangeText={(v) => updateRow(i, 'a', v)}
                placeholder="0"
                placeholderTextColor={colors.textFaint}
              />
              <TextInput
                style={[styles.input, styles.colInput]}
                keyboardType={timeBased ? 'number-pad' : 'decimal-pad'}
                value={String(r.b)}
                onChangeText={(v) => updateRow(i, 'b', v)}
                placeholder={timeBased ? '0' : 'BW'}
                placeholderTextColor={colors.textFaint}
              />
              <Pressable
                onPress={() => toggleFailure(i)}
                // Vertical only: the neighbouring × already claims the gap to
                // the right, and widening this would fight it for taps.
                hitSlop={{ top: 6, bottom: 6, left: 2, right: 2 }}
                style={({ pressed }) => [
                  styles.failBtn,
                  styles.colFail,
                  r.isFailure ? styles.failBtnOn : styles.failBtnOff,
                  pressed && styles.failBtnPressed,
                ]}
                accessibilityRole="switch"
                accessibilityState={{ checked: r.isFailure }}
                accessibilityLabel={`Set ${i + 1} taken to failure`}
              >
                <Text
                  style={[
                    styles.failText,
                    r.isFailure ? styles.failTextOn : styles.failTextOff,
                  ]}
                >
                  F
                </Text>
              </Pressable>
              <Pressable
                onPress={() => removeRow(i)}
                disabled={rows.length === 1}
                style={styles.colDel}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`Remove set ${i + 1}`}
              >
                <Text style={[styles.remove, rows.length === 1 && styles.removeOff]}>×</Text>
              </Pressable>
            </View>

            {!timeBased && r.drops.length > 0 ? (
              <View style={styles.drops}>
                {r.drops.map((d, j) => (
                  <View key={d.id} style={styles.dropRow}>
                    <Text style={[styles.dropLabel, styles.colNum]}>↳</Text>
                    <TextInput
                      style={[styles.input, styles.inputDrop, styles.colInput]}
                      keyboardType="numeric"
                      value={String(d.reps)}
                      onChangeText={(v) => updateDrop(i, j, 'reps', v)}
                      placeholder="reps"
                      placeholderTextColor={colors.textFaint}
                    />
                    <TextInput
                      style={[styles.input, styles.inputDrop, styles.colInput]}
                      keyboardType="decimal-pad"
                      value={String(d.weight)}
                      onChangeText={(v) => updateDrop(i, j, 'weight', v)}
                      placeholder="wt"
                      placeholderTextColor={colors.textFaint}
                    />
                    <View style={styles.colFail} />
                    <Pressable
                      onPress={() => removeDrop(i, j)}
                      style={styles.colDel}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove drop ${j + 1}`}
                    >
                      <Text style={styles.remove}>×</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : null}

            {!timeBased ? (
              <Pressable
                onPress={() => addDrop(i)}
                style={({ pressed }) => [styles.dropAdd, pressed && styles.dropAddPressed]}
                accessibilityRole="button"
                accessibilityLabel={`Add a drop set to set ${i + 1}`}
              >
                <Text style={styles.dropAddText}>+ Drop</Text>
              </Pressable>
            ) : null}
          </View>
        ))}
      </View>

      <Button title="+ Add set" variant="ghost" size="sm" onPress={addRow} />

      <TextArea
        label="Notes (optional)"
        value={notes}
        onChangeText={setNotes}
        placeholder={timeBased ? 'Pace, HR zone…' : 'Form cues, RPE…'}
      />

      <View style={styles.actions}>
        <Button title="Cancel" variant="ghost" onPress={onCancel} />
        <Button title="Add to workout" onPress={handleSubmit} />
      </View>
    </Card>
  );
}

function LastSessionPanel({
  date,
  entry,
  timeBased,
  prefilled,
  onReset,
  onReapply,
}: {
  date: string;
  entry: WorkoutEntry;
  timeBased: boolean;
  prefilled: boolean;
  onReset: () => void;
  onReapply: () => void;
}) {
  return (
    <View style={styles.lastSession}>
      <View style={styles.lastHead}>
        <View style={{ flex: 1 }}>
          <Text style={styles.lastTitle}>Last time — {formatPretty(date)}</Text>
          <Text style={styles.lastSub}>
            {entry.sets.length} set{entry.sets.length === 1 ? '' : 's'}
            {prefilled ? ' — pre-filled below' : ' — for reference'}
          </Text>
        </View>
        {prefilled ? (
          <Button title="Start fresh" variant="ghost" size="sm" onPress={onReset} />
        ) : (
          <Button title="Use last" variant="ghost" size="sm" onPress={onReapply} />
        )}
      </View>
      <View style={styles.pills}>
        {entry.sets.map((s, i) => (
          <Text key={s.id || i} style={styles.pill}>
            {timeBased ? formatDuration(s.reps) : describeStrengthSet(s)}
            {s.isFailure ? ' F' : ''}
          </Text>
        ))}
      </View>
    </View>
  );
}

function PRBadge({ record, timeBased }: { record: PRRecord; timeBased: boolean }) {
  return (
    <View style={styles.pr}>
      <Text style={styles.prTitle}>All-time PR</Text>
      <Text style={styles.prValue}>
        {timeBased
          ? formatDuration(record.reps)
          : record.weight !== null
            ? `${record.weight} kg × ${record.reps}`
            : `${record.reps} reps`}
      </Text>
      <Text style={styles.prDate}>{formatPretty(record.date)}</Text>
    </View>
  );
}

function suggestDropWeight(parentWeight: number | string): number | string {
  const w = Number(parentWeight);
  if (!Number.isFinite(w) || w <= 0) return '';
  const proposed = Math.round(w * 0.8 * 2) / 2;
  return proposed > 0 ? proposed : '';
}

function describeStrengthSet(set: WorkoutSet): string {
  const segs = [`${set.reps}×${set.weight ?? 'BW'}`];
  (set.drops || []).forEach((d) => segs.push(`${d.reps}×${d.weight ?? 'BW'}`));
  return segs.join(' → ');
}

/** Shared column widths so the header, set rows and drop rows line up. */
const COL_NUM = 22;
const COL_FAIL = 40;
const COL_DEL = 28;

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  hint: { ...typography.caption },
  table: {
    backgroundColor: colors.bgSoft,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
  },
  tableHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  th: { ...typography.label, fontSize: 10, textAlign: 'center' },
  colNum: { width: COL_NUM },
  colInput: { flex: 1 },
  colFail: { width: COL_FAIL },
  colDel: { width: COL_DEL, alignItems: 'center', justifyContent: 'center' },
  setGroup: { paddingVertical: spacing.sm, gap: spacing.xs },
  setGroupDivided: { borderTopWidth: 1, borderTopColor: colors.border },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  setNum: { ...typography.caption, textAlign: 'center', fontWeight: '700' },
  input: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 0,
    color: colors.text,
    fontSize: 15,
    textAlign: 'center',
    height: 42,
  },
  inputDrop: { height: 34, fontSize: 14, backgroundColor: colors.surface },
  failBtn: {
    height: 42,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Both states are spelled out so toggling always repaints the fill, border
  // and glyph together instead of leaving the "on" red behind.
  failBtnOff: {
    backgroundColor: colors.surface2,
    borderColor: colors.border,
  },
  failBtnOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  failBtnPressed: { opacity: 0.65 },
  failText: { fontWeight: '700', fontSize: 15 },
  failTextOff: { color: colors.textMuted },
  failTextOn: { color: colors.white },
  remove: { fontSize: 20, lineHeight: 22, color: colors.textMuted },
  removeOff: { opacity: 0.3 },
  drops: { gap: spacing.xs },
  dropRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dropLabel: { ...typography.caption, textAlign: 'center', color: colors.textFaint },
  dropAdd: {
    alignSelf: 'flex-start',
    marginLeft: COL_NUM + spacing.sm,
    height: 28,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropAddPressed: { opacity: 0.85, borderColor: colors.primaryEdge },
  dropAddText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
    color: colors.primaryHover,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  lastSession: {
    backgroundColor: colors.surface2,
    borderRadius: radius.sm,
    padding: spacing.md,
    gap: spacing.sm,
  },
  lastHead: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  lastTitle: { ...typography.subheading, fontSize: 14 },
  lastSub: { ...typography.caption },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  pill: {
    ...typography.caption,
    backgroundColor: colors.surface3,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  pr: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.primaryEdge,
  },
  prTitle: { ...typography.label, color: colors.primaryHover },
  prValue: { ...typography.subheading, marginTop: spacing.xs },
  prDate: { ...typography.caption, marginTop: spacing.xs },
});