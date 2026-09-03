import { describe, expect, it } from 'vitest';
import { detectRechargeAndConsumption } from '../../src/services/calculationEngine/rechargeDetection.js';

describe('detectRechargeAndConsumption', () => {
  it('computes plain consumption when balance drops and no recharge flag', () => {
    const r = detectRechargeAndConsumption(1875.89, { balanceTk: 1869.36, isRecharge: false, rechargeAmountTk: null });
    expect(r.tkConsumed).toBeCloseTo(6.53, 6);
    expect(r.isRecharge).toBe(false);
    expect(r.isAutoDetectedRecharge).toBe(false);
    expect(r.warning).toBeNull();
  });

  it('handles an exact-match flagged recharge', () => {
    // prev 100, consumed 10 -> would be 90, then recharge +500 -> 590
    const r = detectRechargeAndConsumption(100, { balanceTk: 590, isRecharge: true, rechargeAmountTk: 500 });
    expect(r.tkConsumed).toBeCloseTo(10, 6);
    expect(r.isRecharge).toBe(true);
    expect(r.rechargeAmountTk).toBeCloseTo(500, 6);
    expect(r.isAutoDetectedRecharge).toBe(false);
  });

  it('auto-adds the shortfall when the declared recharge is insufficient', () => {
    // prev 100, declared recharge 400, but actual new balance is 550 (recharge was bigger than declared)
    const r = detectRechargeAndConsumption(100, { balanceTk: 550, isRecharge: true, rechargeAmountTk: 400 });
    expect(r.tkConsumed).toBe(0);
    expect(r.isAutoDetectedRecharge).toBe(true);
    expect(r.rechargeAmountTk).toBeCloseTo(450, 6); // 400 declared + 50 shortfall
    expect(r.warning).toMatch(/insufficient/i);
  });

  it('auto-detects an unflagged balance increase as a recharge with zero consumption', () => {
    const r = detectRechargeAndConsumption(100, { balanceTk: 300, isRecharge: false, rechargeAmountTk: null });
    expect(r.tkConsumed).toBe(0);
    expect(r.isRecharge).toBe(true);
    expect(r.isAutoDetectedRecharge).toBe(true);
    expect(r.rechargeAmountTk).toBeCloseTo(200, 6);
    expect(r.warning).toMatch(/without a recharge flag/i);
  });

  it('never returns negative consumption', () => {
    const r1 = detectRechargeAndConsumption(50, { balanceTk: 50, isRecharge: false, rechargeAmountTk: null });
    expect(r1.tkConsumed).toBeGreaterThanOrEqual(0);
    const r2 = detectRechargeAndConsumption(50, { balanceTk: 1000, isRecharge: true, rechargeAmountTk: 1 });
    expect(r2.tkConsumed).toBeGreaterThanOrEqual(0);
  });
});
