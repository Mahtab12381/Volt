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

export interface AppSettings {
  lifelineSlab: LifelineSlab;
  standardSlabs: StandardSlabBand[];
  demandChargeTkPerKw: number;
  sanctionedLoadKw: number;
  meterRentTk: number;
  vatPercent: number;
  rebatePercent: number;
  dayWindow: DayWindow;
  lifelineWarningMarginKwh: number; // e.g. 10 -> warn between 40-50 kWh
  updatedAt: string;
}

export type UpdateSettingsInput = Partial<Omit<AppSettings, 'updatedAt'>>;
