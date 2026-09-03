import type { Request, Response } from 'express';
import { z } from 'zod';
import { ReadingModel } from '../models/Reading.model.js';
import { DerivedIntervalModel } from '../models/DerivedInterval.model.js';
import { recalculateAll } from '../services/calculationEngine/recalculateOrchestrator.js';

const createReadingSchema = z.object({
  timestamp: z.string().datetime().or(z.string().min(1)),
  balanceTk: z.number(),
  isRecharge: z.boolean().optional(),
  rechargeAmountTk: z.number().positive().optional(),
  note: z.string().optional(),
});

const updateReadingSchema = createReadingSchema.partial();

export async function createReading(req: Request, res: Response) {
  const parsed = createReadingSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const input = parsed.data;
  if (input.isRecharge && input.rechargeAmountTk === undefined) {
    return res.status(400).json({ error: 'rechargeAmountTk is required when isRecharge is true' });
  }

  const reading = await ReadingModel.create({
    timestamp: new Date(input.timestamp),
    balanceTk: input.balanceTk,
    isRecharge: input.isRecharge ?? false,
    rechargeAmountTk: input.rechargeAmountTk ?? null,
    note: input.note ?? null,
  });

  const recalculation = await recalculateAll();
  res.status(201).json({ reading, recalculation });
}

export async function listReadings(req: Request, res: Response) {
  const { from, to, page = '1', limit = '100' } = req.query as Record<string, string>;
  const query: Record<string, unknown> = {};
  if (from || to) {
    query.timestamp = {};
    if (from) (query.timestamp as Record<string, Date>).$gte = new Date(from);
    if (to) (query.timestamp as Record<string, Date>).$lte = new Date(to);
  }

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.max(1, Math.min(500, Number(limit)));

  const [items, total] = await Promise.all([
    ReadingModel.find(query)
      .sort({ timestamp: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean(),
    ReadingModel.countDocuments(query),
  ]);

  res.json({ items, total, page: pageNum });
}

export async function getReading(req: Request, res: Response) {
  const reading = await ReadingModel.findById(req.params.id).lean();
  if (!reading) return res.status(404).json({ error: 'Reading not found' });

  const derivedInterval = await DerivedIntervalModel.findOne({ fromReadingId: reading._id }).lean();
  res.json({ reading, derivedInterval: derivedInterval ?? null });
}

export async function updateReading(req: Request, res: Response) {
  const parsed = updateReadingSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const input = parsed.data;

  const update: Record<string, unknown> = {};
  if (input.timestamp !== undefined) update.timestamp = new Date(input.timestamp);
  if (input.balanceTk !== undefined) update.balanceTk = input.balanceTk;
  if (input.isRecharge !== undefined) update.isRecharge = input.isRecharge;
  if (input.rechargeAmountTk !== undefined) update.rechargeAmountTk = input.rechargeAmountTk;
  if (input.note !== undefined) update.note = input.note;

  const reading = await ReadingModel.findByIdAndUpdate(req.params.id, update, { new: true }).lean();
  if (!reading) return res.status(404).json({ error: 'Reading not found' });

  const recalculation = await recalculateAll();
  res.json({ reading, recalculation });
}

export async function deleteReading(req: Request, res: Response) {
  const reading = await ReadingModel.findByIdAndDelete(req.params.id).lean();
  if (!reading) return res.status(404).json({ error: 'Reading not found' });

  const recalculation = await recalculateAll();
  res.json({ deleted: true, recalculation });
}

export async function recalculateAllHandler(_req: Request, res: Response) {
  const recalculation = await recalculateAll();
  res.json(recalculation);
}
