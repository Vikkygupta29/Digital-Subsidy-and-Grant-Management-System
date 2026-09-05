import apiClient from './apiClient';
import type { SchemeRequest, SchemeResponse } from '../types/api';

export const schemeService = {
  getAll: async (): Promise<SchemeResponse[]> => {
    const response = await apiClient.get<SchemeResponse[]>('/schemes');
    return response.data;
  },

  getById: async (id: number): Promise<SchemeResponse> => {
    const response = await apiClient.get<SchemeResponse>(`/schemes/${id}`);
    return response.data;
  },

  create: async (data: SchemeRequest): Promise<SchemeResponse> => {
    const response = await apiClient.post<SchemeResponse>('/schemes', data);
    return response.data;
  },

  update: async (id: number, data: SchemeRequest): Promise<SchemeResponse> => {
    const response = await apiClient.put<SchemeResponse>(`/schemes/${id}`, data);
    return response.data;
  },
};

export default schemeService;
