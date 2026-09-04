export function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function toDateKey(date: Date | string | number): string {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayKey(): string {
  return toDateKey(new Date());
}

export function isToday(dateKey: string): boolean {
  return dateKey === todayKey();
}

export function isFuture(dateKey: string): boolean {
  return dateKey > todayKey();
}

export function fromDateKey(key: string | undefined | null): Date | null {
  if (!key) return null;
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatPretty(dateKey: string | undefined | null): string {
  const d = fromDateKey(dateKey);
  if (!d) return '';
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export function weekdayOf(dateKey: string): number {
  const d = fromDateKey(dateKey);
  return d ? d.getDay() : 0;
}

export function weekdayName(weekday: number | null | undefined): string {
  if (weekday === null || weekday === undefined) return '';
  return WEEKDAY_NAMES[weekday] ?? '';
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

export function buildMonthMatrix(viewDate: Date): Date[][] {
  const first = startOfMonth(viewDate);
  const startWeekday = first.getDay();
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - startWeekday);

  const weeks: Date[][] = [];
  for (let w = 0; w < 6; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      const day = new Date(gridStart);
      day.setDate(gridStart.getDate() + w * 7 + d);
      week.push(day);
    }
    weeks.push(week);
  }
  return weeks;
}
