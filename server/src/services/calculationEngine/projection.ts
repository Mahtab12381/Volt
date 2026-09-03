import { kwhToTkWithSlabs } from './slabConversion.js';
import type { LifelineSlabConfig, SlabBand } from './types.js';

export interface ProjectionConfig {
  lifelineSlab: LifelineSlabConfig;
  standardSlabs: SlabBand[];
  demandChargeTkPerKw: number;
  sanctionedLoadKw: number;
  meterRentTk: number;
  vatPercent: number;
  rebatePercent: number;
  lifelineWarningMarginKwh: number;
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

/**
 * Projects the full month's kWh/bill from the pace observed so far, using a
 * rolling recent-day average. Reprices the ENTIRE projected total against
 * whichever track (lifeline vs standard) it would end up in — a forward
 * application of the same retroactive lifeline rule used in monthlyRecompute.
 */
export function projectMonth(params: {
  cumulativeKwhSoFar: number;
  recentDailyKwh: number[]; // most recent days first or last, order doesn't matter, just averaged
  daysRemainingInMonth: number;
  config: ProjectionConfig;
}): ProjectionResult {
  const { cumulativeKwhSoFar, recentDailyKwh, daysRemainingInMonth, config } = params;

  const windowDays = Math.min(7, recentDailyKwh.length);
  const avgDailyKwh = windowDays > 0 ? recentDailyKwh.slice(-windowDays).reduce((a, b) => a + b, 0) / windowDays : 0;

  const projectedTotalKwh = cumulativeKwhSoFar + avgDailyKwh * daysRemainingInMonth;

  const energyCost =
    projectedTotalKwh <= config.lifelineSlab.thresholdKwh
      ? projectedTotalKwh * config.lifelineSlab.rateTkPerKwh
      : kwhToTkWithSlabs(0, projectedTotalKwh, config.standardSlabs);

  const rebateAmount = energyCost * (config.rebatePercent / 100);
  const energyAfterRebate = energyCost - rebateAmount;
  const vatAmount = energyAfterRebate * (config.vatPercent / 100);
  const demandCharge = config.demandChargeTkPerKw * config.sanctionedLoadKw;
  const totalEstimate = energyAfterRebate + vatAmount + demandCharge + config.meterRentTk;

  const lifelineAtRisk =
    projectedTotalKwh >= config.lifelineSlab.thresholdKwh - config.lifelineWarningMarginKwh &&
    projectedTotalKwh <= config.lifelineSlab.thresholdKwh;

  return {
    projectedTotalKwh,
    energyCost,
    rebateAmount,
    vatAmount,
    demandCharge,
    meterRent: config.meterRentTk,
    totalEstimate,
    methodology: `${windowDays}-day rolling average`,
    isEstimate: true,
    lifelineAtRisk,
  };
}
