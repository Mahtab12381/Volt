import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../api/analytics.api.js';

export function useSummary(month?: string) {
  return useQuery({ queryKey: ['analytics', 'summary', month], queryFn: () => analyticsApi.summary(month) });
}

export function useTrend(month?: string) {
  return useQuery({ queryKey: ['analytics', 'trend', month], queryFn: () => analyticsApi.trend(month) });
}

export function useHourlyAverage(from?: string, to?: string) {
  return useQuery({
    queryKey: ['analytics', 'hourly', 'average', from, to],
    queryFn: () => analyticsApi.hourlyAverage(from, to),
  });
}

export function useDaily(from?: string, to?: string) {
  return useQuery({ queryKey: ['analytics', 'daily', from, to], queryFn: () => analyticsApi.daily(from, to) });
}

export function useWeekly(from?: string, to?: string) {
  return useQuery({ queryKey: ['analytics', 'weekly', from, to], queryFn: () => analyticsApi.weekly(from, to) });
}

export function useMonthly(from?: string, to?: string) {
  return useQuery({ queryKey: ['analytics', 'monthly', from, to], queryFn: () => analyticsApi.monthly(from, to) });
}

export function useDayVsNight(from?: string, to?: string) {
  return useQuery({ queryKey: ['analytics', 'day-vs-night', from, to], queryFn: () => analyticsApi.dayVsNight(from, to) });
}

export function useProjection(month?: string) {
  return useQuery({ queryKey: ['analytics', 'projection', month], queryFn: () => analyticsApi.projection(month) });
}

export function useBalanceSeries(from?: string, to?: string) {
  return useQuery({
    queryKey: ['analytics', 'balance-series', from, to],
    queryFn: () => analyticsApi.balanceSeries(from, to),
  });
}
