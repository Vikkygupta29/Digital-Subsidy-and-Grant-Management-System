import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { AuthResponse, LoginRequest, UserRole } from '../types/api';
import authService from '../services/authService';

interface AuthUser {
  id: number;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<AuthResponse>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('subsidy_token');
    const storedUser = localStorage.getItem('subsidy_user');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse stored user session', e);
        localStorage.removeItem('subsidy_token');
        localStorage.removeItem('subsidy_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginRequest): Promise<AuthResponse> => {
    const data = await authService.login(credentials);
    const authUser: AuthUser = {
      id: data.id,
      email: data.email,
      role: data.role,
    };

    setToken(data.token);
    setUser(authUser);

    localStorage.setItem('subsidy_token', data.token);
    localStorage.setItem('subsidy_user', JSON.stringify(authUser));

    return data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('subsidy_token');
    localStorage.removeItem('subsidy_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
