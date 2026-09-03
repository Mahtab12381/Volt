import { Router } from 'express';
import * as controller from '../controllers/settings.controller.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

export const settingsRouter = Router();

settingsRouter.get('/', asyncHandler(controller.getSettings));
settingsRouter.put('/', asyncHandler(controller.updateSettings));
