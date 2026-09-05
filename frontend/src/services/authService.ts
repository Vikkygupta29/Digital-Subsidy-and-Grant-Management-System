import apiClient from './apiClient';
import type { LoginRequest, AuthResponse, RegisterRequest, RegisterResponse } from '../types/api';

export const authService = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  register: async (userData: RegisterRequest): Promise<RegisterResponse> => {
    const response = await apiClient.post<RegisterResponse>('/auth/register', userData);
    return response.data;
  },
};

export default authService;
