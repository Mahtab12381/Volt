import type { Request, Response } from 'express';
import * as analyticsService from '../services/analyticsService.js';
import { bdMonthKey } from '../services/calculationEngine/time.js';

function parseDate(value: unknown): Date | undefined {
  if (typeof value !== 'string' || value.length === 0) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function currentMonthKey(): string {
  return bdMonthKey(new Date());
}

export async function summary(req: Request, res: Response) {
  const month = (req.query.month as string) || currentMonthKey();
  res.json(await analyticsService.getSummary(month));
}

export async function trend(req: Request, res: Response) {
  const month = (req.query.month as string) || currentMonthKey();
  res.json(await analyticsService.getTrend(month));
}

export async function hourly(req: Request, res: Response) {
  const mode = (req.query.mode as string) === 'average' ? 'average' : 'single';
  if (mode === 'single') {
    const date = parseDate(req.query.date) ?? new Date();
    res.json({ buckets: await analyticsService.getHourly({ mode: 'single', date }) });
  } else {
    res.json({
      buckets: await analyticsService.getHourly({ mode: 'average', from: parseDate(req.query.from), to: parseDate(req.query.to) }),
    });
  }
}

export async function daily(req: Request, res: Response) {
  const points = await analyticsService.getDaily(parseDate(req.query.from), parseDate(req.query.to));
  res.json({ points });
}

export async function weekly(req: Request, res: Response) {
  const points = await analyticsService.getWeekly(parseDate(req.query.from), parseDate(req.query.to));
  res.json({ points });
}

export async function monthly(req: Request, res: Response) {
  const points = await analyticsService.getMonthly(parseDate(req.query.from), parseDate(req.query.to));
  res.json({ points });
}

export async function dayVsNight(req: Request, res: Response) {
  res.json(await analyticsService.getDayNight(parseDate(req.query.from), parseDate(req.query.to)));
}

export async function projection(req: Request, res: Response) {
  const month = (req.query.month as string) || currentMonthKey();
  res.json(await analyticsService.getProjection(month));
}

export async function balanceSeries(req: Request, res: Response) {
  const points = await analyticsService.getBalanceSeries(parseDate(req.query.from), parseDate(req.query.to));
  res.json({ points });
}
