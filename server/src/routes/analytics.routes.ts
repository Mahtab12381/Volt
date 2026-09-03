import { Router } from 'express';
import * as controller from '../controllers/analytics.controller.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

export const analyticsRouter = Router();

analyticsRouter.get('/summary', asyncHandler(controller.summary));
analyticsRouter.get('/trend', asyncHandler(controller.trend));
analyticsRouter.get('/hourly', asyncHandler(controller.hourly));
analyticsRouter.get('/daily', asyncHandler(controller.daily));
analyticsRouter.get('/weekly', asyncHandler(controller.weekly));
analyticsRouter.get('/monthly', asyncHandler(controller.monthly));
analyticsRouter.get('/day-vs-night', asyncHandler(controller.dayVsNight));
analyticsRouter.get('/projection', asyncHandler(controller.projection));
analyticsRouter.get('/balance-series', asyncHandler(controller.balanceSeries));
