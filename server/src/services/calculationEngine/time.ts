// Bangladesh is a fixed UTC+6 offset with no DST. All "wall clock" boundary
// math (midnight, hour marks, 7am/7pm) must use this fixed offset rather than
// the host machine's local timezone, since the app may run/deploy anywhere.
export const BD_OFFSET_MS = 6 * 60 * 60 * 1000;

export interface DayWindow {
  startHour: number;
  endHour: number;
}

function toBdShifted(d: Date): Date {
  return new Date(d.getTime() + BD_OFFSET_MS);
}

export function bdMonthKey(d: Date): string {
  const s = toBdShifted(d);
  return `${s.getUTCFullYear()}-${String(s.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function bdDateKey(d: Date): string {
  const s = toBdShifted(d);
  return `${s.getUTCFullYear()}-${String(s.getUTCMonth() + 1).padStart(2, '0')}-${String(
    s.getUTCDate(),
  ).padStart(2, '0')}`;
}

export function bdHour(d: Date): number {
  return toBdShifted(d).getUTCHours();
}

export function nextBdMidnightUtc(d: Date): Date {
  const s = toBdShifted(d);
  const nextShifted = Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate() + 1, 0, 0, 0, 0);
  return new Date(nextShifted - BD_OFFSET_MS);
}

export function nextBdHourBoundaryUtc(d: Date): Date {
  const s = toBdShifted(d);
  const nextShifted = Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate(), s.getUTCHours() + 1, 0, 0, 0);
  return new Date(nextShifted - BD_OFFSET_MS);
}

export function nextBdDayNightBoundaryUtc(d: Date, dayWindow: DayWindow): Date {
  const s = toBdShifted(d);
  const y = s.getUTCFullYear();
  const mo = s.getUTCMonth();
  const day = s.getUTCDate();
  const startToday = Date.UTC(y, mo, day, dayWindow.startHour, 0, 0, 0);
  const endToday = Date.UTC(y, mo, day, dayWindow.endHour, 0, 0, 0);
  const candidates = [startToday, endToday].filter((c) => c > s.getTime()).sort((a, b) => a - b);
  const resultShifted = candidates.length > 0 ? candidates[0] : Date.UTC(y, mo, day + 1, dayWindow.startHour, 0, 0, 0);
  return new Date(resultShifted - BD_OFFSET_MS);
}

export function isBdDaytime(d: Date, dayWindow: DayWindow): boolean {
  const s = toBdShifted(d);
  const hour = s.getUTCHours() + s.getUTCMinutes() / 60;
  return hour >= dayWindow.startHour && hour < dayWindow.endHour;
}

export function bdMonthStartUtc(monthKey: string): Date {
  const [y, m] = monthKey.split('-').map(Number);
  const shifted = Date.UTC(y, m - 1, 1, 0, 0, 0, 0);
  return new Date(shifted - BD_OFFSET_MS);
}

export function bdMonthEndExclusiveUtc(monthKey: string): Date {
  const [y, m] = monthKey.split('-').map(Number);
  const shifted = Date.UTC(y, m, 1, 0, 0, 0, 0);
  return new Date(shifted - BD_OFFSET_MS);
}

export function bdDayOfMonth(d: Date): number {
  const s = toBdShifted(d);
  return s.getUTCDate();
}

export function bdDaysInMonth(monthKey: string): number {
  const [y, m] = monthKey.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

export function bdIsoWeekStartUtc(d: Date): Date {
  const s = toBdShifted(d);
  const dow = s.getUTCDay() === 0 ? 7 : s.getUTCDay(); // Monday=1..Sunday=7
  const mondayShifted = Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate() - (dow - 1), 0, 0, 0, 0);
  return new Date(mondayShifted - BD_OFFSET_MS);
}
