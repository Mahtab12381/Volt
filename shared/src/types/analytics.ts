export interface SummaryResponse {
  currentBalanceTk: number;
  cumulativeKwhThisMonth: number;
  cumulativeTkThisMonth: number;
  projectedMonthlyKwh: number;
  projectedMonthlyBillTk: number;
  lifelineEligible: boolean;
  lifelineAtRisk: boolean;
  daysElapsed: number;
  daysRemaining: number;
  avgDailyKwh: number;
  estimatedDaysUntilExhaustion: number | null;
}

export interface HourlyBucket {
  hour: number; // 0-23
  kwh: number;
  tk: number;
}

export interface DailyPoint {
  date: string; // YYYY-MM-DD
  kwh: number;
  tk: number;
  dayKwh: number;
  nightKwh: number;
}

export interface WeeklyPoint {
  weekStart: string;
  weekEnd: string;
  kwh: number;
  tk: number;
}

export interface MonthlyPoint {
  month: string; // YYYY-MM
  kwh: number;
  tk: number;
  billEstimate: number;
  lifelineEligible: boolean;
}

export interface DayNightTotals {
  dayKwh: number;
  nightKwh: number;
  dayTk: number;
  nightTk: number;
}

export interface DayNightResponse {
  totals: DayNightTotals;
  byDay: { date: string; dayKwh: number; nightKwh: number }[];
}

export interface TrendPoint {
  date: string;
  kwh: number;
  tk: number;
}

export interface TrendResponse {
  actual: TrendPoint[];
  projected: TrendPoint[];
}

export interface ProjectionResult {
  projectedTotalKwh: number;
  energyCost: number;
  rebateAmount: number;
  vatAmount: number;
  demandCharge: number;
  meterRent: number;
  totalEstimate: number;
  methodology: string;
  isEstimate: true;
  lifelineAtRisk: boolean;
}

export interface BalanceSeriesPoint {
  timestamp: string;
  balanceTk: number;
  isRecharge: boolean;
}
