import { ReadingModel } from '../../models/Reading.model.js';
import { DerivedIntervalModel } from '../../models/DerivedInterval.model.js';
import { MonthlyStateModel } from '../../models/MonthlyState.model.js';
import { AppSettingsModel, DEFAULT_SETTINGS, type AppSettingsData } from '../../models/AppSettings.model.js';
import { recomputeAllMonths } from './monthlyRecompute.js';
import type { RawReading, SlabBand } from './types.js';

function labelForBand(minKwh: number, maxKwh: number | null): string {
  return maxKwh === null ? `${minKwh}+` : `${minKwh}-${maxKwh}`;
}

export async function loadEngineSettings() {
  const doc = await AppSettingsModel.findById('singleton').lean();
  const settings: AppSettingsData = (doc as unknown as AppSettingsData | null) ?? DEFAULT_SETTINGS;
  const standardSlabs: SlabBand[] = settings.standardSlabs.map((s) => ({
    minKwh: s.minKwh,
    maxKwh: s.maxKwh,
    rateTkPerKwh: s.rateTkPerKwh,
    label: labelForBand(s.minKwh, s.maxKwh),
  }));
  return { settings, standardSlabs };
}

async function loadRawReadings(): Promise<RawReading[]> {
  const docs = await ReadingModel.find().sort({ timestamp: 1 }).lean();
  return docs.map((d) => ({
    id: d._id.toString(),
    timestamp: d.timestamp,
    balanceTk: d.balanceTk,
    isRecharge: d.isRecharge,
    rechargeAmountTk: d.rechargeAmountTk ?? null,
  }));
}

/**
 * Recomputes every DerivedInterval and MonthlyState from scratch. Given the
 * small size of a personal meter's reading history, a full recompute on
 * every mutation is cheap and eliminates an entire class of incremental
 * ordering bugs.
 */
export async function recalculateAll(): Promise<{ monthsRecalculated: string[] }> {
  const readings = await loadRawReadings();
  const { settings, standardSlabs } = await loadEngineSettings();

  const monthResults = recomputeAllMonths(readings, {
    lifelineSlab: settings.lifelineSlab,
    standardSlabs,
  });

  await DerivedIntervalModel.deleteMany({});
  await MonthlyStateModel.deleteMany({});

  const toObjectId = (id: string) => (id.startsWith('virtual-') ? null : id);

  for (const [month, result] of monthResults) {
    if (result.intervals.length > 0) {
      await DerivedIntervalModel.insertMany(
        result.intervals.map((interval) => ({
          fromReadingId: toObjectId(interval.fromReadingId),
          toReadingId: toObjectId(interval.toReadingId),
          fromTimestamp: interval.fromTimestamp,
          toTimestamp: interval.toTimestamp,
          tkConsumed: interval.tkConsumed,
          kwhConsumed: interval.kwhConsumed,
          isRecharge: interval.isRecharge,
          rechargeAmountTk: interval.rechargeAmountTk,
          isAutoDetectedRecharge: interval.isAutoDetectedRecharge,
          warning: interval.warning,
          slabSegments: interval.slabSegments,
          month: interval.month,
          slabTrack: interval.slabTrack,
        })),
      );
    }

    const first = result.intervals[0];
    const last = result.intervals[result.intervals.length - 1];
    await MonthlyStateModel.findOneAndUpdate(
      { month },
      {
        month,
        cumulativeKwh: result.cumulativeKwh,
        lifelineEligible: result.lifelineEligible,
        reclassifiedAt: result.reclassifiedAt,
        firstReadingId: first && !first.fromReadingId.startsWith('virtual-') ? first.fromReadingId : null,
        lastReadingId: last && !last.toReadingId.startsWith('virtual-') ? last.toReadingId : null,
      },
      { upsert: true },
    );
  }

  return { monthsRecalculated: [...monthResults.keys()] };
}
