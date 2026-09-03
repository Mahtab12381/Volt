import { Router } from 'express';
import * as controller from '../controllers/readings.controller.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

export const readingsRouter = Router();

readingsRouter.post('/recalculate-all', asyncHandler(controller.recalculateAllHandler));
readingsRouter.post('/', asyncHandler(controller.createReading));
readingsRouter.get('/', asyncHandler(controller.listReadings));
readingsRouter.get('/:id', asyncHandler(controller.getReading));
readingsRouter.put('/:id', asyncHandler(controller.updateReading));
readingsRouter.delete('/:id', asyncHandler(controller.deleteReading));
