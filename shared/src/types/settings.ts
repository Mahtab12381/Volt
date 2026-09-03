export interface LifelineSlab {
  thresholdKwh: number;
  rateTkPerKwh: number;
}

export interface StandardSlabBand {
  minKwh: number;
  maxKwh: number | null; // null = open-ended (e.g. 601+)
  rateTkPerKwh: number;
}

export interface DayWindow {
  startHour: number; // e.g. 7
  endHour: number; // e.g. 19
}

export type UnitMode = 'kwh' | 'tk';

export interface AppSettings {
  lifelineSlab: LifelineSlab;
  standardSlabs: StandardSlabBand[];
  demandChargeTkPerKw: number;
  sanctionedLoadKw: number;
  meterRentTk: number;
  vatPercent: number;
  rebatePercent: number;
  dayWindow: DayWindow;
  monthlyBudgetTk: number; // 0 = no budget set. Drives the dashboard's budget status badge.
  budgetAtRiskFraction: number; // e.g. 0.9 -> "at risk" once projected spend hits 90% of budget
  defaultUnitMode: UnitMode; // default unit for the dashboard's graph unit toggle
  updatedAt: string;
}

export type UpdateSettingsInput = Partial<Omit<AppSettings, 'updatedAt'>>;
