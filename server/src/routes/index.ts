import { Router } from 'express';
import { readingsRouter } from './readings.routes.js';
import { settingsRouter } from './settings.routes.js';
import { analyticsRouter } from './analytics.routes.js';

export const apiRouter = Router();

apiRouter.use('/readings', readingsRouter);
apiRouter.use('/settings', settingsRouter);
apiRouter.use('/analytics', analyticsRouter);
