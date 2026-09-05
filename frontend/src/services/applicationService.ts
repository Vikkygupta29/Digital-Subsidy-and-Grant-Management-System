import apiClient from './apiClient';
import type {
  ApplicationRequest,
  ApplicationResponse,
  VerificationRequest,
} from '../types/api';

export const applicationService = {
  getAll: async (): Promise<ApplicationResponse[]> => {
    const response = await apiClient.get<ApplicationResponse[]>('/applications');
    return response.data;
  },

  getPending: async (): Promise<ApplicationResponse[]> => {
    const response = await apiClient.get<ApplicationResponse[]>('/applications/pending');
    return response.data;
  },

  getById: async (id: number): Promise<ApplicationResponse> => {
    const response = await apiClient.get<ApplicationResponse>(`/applications/${id}`);
    return response.data;
  },

  create: async (data: ApplicationRequest): Promise<ApplicationResponse> => {
    const response = await apiClient.post<ApplicationResponse>('/applications', data);
    return response.data;
  },

  verify: async (id: number, data: VerificationRequest): Promise<ApplicationResponse> => {
    const response = await apiClient.put<ApplicationResponse>(`/applications/${id}/verify`, data);
    return response.data;
  },

  reverify: async (id: number, remarks?: string): Promise<ApplicationResponse> => {
    const response = await apiClient.put<ApplicationResponse>(
      `/applications/${id}/reverify`,
      remarks ? { remarks } : {}
    );
    return response.data;
  },
};

export default applicationService;
