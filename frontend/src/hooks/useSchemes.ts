import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import schemeService from '../services/schemeService';
import type { SchemeRequest } from '../types/api';

export const SCHEMES_QUERY_KEY = ['schemes'];

export const useSchemes = () => {
  return useQuery({
    queryKey: SCHEMES_QUERY_KEY,
    queryFn: () => schemeService.getAll(),
  });
};

export const useScheme = (id: number) => {
  return useQuery({
    queryKey: [...SCHEMES_QUERY_KEY, id],
    queryFn: () => schemeService.getById(id),
    enabled: !!id,
  });
};

export const useCreateScheme = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SchemeRequest) => schemeService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCHEMES_QUERY_KEY });
    },
  });
};

export const useUpdateScheme = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: SchemeRequest }) =>
      schemeService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: SCHEMES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: [...SCHEMES_QUERY_KEY, variables.id] });
    },
  });
};
