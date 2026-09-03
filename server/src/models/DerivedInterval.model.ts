import { Schema, model, Types, type InferSchemaType } from 'mongoose';

const slabSegmentSchema = new Schema(
  {
    slabLabel: { type: String, required: true },
    rateTkPerKwh: { type: Number, required: true },
    kwh: { type: Number, required: true },
    tk: { type: Number, required: true },
    startCumulativeKwh: { type: Number, required: true },
    endCumulativeKwh: { type: Number, required: true },
    fromTimestamp: { type: Date, required: true },
    toTimestamp: { type: Date, required: true },
  },
  { _id: false },
);

const derivedIntervalSchema = new Schema(
  {
    // Nullable: an interval crossing a month boundary is split at a virtual
    // reading (see calculationEngine/monthlyRecompute.ts), so one side of the
    // split has no corresponding real Reading document.
    fromReadingId: { type: Schema.Types.ObjectId, ref: 'Reading', default: null },
    toReadingId: { type: Schema.Types.ObjectId, ref: 'Reading', default: null },
    fromTimestamp: { type: Date, required: true },
    toTimestamp: { type: Date, required: true },
    tkConsumed: { type: Number, required: true },
    kwhConsumed: { type: Number, required: true },
    isRecharge: { type: Boolean, default: false },
    rechargeAmountTk: { type: Number, default: 0 },
    isAutoDetectedRecharge: { type: Boolean, default: false },
    warning: { type: String, default: null },
    slabSegments: { type: [slabSegmentSchema], default: [] },
    month: { type: String, required: true },
    slabTrack: { type: String, enum: ['lifeline', 'standard'], required: true },
  },
  { timestamps: true },
);

derivedIntervalSchema.index({ fromTimestamp: 1 });
derivedIntervalSchema.index({ month: 1 });

export type DerivedIntervalDoc = InferSchemaType<typeof derivedIntervalSchema>;
export const DerivedIntervalModel = model('DerivedInterval', derivedIntervalSchema);
export { Types };
