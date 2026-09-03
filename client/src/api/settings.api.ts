import { api } from './client.js';
import type { AppSettings, UpdateSettingsInput } from '@electricity/shared';

export const settingsApi = {
  get: () => api.get<AppSettings>('/settings'),
  update: (input: UpdateSettingsInput) => api.put<AppSettings>('/settings', input),
};
