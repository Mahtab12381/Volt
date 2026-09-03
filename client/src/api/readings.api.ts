import { api } from './client.js';
import type { CreateReadingInput, DerivedInterval, Reading, UpdateReadingInput } from '@electricity/shared';

export interface ReadingsListResponse {
  items: Reading[];
  total: number;
  page: number;
}

export interface RecalculationResult {
  monthsRecalculated: string[];
}

export const readingsApi = {
  list: (params?: { from?: string; to?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.from) q.set('from', params.from);
    if (params?.to) q.set('to', params.to);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    const qs = q.toString();
    return api.get<ReadingsListResponse>(`/readings${qs ? `?${qs}` : ''}`);
  },
  get: (id: string) => api.get<{ reading: Reading; derivedInterval: DerivedInterval | null }>(`/readings/${id}`),
  create: (input: CreateReadingInput) => api.post<{ reading: Reading; recalculation: RecalculationResult }>('/readings', input),
  update: (id: string, input: UpdateReadingInput) =>
    api.put<{ reading: Reading; recalculation: RecalculationResult }>(`/readings/${id}`, input),
  remove: (id: string) => api.delete<{ deleted: true; recalculation: RecalculationResult }>(`/readings/${id}`),
  recalculateAll: () => api.post<RecalculationResult>('/readings/recalculate-all'),
};
