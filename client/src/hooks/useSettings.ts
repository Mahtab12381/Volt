import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '../api/settings.api.js';
import type { UpdateSettingsInput } from '@electricity/shared';

export function useSettings() {
  return useQuery({ queryKey: ['settings'], queryFn: settingsApi.get });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateSettingsInput) => settingsApi.update(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}
