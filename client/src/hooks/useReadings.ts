import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { readingsApi } from '../api/readings.api.js';
import type { CreateReadingInput, UpdateReadingInput } from '@electricity/shared';

const READINGS_KEY = ['readings'];

function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: READINGS_KEY });
  queryClient.invalidateQueries({ queryKey: ['analytics'] });
}

export function useReadingsList(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: [...READINGS_KEY, params],
    queryFn: () => readingsApi.list(params),
  });
}

export function useCreateReading() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateReadingInput) => readingsApi.create(input),
    onSuccess: () => invalidateAll(queryClient),
  });
}

export function useUpdateReading() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateReadingInput }) => readingsApi.update(id, input),
    onSuccess: () => invalidateAll(queryClient),
  });
}

export function useDeleteReading() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => readingsApi.remove(id),
    onSuccess: () => invalidateAll(queryClient),
  });
}
