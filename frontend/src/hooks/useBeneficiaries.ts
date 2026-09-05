import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import beneficiaryService from '../services/beneficiaryService';
import type { BeneficiaryRequest } from '../types/api';

export const BENEFICIARIES_QUERY_KEY = ['beneficiaries'];

export const useBeneficiaries = () => {
  return useQuery({
    queryKey: BENEFICIARIES_QUERY_KEY,
    queryFn: () => beneficiaryService.getAll(),
  });
};

export const useBeneficiary = (id: number) => {
  return useQuery({
    queryKey: [...BENEFICIARIES_QUERY_KEY, id],
    queryFn: () => beneficiaryService.getById(id),
    enabled: !!id,
  });
};

export const useCreateBeneficiary = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BeneficiaryRequest) => beneficiaryService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BENEFICIARIES_QUERY_KEY });
    },
  });
};

export const useUpdateBeneficiary = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: BeneficiaryRequest }) =>
      beneficiaryService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: BENEFICIARIES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: [...BENEFICIARIES_QUERY_KEY, variables.id] });
    },
  });
};
