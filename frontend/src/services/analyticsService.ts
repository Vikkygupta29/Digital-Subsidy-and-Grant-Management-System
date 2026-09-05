import apiClient from './apiClient';
import type { AnalyticsSummary } from '../types/api';

export const analyticsService = {
  getSummary: async (): Promise<AnalyticsSummary> => {
    const response = await apiClient.get<AnalyticsSummary>('/analytics/summary');
    return response.data;
  },
};

export default analyticsService;
