import { Schema, model, type InferSchemaType } from 'mongoose';

const readingSchema = new Schema(
  {
    timestamp: { type: Date, required: true },
    balanceTk: { type: Number, required: true },
    isRecharge: { type: Boolean, default: false },
    rechargeAmountTk: { type: Number, default: null },
    isAutoDetectedRecharge: { type: Boolean, default: false },
    autoRechargeAmountTk: { type: Number, default: null },
    note: { type: String, default: null },
  },
  { timestamps: true },
);

readingSchema.index({ timestamp: 1 });

export type ReadingDoc = InferSchemaType<typeof readingSchema>;
export const ReadingModel = model('Reading', readingSchema);
