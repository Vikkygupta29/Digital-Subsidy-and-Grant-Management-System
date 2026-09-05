import { useQuery } from '@tanstack/react-query';
import analyticsService from '../services/analyticsService';

export const ANALYTICS_QUERY_KEY = ['analytics'];

export const useAnalytics = () => {
  return useQuery({
    queryKey: ANALYTICS_QUERY_KEY,
    queryFn: () => analyticsService.getSummary(),
    retry: 1,
  });
};
