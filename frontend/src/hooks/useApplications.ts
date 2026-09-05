import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import applicationService from '../services/applicationService';
import type { ApplicationRequest, VerificationRequest } from '../types/api';

export const APPLICATIONS_QUERY_KEY = ['applications'];

export const useApplications = () => {
  return useQuery({
    queryKey: APPLICATIONS_QUERY_KEY,
    queryFn: () => applicationService.getAll(),
  });
};

export const usePendingApplications = () => {
  return useQuery({
    queryKey: [...APPLICATIONS_QUERY_KEY, 'pending'],
    queryFn: () => applicationService.getPending(),
  });
};

export const useApplication = (id: number) => {
  return useQuery({
    queryKey: [...APPLICATIONS_QUERY_KEY, id],
    queryFn: () => applicationService.getById(id),
    enabled: !!id,
  });
};

export const useCreateApplication = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ApplicationRequest) => applicationService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPLICATIONS_QUERY_KEY });
    },
  });
};

export const useVerifyApplication = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: VerificationRequest }) =>
      applicationService.verify(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: APPLICATIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: [...APPLICATIONS_QUERY_KEY, variables.id] });
    },
  });
};

export const useReverifyApplication = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, remarks }: { id: number; remarks?: string }) =>
      applicationService.reverify(id, remarks),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: APPLICATIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: [...APPLICATIONS_QUERY_KEY, variables.id] });
    },
  });
};
