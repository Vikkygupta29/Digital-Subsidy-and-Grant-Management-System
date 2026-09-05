import apiClient from './apiClient';
import type { BeneficiaryRequest, BeneficiaryResponse } from '../types/api';

export const beneficiaryService = {
  getAll: async (): Promise<BeneficiaryResponse[]> => {
    const response = await apiClient.get<BeneficiaryResponse[]>('/beneficiaries');
    return response.data;
  },

  getById: async (id: number): Promise<BeneficiaryResponse> => {
    const response = await apiClient.get<BeneficiaryResponse>(`/beneficiaries/${id}`);
    return response.data;
  },

  create: async (data: BeneficiaryRequest): Promise<BeneficiaryResponse> => {
    const response = await apiClient.post<BeneficiaryResponse>('/beneficiaries', data);
    return response.data;
  },

  update: async (id: number, data: BeneficiaryRequest): Promise<BeneficiaryResponse> => {
    const response = await apiClient.put<BeneficiaryResponse>(`/beneficiaries/${id}`, data);
    return response.data;
  },
};

export default beneficiaryService;
