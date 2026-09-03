import { api } from './client.js';
import type {
  BalanceSeriesPoint,
  DailyPoint,
  DayNightResponse,
  HourlyBucket,
  MonthlyPoint,
  ProjectionResult,
  SummaryResponse,
  TrendResponse,
  WeeklyPoint,
} from '@electricity/shared';

function qs(params: Record<string, string | undefined>) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) q.set(k, v);
  const s = q.toString();
  return s ? `?${s}` : '';
}

export const analyticsApi = {
  summary: (month?: string) => api.get<SummaryResponse>(`/analytics/summary${qs({ month })}`),
  trend: (month?: string) => api.get<TrendResponse>(`/analytics/trend${qs({ month })}`),
  hourlySingle: (date: string) => api.get<{ buckets: HourlyBucket[] }>(`/analytics/hourly${qs({ mode: 'single', date })}`),
  hourlyAverage: (from?: string, to?: string) =>
    api.get<{ buckets: HourlyBucket[] }>(`/analytics/hourly${qs({ mode: 'average', from, to })}`),
  daily: (from?: string, to?: string) => api.get<{ points: DailyPoint[] }>(`/analytics/daily${qs({ from, to })}`),
  weekly: (from?: string, to?: string) => api.get<{ points: WeeklyPoint[] }>(`/analytics/weekly${qs({ from, to })}`),
  monthly: (from?: string, to?: string) => api.get<{ points: MonthlyPoint[] }>(`/analytics/monthly${qs({ from, to })}`),
  dayVsNight: (from?: string, to?: string) => api.get<DayNightResponse>(`/analytics/day-vs-night${qs({ from, to })}`),
  projection: (month?: string) => api.get<ProjectionResult>(`/analytics/projection${qs({ month })}`),
  balanceSeries: (from?: string, to?: string) =>
    api.get<{ points: BalanceSeriesPoint[] }>(`/analytics/balance-series${qs({ from, to })}`),
};
