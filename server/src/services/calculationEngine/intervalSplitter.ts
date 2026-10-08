import {
  bdDateKey,
  bdDaysInMonth,
  bdHour,
  bdMonthKey,
  isBdDaytime,
  nextBdDayNightBoundaryUtc,
  nextBdHourBoundaryUtc,
  nextBdMidnightUtc,
  type DayWindow,
} from './time.js';
import type { AtomicSegment } from './types.js';

const EPSILON_MS = 1;

/** Splits a segment into pieces, cutting at every boundary produced by `nextBoundary`, apportioning kwh/tk by time share. */
export function splitAtBoundary(segment: AtomicSegment, nextBoundary: (d: Date) => Date): AtomicSegment[] {
  const totalMs = segment.toTimestamp.getTime() - segment.fromTimestamp.getTime();
  if (totalMs <= 0) return [segment];

  const pieces: AtomicSegment[] = [];
  let cursor = segment.fromTimestamp;

  let guard = 0;
  while (cursor.getTime() < segment.toTimestamp.getTime() - EPSILON_MS) {
    guard += 1;
    if (guard > 100000) throw new Error('splitAtBoundary did not converge — check boundary function.');

    let boundary = nextBoundary(cursor);
    if (boundary.getTime() > segment.toTimestamp.getTime()) boundary = segment.toTimestamp;

    const pieceMs = boundary.getTime() - cursor.getTime();
    const share = pieceMs / totalMs;
    pieces.push({
      fromTimestamp: cursor,
      toTimestamp: boundary,
      kwh: segment.kwh * share,
      tk: segment.tk * share,
    });
    cursor = boundary;
  }

  return pieces;
}

export function splitAtMidnight(segment: AtomicSegment): AtomicSegment[] {
  return splitAtBoundary(segment, nextBdMidnightUtc);
}

export function splitAtHour(segment: AtomicSegment): AtomicSegment[] {
  return splitAtBoundary(segment, nextBdHourBoundaryUtc);
}

export function splitAtDayNight(segment: AtomicSegment, dayWindow: DayWindow): AtomicSegment[] {
  return splitAtBoundary(segment, (d) => nextBdDayNightBoundaryUtc(d, dayWindow));
}

export interface HourlyBucketAgg {
  hour: number;
  kwh: number;
  tk: number;
}

export function groupByHour(segments: AtomicSegment[]): HourlyBucketAgg[] {
  const buckets: HourlyBucketAgg[] = Array.from({ length: 24 }, (_, hour) => ({ hour, kwh: 0, tk: 0 }));
  for (const seg of segments) {
    for (const piece of splitAtHour(seg)) {
      const hour = bdHour(piece.fromTimestamp);
      buckets[hour].kwh += piece.kwh;
      buckets[hour].tk += piece.tk;
    }
  }
  return buckets;
}

export interface DailyAgg {
  date: string;
  kwh: number;
  tk: number;
  dayKwh: number;
  nightKwh: number;
  dayTk: number;
  nightTk: number;
}

export function groupByDay(segments: AtomicSegment[], dayWindow: DayWindow): Map<string, DailyAgg> {
  const days = new Map<string, DailyAgg>();

  for (const seg of segments) {
    for (const piece of splitAtMidnight(seg)) {
      const date = bdDateKey(piece.fromTimestamp);
      const existing = days.get(date) ?? { date, kwh: 0, tk: 0, dayKwh: 0, nightKwh: 0, dayTk: 0, nightTk: 0 };
      existing.kwh += piece.kwh;
      existing.tk += piece.tk;

      for (const dnPiece of splitAtDayNight(piece, dayWindow)) {
        if (isBdDaytime(dnPiece.fromTimestamp, dayWindow)) {
          existing.dayKwh += dnPiece.kwh;
          existing.dayTk += dnPiece.tk;
        } else {
          existing.nightKwh += dnPiece.kwh;
          existing.nightTk += dnPiece.tk;
        }
      }

      days.set(date, existing);
    }
  }

  return days;
}

export interface WeeklyAgg {
  weekStart: string;
  weekEnd: string;
  kwh: number;
  tk: number;
}

const WEEK_BLOCK_DAYS = 7;

/**
 * Buckets into fixed day-of-month blocks — 1–7, 8–14, 15–21, 22–28, then the
 * 29th onward — rather than ISO weeks. ISO weeks straddle month boundaries, so
 * on a month-scoped dashboard the first bar would carry the previous month's
 * date as its label. These blocks always sit wholly inside one month, and the
 * final one is short (2–3 days) since months aren't multiples of seven.
 */
export function groupByWeek(segments: AtomicSegment[]): Map<string, WeeklyAgg> {
  const weeks = new Map<string, WeeklyAgg>();
  for (const seg of segments) {
    // Split at midnight first so a segment spanning a block boundary is
    // apportioned across both, keeping these bars summing to the daily ones.
    for (const piece of splitAtMidnight(seg)) {
      const [year, month, day] = bdDateKey(piece.fromTimestamp).split('-').map(Number);
      const monthKey = `${year}-${String(month).padStart(2, '0')}`;
      const startDay = Math.floor((day - 1) / WEEK_BLOCK_DAYS) * WEEK_BLOCK_DAYS + 1;
      const endDay = Math.min(startDay + WEEK_BLOCK_DAYS - 1, bdDaysInMonth(monthKey));

      const key = `${monthKey}-${String(startDay).padStart(2, '0')}`;
      const existing = weeks.get(key) ?? {
        weekStart: key,
        weekEnd: `${monthKey}-${String(endDay).padStart(2, '0')}`,
        kwh: 0,
        tk: 0,
      };
      existing.kwh += piece.kwh;
      existing.tk += piece.tk;
      weeks.set(key, existing);
    }
  }
  return weeks;
}

export interface MonthlyAgg {
  month: string;
  kwh: number;
  tk: number;
}

export function groupByMonth(segments: AtomicSegment[]): Map<string, MonthlyAgg> {
  const months = new Map<string, MonthlyAgg>();
  for (const seg of segments) {
    const key = bdMonthKey(seg.fromTimestamp);
    const existing = months.get(key) ?? { month: key, kwh: 0, tk: 0 };
    existing.kwh += seg.kwh;
    existing.tk += seg.tk;
    months.set(key, existing);
  }
  return months;
}

export function totalDayNight(segments: AtomicSegment[], dayWindow: DayWindow): { dayKwh: number; nightKwh: number; dayTk: number; nightTk: number } {
  let dayKwh = 0;
  let nightKwh = 0;
  let dayTk = 0;
  let nightTk = 0;
  for (const seg of segments) {
    for (const piece of splitAtDayNight(seg, dayWindow)) {
      if (isBdDaytime(piece.fromTimestamp, dayWindow)) {
        dayKwh += piece.kwh;
        dayTk += piece.tk;
      } else {
        nightKwh += piece.kwh;
        nightTk += piece.tk;
      }
    }
  }
  return { dayKwh, nightKwh, dayTk, nightTk };
}
