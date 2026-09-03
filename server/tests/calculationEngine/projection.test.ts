import { describe, expect, it } from 'vitest';
import { projectMonth } from '../../src/services/calculationEngine/projection.js';
import { LIFELINE_SLAB, STANDARD_SLABS } from './fixtures/sampleReadings.js';

const baseConfig = {
  lifelineSlab: LIFELINE_SLAB,
  standardSlabs: STANDARD_SLABS,
  demandChargeTkPerKw: 42,
  sanctionedLoadKw: 1,
  meterRentTk: 40,
  vatPercent: 5,
  rebatePercent: 0.5,
};

describe('projectMonth', () => {
  it('projects within the lifeline band when the pace stays low', () => {
    const result = projectMonth({
      cumulativeKwhSoFar: 5,
      recentDailyKwh: [1, 1, 1],
      daysRemainingInMonth: 27,
      config: baseConfig,
    });
    // 5 + 1*27 = 32 kWh, all within lifeline @4.63
    expect(result.projectedTotalKwh).toBeCloseTo(32, 6);
    expect(result.energyCost).toBeCloseTo(32 * 4.63, 4);
  });

  it('reprices the whole projected total under the standard ladder once it exceeds the lifeline threshold', () => {
    const result = projectMonth({
      cumulativeKwhSoFar: 20,
      recentDailyKwh: [5, 5, 5],
      daysRemainingInMonth: 10, // 20 + 50 = 70 kWh -> exceeds 50, standard ladder applies
      config: baseConfig,
    });
    expect(result.projectedTotalKwh).toBeCloseTo(70, 6);
    // 0-75 slab covers the first 70 kWh entirely @5.26 (single slab, no crossing)
    expect(result.energyCost).toBeCloseTo(70 * 5.26, 4);
  });

  it('applies rebate, VAT, demand charge and meter rent to the final estimate', () => {
    const result = projectMonth({
      cumulativeKwhSoFar: 5,
      recentDailyKwh: [1],
      daysRemainingInMonth: 0,
      config: baseConfig,
    });
    const energyCost = 5 * 4.63;
    const rebate = energyCost * 0.005;
    const afterRebate = energyCost - rebate;
    const vat = afterRebate * 0.05;
    const expectedTotal = afterRebate + vat + 42 * 1 + 40;
    expect(result.totalEstimate).toBeCloseTo(expectedTotal, 6);
  });
});
